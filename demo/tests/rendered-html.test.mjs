import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the finished capstone application", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Flight Arrival Delay Intelligence<\/title>/i);
  assert.match(html, /Flight Arrival/i);
  assert.match(html, /96\.49%/);
  assert.match(html, /Predict a flight/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("ships the exact trained metrics and validation examples", async () => {
  const artifact = JSON.parse(
    await readFile(new URL("../public/model-artifact.json", import.meta.url), "utf8"),
  );
  assert.equal(artifact.metrics.classifier.testAuc, 0.9649);
  assert.equal(artifact.metrics.classifier.f1, 0.8214);
  assert.equal(artifact.metrics.regressor.mae, 7.2919);
  assert.equal(artifact.metrics.regressor.r2, 0.9579);
  assert.equal(artifact.validationExamples.length, 5);
  assert.ok(Object.keys(artifact.classifier.categorical.Origin).length > 300);
});

test("browser inference reproduces scikit-learn validation predictions", async () => {
  const artifact = JSON.parse(
    await readFile(new URL("../public/model-artifact.json", import.meta.url), "utf8"),
  );
  const { runPrediction } = await import(new URL("../app/model.ts", import.meta.url));
  for (const example of artifact.validationExamples) {
    const rawTime = String(example.input.scheduledDeparture).padStart(4, "0");
    const flightDate = `2018-${String(example.input.month).padStart(2, "0")}-${String(example.input.dayOfMonth).padStart(2, "0")}`;
    const result = runPrediction(artifact, {
      airline: example.input.airline,
      origin: example.input.origin,
      destination: example.input.destination,
      flightDate,
      scheduledDeparture: `${rawTime.slice(0, 2)}:${rawTime.slice(2)}`,
      departureDelay: example.input.departureDelay,
      taxiOut: example.input.taxiOut,
      scheduledDuration: example.input.scheduledDuration,
    });
    assert.ok(Math.abs(result.probability - example.expected.delayProbability) < 1e-6);
    assert.ok(Math.abs(result.predictedDelay - example.expected.arrivalDelay) < 1e-5);
  }
});
