"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  airlineRates,
  classificationModels,
  crossCuttingPlots,
  dataChecks,
  dayDelay,
  dbscanGroups,
  hyperparameterRuns,
  kmeansClusters,
  monthDelay,
  navItems,
  overfittingGaps,
  PlotId,
  plots,
  regressionModels,
  requirementParts,
} from "./data";
import {
  ModelArtifact,
  PredictionInput,
  PredictionResult,
  runPrediction,
} from "./model";

type ViewId = (typeof navItems)[number][0];
type Track = "classification" | "regression";

const DEFAULT_INPUT: PredictionInput = {
  airline: "Delta Air Lines Inc.",
  origin: "ATL",
  destination: "JFK",
  flightDate: "2018-08-15",
  scheduledDeparture: "14:30",
  departureDelay: 28,
  taxiOut: 21,
  scheduledDuration: 155,
};

function Dot({ tone = "aqua" }: { tone?: "aqua" | "orange" | "purple" | "green" }) {
  return <span className={`dot dot-${tone}`} aria-hidden="true" />;
}

function PageHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="page-heading">
      <p className="eyebrow"><Dot />{eyebrow}</p>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}

function Metric({ value, label, tone = "aqua" }: { value: string; label: string; tone?: "aqua" | "orange" | "purple" | "green" }) {
  return (
    <article className={`metric-card${tone === "green" ? " metric-best" : ""}`}>
      <Dot tone={tone} />
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function Insight({ children }: { children: ReactNode }) {
  return <div className="insight-strip"><Dot tone="orange" /><strong>{children}</strong></div>;
}

/** Wraps content in a clearly labelled Classification or Regression band. */
function TrackPanel({
  track,
  target,
  question,
  children,
}: {
  track: Track;
  target: string;
  question: string;
  children: ReactNode;
}) {
  const isClf = track === "classification";
  return (
    <section className={`track-panel track-${track}`}>
      <header className="track-header">
        <span className="track-tag">{isClf ? "Classification" : "Regression"}</span>
        <div className="track-question">
          <strong>{question}</strong>
          <code>{target}</code>
        </div>
      </header>
      <div className="track-body">{children}</div>
    </section>
  );
}

function TrackSplit({ children }: { children: ReactNode }) {
  return <div className="track-split">{children}</div>;
}

function Figure({ id, wide = false }: { id: PlotId; wide?: boolean }) {
  const plot = plots[id];
  return (
    <figure className={`figure${wide ? " figure-wide" : ""}`}>
      {/* Static notebook exports served straight from /public; the image optimizer
          binding is not required to run this demo locally. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/plots/${id}.png`} alt={plot.title} loading="lazy" />
      <figcaption><strong>{plot.title}</strong><span>{plot.caption}</span></figcaption>
    </figure>
  );
}

function HorizontalBars({
  data,
  max,
  suffix = "",
  color = "blue",
}: {
  data: readonly (readonly [string, number])[];
  max: number;
  suffix?: string;
  color?: "blue" | "purple" | "orange";
}) {
  return (
    <div className="bar-list">
      {data.map(([label, value]) => (
        <div className="bar-row" key={label}>
          <div className="bar-meta"><span>{label}</span><strong>{value.toFixed(2)}{suffix}</strong></div>
          <div className="bar-track" role="img" aria-label={`${label}: ${value.toFixed(2)}${suffix}`}>
            <span className={`bar-fill bar-${color}`} style={{ width: `${Math.max(2, (value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Overview({ navigate }: { navigate: (view: ViewId) => void }) {
  return (
    <section className="view overview-view">
      <div className="hero-orbit orbit-one" aria-hidden="true" />
      <div className="hero-orbit orbit-two" aria-hidden="true" />
      <div className="hero-copy">
        <p className="hero-kicker">MACHINE LEARNING CAPSTONE · 2018 US FLIGHTS</p>
        <h1>Flight Arrival<br />Delay Intelligence</h1>
        <p className="hero-lede">Two separate problems on one shared split: whether a flight lands 15+ minutes late, and how many minutes early or late it arrives. In both, the simple baseline won.</p>
        <div className="hero-actions">
          <button className="button button-primary" onClick={() => navigate("predict")}>Predict a flight</button>
          <button className="button button-secondary" onClick={() => navigate("plots")}>Browse the plots</button>
        </div>
      </div>

      <div className="metric-grid hero-metrics">
        <Metric value="5.69M" label="raw flight records" />
        <Metric value="8" label="models compared" tone="orange" />
        <Metric value="96.49%" label="test ROC-AUC · classification" tone="green" />
        <Metric value="7.29 min" label="mean absolute error · regression" tone="green" />
      </div>

      <TrackSplit>
        <TrackPanel track="classification" target="ArrDel15" question="Will the flight land 15 minutes late or more?">
          <div className="winner-block">
            <span className="best-badge">Best of 4</span>
            <h3>Logistic Regression</h3>
            <p>The baseline beat every more complex classifier on test ROC-AUC and generalized the tightest.</p>
            <dl className="winner-stats">
              <div><dt>Test ROC-AUC</dt><dd>96.49%</dd></div>
              <div><dt>Train–val gap</dt><dd>0.011</dd></div>
            </dl>
          </div>
        </TrackPanel>
        <TrackPanel track="regression" target="ArrDelay" question="How many minutes early or late will it arrive?">
          <div className="winner-block">
            <span className="best-badge">Best of 4</span>
            <h3>Linear Regression</h3>
            <p>The baseline won outright on R² and mean absolute error; extra flexibility bought nothing.</p>
            <dl className="winner-stats">
              <div><dt>Test R²</dt><dd>95.79%</dd></div>
              <div><dt>Test MAE</dt><dd>7.29 min</dd></div>
            </dl>
          </div>
        </TrackPanel>
      </TrackSplit>

      <Insight>Both winners are the baselines. The product is a post-departure, wheels-off update because actual TaxiOut is part of the approved feature set.</Insight>
      <footer className="team-line">Khalid Al Dosari · Abdulaziz Alshareef · Anas Alzahrani · Feras Madkhali <span>Tuwaiq Bootcamp</span></footer>
    </section>
  );
}

/** One independent input form + result panel per model. */
function ModelPredictor({
  track,
  artifact,
}: {
  track: Track;
  artifact: ModelArtifact | null;
}) {
  const [form, setForm] = useState<PredictionInput>(DEFAULT_INPUT);
  const [submitted, setSubmitted] = useState<PredictionResult | null>(null);
  const [error, setError] = useState("");
  const isClf = track === "classification";

  const result = useMemo(
    () => submitted ?? (artifact ? runPrediction(artifact, DEFAULT_INPUT) : null),
    [artifact, submitted],
  );

  function update<K extends keyof PredictionInput>(key: K, value: PredictionInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!artifact) return;
    try {
      setError("");
      setSubmitted(runPrediction(artifact, form));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Check the flight details.");
    }
  }

  const probability = result ? Math.round(result.probability * 100) : 0;
  const delayText = result
    ? result.predictedDelay >= 0
      ? `${Math.round(result.predictedDelay)} min late`
      : `${Math.abs(Math.round(result.predictedDelay))} min early`
    : "—";

  const idp = `${track}-`;

  return (
    <div className="predictor">
      <form className="predictor-form" onSubmit={submit}>
        <div className="section-title">
          <span>{isClf ? "Logistic Regression inputs" : "Linear Regression inputs"}</span>
          <button type="button" className="text-button" onClick={() => { setForm(DEFAULT_INPUT); setError(""); }}>Reset</button>
        </div>
        <div className="form-grid">
          <label className="field field-wide"><span>Airline</span>
            <select value={form.airline} onChange={(event) => update("airline", event.target.value)} disabled={!artifact}>
              {(artifact?.options.airlines ?? [DEFAULT_INPUT.airline]).map((airline) => <option key={airline}>{airline}</option>)}
            </select>
          </label>
          <label className="field"><span>Origin</span><input list={`${idp}origin-options`} value={form.origin} onChange={(event) => update("origin", event.target.value.toUpperCase())} maxLength={3} /></label>
          <label className="field"><span>Destination</span><input list={`${idp}destination-options`} value={form.destination} onChange={(event) => update("destination", event.target.value.toUpperCase())} maxLength={3} /></label>
          <datalist id={`${idp}origin-options`}>{artifact?.options.origins.map((item) => <option key={item} value={item} />)}</datalist>
          <datalist id={`${idp}destination-options`}>{artifact?.options.destinations.map((item) => <option key={item} value={item} />)}</datalist>
          <label className="field"><span>Flight date</span><input type="date" value={form.flightDate} onChange={(event) => update("flightDate", event.target.value)} /></label>
          <label className="field"><span>Scheduled departure</span><input type="time" value={form.scheduledDeparture} onChange={(event) => update("scheduledDeparture", event.target.value)} /></label>
          <label className="field"><span>Departure delay (min)</span><input type="number" min="-60" max="1200" value={form.departureDelay} onChange={(event) => update("departureDelay", Number(event.target.value))} /></label>
          <label className="field"><span>Taxi-out (min)</span><input type="number" min="0" max="300" value={form.taxiOut} onChange={(event) => update("taxiOut", Number(event.target.value))} /></label>
          <label className="field field-wide"><span>Scheduled flight duration (min)</span><input type="number" min="15" max="900" value={form.scheduledDuration} onChange={(event) => update("scheduledDuration", Number(event.target.value))} /></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary button-full" type="submit" disabled={!artifact}>
          {artifact ? (isClf ? "Run classification" : "Run regression") : "Loading trained model…"}
        </button>
      </form>

      <div className="predictor-result" aria-live="polite">
        {isClf ? (
          <>
            <div className="result-topline">
              <span>Delay probability</span>
              <span className={`risk-badge risk-${result?.risk.toLowerCase() ?? "low"}`}>{result?.risk ?? "Waiting"}</span>
            </div>
            <div className="probability-layout">
              <div className="probability-ring" style={{ background: `conic-gradient(var(--purple) ${probability}%, var(--lavender) 0)` }}><span>{probability}%</span></div>
              <div>
                <h3>{result && result.probability >= 0.5 ? "Likely delayed 15+" : "Likely under 15 min"}</h3>
                <p>Decision threshold 50%. ROC-AUC is the primary metric, not accuracy.</p>
              </div>
            </div>
            <div className="drivers">
              <h4>Strongest contributions</h4>
              {result?.contributions.map((item) => (
                <div className="driver-row" key={item.key}>
                  <span>{item.label}</span>
                  <strong className={item.value >= 0 ? "raises" : "lowers"}>{item.value >= 0 ? "Raises risk" : "Lowers risk"}</strong>
                </div>
              )) ?? <p>Run a prediction to see contributions.</p>}
            </div>
          </>
        ) : (
          <>
            <div className="result-topline"><span>Predicted arrival delay</span><span>MAE ±7.29 min</span></div>
            <div className="delay-result">
              <strong>{delayText}</strong>
              <div><span>Updated arrival</span><b>{result?.updatedArrival ?? "—"}</b></div>
            </div>
            <p className="result-note">Typical absolute error is 7.29 minutes. That is an error reference, not a formal confidence interval.</p>
            <div className="drivers">
              <h4>Reference metrics</h4>
              <div className="driver-row"><span>Test R²</span><strong>95.79%</strong></div>
              <div className="driver-row"><span>Test RMSE</span><strong>10.35 min</strong></div>
              <div className="driver-row"><span>Test MAE</span><strong>7.29 min</strong></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Predict({ artifact }: { artifact: ModelArtifact | null }) {
  return (
    <section className="view">
      <PageHeading eyebrow="Live model demo" title="Predict one flight" subtitle="Each selected model has its own inputs and its own result, so the two problems stay separate. Both run locally in your browser from the trained coefficients." />
      <div className="scope-note"><Dot tone="orange" /><div><strong>Prediction boundary</strong><p>Actual TaxiOut is required, so this is a wheels-off update. It is not a pre-departure forecast.</p></div></div>

      <TrackSplit>
        <TrackPanel track="classification" target="ArrDel15" question="Will it land 15+ minutes late?">
          <ModelPredictor track="classification" artifact={artifact} />
        </TrackPanel>
        <TrackPanel track="regression" target="ArrDelay" question="How many minutes early or late?">
          <ModelPredictor track="regression" artifact={artifact} />
        </TrackPanel>
      </TrackSplit>
    </section>
  );
}

function DataView() {
  return (
    <section className="view">
      <PageHeading eyebrow="Parts 1–3, 5–6" title="The data, prepared defensibly" subtitle="Cleaning, features and the split are shared by both problems. Only the target column differs, so the two tracks are separated at the target." />
      <div className="metric-grid">
        <Metric value="5,689,512" label="rows in raw file" />
        <Metric value="61" label="columns before selection" tone="orange" />
        <Metric value="5,578,560" label="rows after cleaning" />
        <Metric value="30,000" label="rows modelled" tone="orange" />
      </div>

      <h2 className="section-heading">Shared pipeline</h2>
      <div className="table-card">
        <div className="table-title"><div><Dot /><h2>Seven checks and seven decisions</h2></div><span>Decision matters more than method</span></div>
        <div className="data-table" role="table" aria-label="Data quality checks">
          <div className="data-row data-header" role="row"><span>Check</span><span>What we found</span><span>Decision</span></div>
          {dataChecks.map((row, index) => <div className="data-row" role="row" key={row.check}><span><b>{String(index + 1).padStart(2, "0")}</b>{row.check}</span><span>{row.found}</span><strong>{row.decision}</strong></div>)}
        </div>
      </div>
      <div className="two-col">
        <article className="soft-card"><h2><Dot />Legal at wheels-off</h2><p>DepDelay, TaxiOut, CRSElapsedTime, scheduled time, Month, DayofMonth, DayOfWeek, Airline, Origin and Dest.</p></article>
        <article className="soft-card"><h2><Dot tone="orange" />Banned after landing</h2><p>ArrTime, WheelsOn, TaxiIn, ActualElapsedTime, AirTime, ArrDelayMinutes, ArrivalDelayGroups and DivAirportLandings.</p></article>
      </div>
      <div className="split-flow">
        <div><span>60%</span><strong>Train</strong><small>18,000 rows</small></div>
        <div><span>20%</span><strong>Validation</strong><small>6,000 rows</small></div>
        <div><span>20%</span><strong>Test</strong><small>6,000 rows · evaluated once</small></div>
      </div>
      <div className="figure-grid">
        <Figure id="missing-values" />
        <Figure id="outliers" />
      </div>

      <h2 className="section-heading">Where the two problems split</h2>
      <TrackSplit>
        <TrackPanel track="classification" target="ArrDel15" question="Binary target: 1 when arrival delay ≥ 15 min">
          <p className="track-note">The split is stratified on this column, so the 19.5% delay rate is preserved in train, validation and test.</p>
          <Figure id="class-balance" />
          <Figure id="target-distribution" />
        </TrackPanel>
        <TrackPanel track="regression" target="ArrDelay" question="Continuous target: arrival delay in minutes">
          <p className="track-note">Values may be negative when a flight arrives early. The long right tail is kept deliberately: it is the phenomenon being predicted.</p>
          <div className="stat-rows">
            <div><span>Range kept</span><strong>Full distribution</strong></div>
            <div><span>Skewness</span><strong>8.46</strong></div>
            <div><span>Outliers flagged by IQR</span><strong>9.4%</strong></div>
            <div><span>Outliers removed</span><strong>None</strong></div>
          </div>
        </TrackPanel>
      </TrackSplit>
      <Insight>Both targets sit on the same rows, the same features and the same split, so every comparison across the two tracks is like for like.</Insight>
    </section>
  );
}

function Explore() {
  const dayMax = Math.max(...dayDelay.map(([, value]) => value));
  const monthMax = Math.max(...monthDelay);
  return (
    <section className="view">
      <PageHeading eyebrow="Part 4 · Exploratory analysis" title="Five findings shaped the model" subtitle="Findings are grouped by the target they speak to: delay rate evidence for classification, delay magnitude evidence for regression." />
      <div className="feature-story">
        <article className="story-lead"><span>0.96</span><div><h2>Departure delay dominates</h2><p>DepDelay is almost the whole problem for both targets. It creates a strong post-departure model and also sets the ceiling on what it can learn.</p></div></article>
        <article className="story-stat"><Dot tone="orange" /><strong>0.22</strong><span>TaxiOut → ArrDelay</span></article>
        <article className="story-stat"><Dot /><strong>-0.02</strong><span>Distance → ArrDelay</span></article>
      </div>

      <TrackSplit>
        <TrackPanel track="classification" target="ArrDel15" question="What moves the delayed-or-not rate?">
          <article className="chart-card flush"><div className="chart-heading"><h2>Carriers are not equal</h2><span>Delay rate, ten largest carriers</span></div><HorizontalBars data={airlineRates} max={30} suffix="%" color="purple" /></article>
          <Figure id="delay-by-airline" />
          <p className="track-note">JetBlue’s 27.31% delay rate is more than twice Delta’s 12.50%, so Airline earns its place as a categorical feature.</p>
        </TrackPanel>
        <TrackPanel track="regression" target="ArrDelay" question="What moves the delay in minutes?">
          <article className="chart-card flush"><div className="chart-heading"><h2>Friday is worst; Saturday calmest</h2><span>Mean arrival delay by day</span></div><HorizontalBars data={dayDelay} max={dayMax} suffix=" min" color="orange" /></article>
          <article className="chart-card flush"><div className="chart-heading"><h2>Summer carries a clear signal</h2><span>Mean arrival delay by month</span></div><div className="column-chart" aria-label="Mean arrival delay by month">{monthDelay.map((value, index) => <div key={index}><span style={{ height: `${(value / monthMax) * 100}%` }} /><small>{index + 1}</small></div>)}</div></article>
          <div className="figure-grid">
            <Figure id="delay-by-day" />
            <Figure id="delay-by-month" />
          </div>
        </TrackPanel>
      </TrackSplit>

      <div className="insight-grid">
        {["Delay compounds through the day: about -3 min at 5am to +12 min around 6pm.", "August averages 11.51 min; September and October are near 3 min.", "JetBlue’s 27.31% delay rate is more than twice Delta’s 12.50%.", "Distance and scheduled duration duplicate each other but barely explain lateness."].map((text, index) => <article key={text}><span>{String(index + 2).padStart(2, "0")}</span><p>{text}</p></article>)}
      </div>
      <Insight>The combined correlation and departure-hour figure spans several findings at once, so it lives in the Plots tab.</Insight>
    </section>
  );
}

function ModelTable({
  track,
  rows,
}: {
  track: Track;
  rows: { name: string; value: number; label: string; selected?: boolean; baseline?: boolean }[];
}) {
  const max = Math.max(...rows.map((row) => row.value));
  return (
    <div className="model-list">
      {rows.map((row) => (
        <div className={`model-row${row.selected ? " selected" : ""}`} key={row.name}>
          <span>
            {row.name}
            {row.baseline && <em className="tag-baseline">Baseline</em>}
            {row.selected && <em className="tag-best">Best</em>}
          </span>
          <div className="mini-track">
            <i className={row.selected ? "fill-best" : track === "classification" ? "fill-clf" : "fill-reg"}
               style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} />
          </div>
          <strong>{row.label}</strong>
        </div>
      ))}
    </div>
  );
}

function Models() {
  return (
    <section className="view">
      <PageHeading eyebrow="Parts 7–12" title="The baselines won both problems" subtitle="Four algorithms per target on one shared split. In each track the simple baseline is the selected model, marked in green throughout." />

      <div className="metric-grid">
        <Metric value="Logistic Regression" label="selected classifier" tone="green" />
        <Metric value="96.49%" label="its test ROC-AUC" tone="green" />
        <Metric value="Linear Regression" label="selected regressor" tone="green" />
        <Metric value="95.79%" label="its test R²" tone="green" />
      </div>

      <TrackSplit>
        <TrackPanel track="classification" target="ArrDel15" question="Four classifiers, judged on test ROC-AUC">
          <div className="winner-block compact">
            <span className="best-badge">Selected</span>
            <h3>Logistic Regression <em>baseline</em></h3>
            <p>Best test ROC-AUC, smallest train–validation gap, trains in under a second and its coefficients are readable.</p>
          </div>
          <ModelTable
            track="classification"
            rows={classificationModels.map((model) => ({
              name: model.name,
              value: model.test,
              label: `${(model.test * 100).toFixed(2)}%`,
              selected: model.selected,
              baseline: model.baseline,
            }))}
          />
          <h4 className="mini-heading">Overfitting gap · train minus validation</h4>
          <ModelTable
            track="classification"
            rows={overfittingGaps.map((row) => ({
              name: row.name,
              value: 0.05 - row.gap,
              label: row.gap.toFixed(3),
              selected: row.baseline,
              baseline: row.baseline,
            }))}
          />
          <p className="track-note">Lower is better; the bar length shows headroom below the 0.05 “substantial overfitting” line. No model crosses it.</p>
          <h4 className="mini-heading">Hyperparameter sweeps</h4>
          <div className="sweep-list">
            {hyperparameterRuns.map((run) => (
              <div key={run.model}><span>{run.model} · {run.parameter}</span><strong>{run.chosen}</strong><p>{run.note}</p></div>
            ))}
          </div>
          <div className="figure-grid">
            <Figure id="knn-sweep" />
            <Figure id="xgboost-sweep" />
          </div>
          <Figure id="svm-sweep" />
        </TrackPanel>

        <TrackPanel track="regression" target="ArrDelay" question="Four regressors, judged on test R² and MAE">
          <div className="winner-block compact">
            <span className="best-badge">Selected</span>
            <h3>Linear Regression <em>baseline</em></h3>
            <p>Best test R² and MAE of all four. ArrDelay is close to linear in DepDelay, so added flexibility cost generalization without buying accuracy.</p>
          </div>
          <ModelTable
            track="regression"
            rows={regressionModels.map((model) => ({
              name: model.name,
              value: model.r2,
              label: `${(model.r2 * 100).toFixed(2)}%`,
              selected: model.selected,
              baseline: model.baseline,
            }))}
          />
          <h4 className="mini-heading">Mean absolute error · minutes, lower is better</h4>
          <ModelTable
            track="regression"
            rows={regressionModels.map((model) => ({
              name: model.name,
              value: 14 - model.mae,
              label: `${model.mae.toFixed(2)} min`,
              selected: model.selected,
              baseline: model.baseline,
            }))}
          />
          <p className="track-note">No hyperparameter sweep was run on the regression track; all three sweeps in Part 11 score classification ROC-AUC.</p>
          <div className="stat-rows">
            <div><span>Test RMSE · selected</span><strong>10.35 min</strong></div>
            <div><span>Test MAE · selected</span><strong>7.29 min</strong></div>
            <div><span>Weakest model</span><strong>SVR, R² 0.615</strong></div>
          </div>
        </TrackPanel>
      </TrackSplit>

      <Insight>The strongest model is the one that generalizes and fits the deployment, not the most sophisticated algorithm. Side-by-side comparison figures live in the Plots tab.</Insight>
    </section>
  );
}

function Errors() {
  const matrix = [[4502, 329], [125, 1044]];
  const residuals = [["On time", -2.57], ["0–15 min", 4.45], ["15–60 min", 5.69], ["60–200 min", 5.17], ["200+ min", 4.00]] as const;
  return (
    <section className="view">
      <PageHeading eyebrow="Part 13 · Error analysis" title="The failures reveal the boundary" subtitle="Each track fails in its own way: classification misses flights that left on time, regression softens the severity of delays already underway." />

      <TrackSplit>
        <TrackPanel track="classification" target="ArrDel15" question="Where does the classifier get it wrong?">
          <div className="matrix-counts">
            {matrix.flatMap((row, r) => row.map((value, c) => (
              <div className={`count-cell${r === c ? " correct" : " wrong"}`} key={`${r}-${c}`}>
                <strong>{value.toLocaleString()}</strong>
                <small>{r === 0 ? "On time" : "Delayed"} → {c === 0 ? "on time" : "delayed"}</small>
              </div>
            )))}
          </div>
          <Figure id="confusion-matrix" />
          <div className="error-findings">
            <article><Dot tone="orange" /><div><h2>125 false negatives</h2><p>Mean DepDelay is only 0.15 min. They left on time and lost time in the air, beyond the current feature set.</p></div></article>
            <article><Dot /><div><h2>329 false positives</h2><p>Mean DepDelay is 12.3 min and TaxiOut 22.6 min. They looked risky, then recovered en route.</p></div></article>
          </div>
          <p className="track-note">False negatives matter more operationally, which supports balanced class weights and strong recall on the delayed class.</p>
        </TrackPanel>

        <TrackPanel track="regression" target="ArrDelay" question="Where does the regressor get it wrong?">
          <article className="chart-card flush"><div className="chart-heading"><h2>Residuals lean one way</h2><span>Actual minus predicted, by bucket</span></div><div className="residual-chart">{residuals.map(([label, value]) => <div key={label}><span>{label}</span><div className="residual-axis"><i className={value >= 0 ? "positive" : "negative"} style={{ width: `${Math.abs(value) * 12}%` }} /></div><strong>{value > 0 ? "+" : ""}{value.toFixed(2)} min</strong></div>)}</div></article>
          <Figure id="residuals" />
          <p className="track-note">On-time flights are slightly over-predicted at −2.57 min, while every delayed bucket is under-predicted by roughly 4 to 6 minutes.</p>
        </TrackPanel>
      </TrackSplit>

      <div className="three-findings">
        <article><span>01</span><h2>Misses start on time</h2><p>False negatives are the in-air blind spot, not simple threshold failures.</p></article>
        <article><span>02</span><h2>False alarms are borderline</h2><p>They carry credible risk signals and later recover time.</p></article>
        <article><span>03</span><h2>Severity is softened</h2><p>Every delayed bucket is under-predicted by roughly 4–6 minutes.</p></article>
      </div>
      <Insight>Both failure modes trace back to the same cause: disruption that happens after wheels-off, which no feature in this boundary can observe.</Insight>
    </section>
  );
}

function Clustering() {
  return (
    <section className="view">
      <PageHeading eyebrow="Part 14 · Unsupervised learning" title="Two algorithms, one severe segment" subtitle="KMeans and DBSCAN use six standardized flight-shape features. This section is deliberately not split by track: clustering never sees either target." />

      <div className="scope-note"><Dot tone="orange" /><div><strong>No target column</strong><p>ArrDelay and ArrDel15 are excluded from clustering and used only afterwards to profile the groups that were found.</p></div></div>

      <div className="segment-summary">
        <article><Dot /><span>KMeans</span><strong>k = 4</strong><p>Silhouette 0.286; chosen for interpretability rather than the k=2 maximum.</p></article>
        <article><Dot tone="orange" /><span>DBSCAN</span><strong>eps = 0.90</strong><p>min_samples = 12, twice the six clustering features. Cluster count is not specified in advance.</p></article>
      </div>

      <h2 className="section-heading">KMeans profiles</h2>
      <div className="cluster-grid">{kmeansClusters.map((cluster) => <article className={cluster.id === 3 ? "severe" : ""} key={cluster.id}><div><span>Cluster {cluster.id}</span><b>{cluster.size.toLocaleString()} flights</b></div><h3>{cluster.name}</h3><p>{cluster.detail}</p><div className="cluster-stats"><strong>{cluster.delay > 0 ? "+" : ""}{cluster.delay.toFixed(1)} min</strong><span>{cluster.late}% delayed</span></div></article>)}</div>
      <div className="figure-grid">
        <Figure id="kmeans-elbow" />
        <Figure id="kmeans-clusters" />
      </div>

      <h2 className="section-heading">DBSCAN profiles</h2>
      <div className="dbscan-grid">{dbscanGroups.map((group) => (
        <article className={group.severe ? "severe" : ""} key={group.id}>
          <div><span>{group.label} ({group.id})</span><b>{group.size.toLocaleString()} flights · {group.share}%</b></div>
          <h3>{group.severe ? "Sparse outliers" : "One continuous dense mass"}</h3>
          <p>{group.note}</p>
          <div className="dbscan-stats">
            <div><span>Mean ArrDelay</span><strong>{group.delay > 0 ? "+" : ""}{group.delay.toFixed(1)} min</strong></div>
            <div><span>Delayed 15+</span><strong>{group.late}%</strong></div>
            <div><span>Mean TaxiOut</span><strong>{group.taxi.toFixed(1)} min</strong></div>
          </div>
        </article>
      ))}</div>
      <div className="figure-grid">
        <Figure id="dbscan-kdistance" />
        <Figure id="dbscan-arrdelay" />
      </div>

      <div className="two-col">
        <article className="soft-card"><h2><Dot />Where they agree</h2><p>52.6% of the 612-flight KMeans severe cluster is labelled noise by DBSCAN, and 45.9% of DBSCAN’s noise falls inside that KMeans cluster.</p></article>
        <article className="soft-card"><h2><Dot tone="orange" />Why they differ</h2><p>KMeans defines “unusual” by distance to a centroid and must return exactly k groups. DBSCAN defines it by local density and is free to return one cluster plus noise, which is what it does here.</p></article>
      </div>
      <Insight>Neither algorithm was told a severe segment exists, and both surfaced one anyway from schedule and ground features alone.</Insight>
    </section>
  );
}

function PCAView() {
  return (
    <section className="view">
      <PageHeading eyebrow="Part 15 · Dimensionality reduction" title="220 features become 44" subtitle="PCA preserves 90.03% of the variance with one fifth of the encoded columns. The accuracy cost was measured on the classification track." />
      <div className="pca-hero"><div><span>Original</span><strong>220</strong><small>encoded features</small></div><div className="pca-arrow"><i /><span>5× smaller</span></div><div><span>Reduced</span><strong>44</strong><small>principal components</small></div></div>

      <TrackSplit>
        <TrackPanel track="classification" target="ArrDel15" question="What did the compression cost?">
          <div className="pca-metrics">
            <article><Dot /><span>Variance retained</span><strong>90.03%</strong><div className="progress"><i style={{ width: "90.03%" }} /></div></article>
            <article><Dot tone="orange" /><span>ROC-AUC without PCA</span><strong>96.49%</strong><div className="progress"><i style={{ width: "96.49%" }} /></div></article>
            <article><Dot /><span>ROC-AUC with PCA</span><strong>96.40%</strong><div className="progress"><i style={{ width: "96.40%" }} /></div></article>
          </div>
          <p className="track-note">A 0.09 percentage-point difference: essentially unchanged. Logistic Regression was refit on the reduced representation to measure this.</p>
          <div className="figure-grid">
            <Figure id="pca-components" />
            <Figure id="pca-accuracy" />
          </div>
        </TrackPanel>
        <TrackPanel track="regression" target="ArrDelay" question="Was PCA applied to regression?">
          <p className="track-note">No. Part 15 measures the compression trade-off on the classifier only, so there is no regression PCA result to report. The reduced representation would be available to the regressor, but it was not evaluated in the notebook and no number is invented here.</p>
          <div className="stat-rows">
            <div><span>PCA fitted on</span><strong>Shared encoded features</strong></div>
            <div><span>Evaluated with</span><strong>Logistic Regression</strong></div>
            <div><span>Regression result</span><strong>Not measured</strong></div>
          </div>
        </TrackPanel>
      </TrackSplit>

      <div className="two-col pca-notes">
        <article className="soft-card"><h2>Where PCA helps</h2><p>Compression for slower algorithms, smaller stored representations, and deployments where feature count matters.</p></article>
        <article className="soft-card"><h2>Why it is not deployed here</h2><p>Logistic Regression already handles 220 features without serious overfitting, and the original features are easier to explain.</p></article>
      </div>
      <Insight>PCA is useful as compression here, not as an accuracy improvement.</Insight>
    </section>
  );
}

function Plots() {
  return (
    <section className="view">
      <PageHeading eyebrow="Figure index" title="Plots" subtitle="Figures that span several models or several insights at once, so they do not belong to a single track. Every other notebook figure sits inside its own section." />
      {crossCuttingPlots.map((group) => (
        <div key={group.group}>
          <h2 className="section-heading">{group.group}<small>{group.track}</small></h2>
          <div className={group.items.length > 1 ? "figure-grid" : ""}>
            {group.items.map((id) => <Figure key={id} id={id} wide={group.items.length === 1} />)}
          </div>
        </div>
      ))}
      <div className="plot-index">
        <h2>Where the other figures live</h2>
        <div className="plot-index-grid">
          <article><strong>Data</strong><span>Missing values · outliers · class balance · target distribution</span></article>
          <article><strong>Explore</strong><span>Delay by airline · by day · by month</span></article>
          <article><strong>Models</strong><span>KNN · XGBoost · SVM sweeps</span></article>
          <article><strong>Errors</strong><span>Confusion matrix · residual analysis</span></article>
          <article><strong>Clustering</strong><span>KMeans elbow · KMeans clusters · DBSCAN k-distance · DBSCAN delay</span></article>
          <article><strong>PCA</strong><span>Explained variance · accuracy cost and 2D projection</span></article>
        </div>
      </div>
      <Insight>Every figure here is the current notebook output for the four classifiers and four regressors actually in the project.</Insight>
    </section>
  );
}

function Methodology() {
  return (
    <section className="view">
      <PageHeading eyebrow="Parts 16–17 · Complete coverage" title="The framing is the model" subtitle="Every capstone requirement stays visible, and the deployable prediction is kept separate from the analytical evidence around it." />
      <div className="method-callout"><div><span>Most important finding</span><h2>Departure delay enables the model — and bounds it.</h2><p>The 0.96 relationship explains both the strong result and the in-air failures the current data cannot observe.</p></div><strong>0.96</strong></div>

      <TrackSplit>
        <TrackPanel track="classification" target="ArrDel15" question="What ships for the delayed-or-not question?">
          <div className="winner-block compact"><span className="best-badge">Recommended</span><h3>Logistic Regression</h3><p>Deploy for passenger communication and gate planning. Readable coefficients let staff see why a flight was flagged.</p></div>
          <div className="stat-rows">
            <div><span>Test ROC-AUC</span><strong>96.49%</strong></div>
            <div><span>Accuracy</span><strong>92.43%</strong></div>
            <div><span>Delayed-class recall</span><strong>89.31%</strong></div>
            <div><span>Delayed-class F1</span><strong>82.14%</strong></div>
          </div>
        </TrackPanel>
        <TrackPanel track="regression" target="ArrDelay" question="What ships for the minutes question?">
          <div className="winner-block compact"><span className="best-badge">Recommended</span><h3>Linear Regression</h3><p>Deploy for updated arrival estimates. Expect roughly ±7 minutes of typical error and known under-prediction on severe delays.</p></div>
          <div className="stat-rows">
            <div><span>Test R²</span><strong>95.79%</strong></div>
            <div><span>Test MAE</span><strong>7.29 min</strong></div>
            <div><span>Test RMSE</span><strong>10.35 min</strong></div>
            <div><span>Known bias</span><strong>Under-predicts severe delays</strong></div>
          </div>
        </TrackPanel>
      </TrackSplit>

      <div className="recommendations">
        <article><span>1</span><div><h3>Use it for post-departure updates</h3><p>Passenger communication, gate planning and connection management.</p></div></article>
        <article><span>2</span><div><h3>Do not use it before departure</h3><p>That is a different, harder problem requiring a different feature boundary.</p></div></article>
        <article><span>3</span><div><h3>Add weather and air-traffic context</h3><p>Those signals directly target the in-air blind spot found in error analysis.</p></div></article>
        <article><span>4</span><div><h3>Retrain the linear models on full data</h3><p>The 30,000-row capstone sample kept SVM comparisons fair; deployment does not need that constraint.</p></div></article>
      </div>
      <div className="coverage-card"><div className="table-title"><div><Dot /><h2>Capstone coverage map</h2></div><span>17 of 17 parts represented</span></div><div className="coverage-grid">{requirementParts.map(([part, label, location]) => <article key={part}><span>{String(part).padStart(2, "0")}</span><div><strong>{label}</strong><small>{location}</small></div><b aria-label="Covered">✓</b></article>)}</div></div>
      <div className="reflection-grid"><article><span>Hardest</span><p>Defining exactly when “now” occurs and whether TaxiOut is legally available.</p></article><article><span>Most surprising</span><p>The linear baselines matched or beat every more complex model on both tracks.</p></article><article><span>Next iteration</span><p>Build a strict pre-departure model side by side and test on a later year.</p></article></div>
      <Insight>Real-world recommendation: yes for a wheels-off update; no for decisions that must be made before departure.</Insight>
    </section>
  );
}

export default function ArrivalDelayApp({ initialView = "overview" }: { initialView?: ViewId } = {}) {
  const [view, setView] = useState<ViewId>(initialView);
  const [artifact, setArtifact] = useState<ModelArtifact | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch("/model-artifact.json")
      .then((response) => {
        if (!response.ok) throw new Error("Model artifact unavailable");
        return response.json() as Promise<ModelArtifact>;
      })
      .then((data) => setArtifact(data))
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  const content = useMemo(() => {
    switch (view) {
      case "predict": return <Predict artifact={artifact} />;
      case "data": return <DataView />;
      case "explore": return <Explore />;
      case "models": return <Models />;
      case "errors": return <Errors />;
      case "clustering": return <Clustering />;
      case "pca": return <PCAView />;
      case "plots": return <Plots />;
      case "methodology": return <Methodology />;
      default: return <Overview navigate={setView} />;
    }
  }, [artifact, view]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView("overview")} aria-label="Flight Arrival Delay home"><span>AD</span><div><strong>Arrival Delay</strong><small>ML Capstone</small></div></button>
        <nav aria-label="Project sections">{navItems.map(([id, number, label]) => <button key={id} className={view === id ? "active" : ""} aria-current={view === id ? "page" : undefined} onClick={() => setView(id)}><span>{number}</span>{label}</button>)}</nav>
        <div className="model-status"><span className={loadError ? "status-error" : artifact ? "status-ready" : "status-loading"} /><div><strong>{loadError ? "Model unavailable" : artifact ? "Models ready" : "Loading models"}</strong><small>{artifact?.version ?? "Local browser inference"}</small></div></div>
      </aside>
      <header className="mobile-header"><button className="brand" onClick={() => setView("overview")}><span>AD</span><div><strong>Arrival Delay</strong><small>ML Capstone</small></div></button></header>
      <nav className="mobile-nav" aria-label="Project sections">{navItems.map(([id, number, label]) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><span>{number}</span>{label}</button>)}</nav>
      <main>{content}</main>
    </div>
  );
}
