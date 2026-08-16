export type NumericTerm = {
  mean: number;
  scale: number;
  coefficient: number;
};

export type LinearArtifact = {
  intercept: number;
  numeric: Record<string, NumericTerm>;
  categorical: Record<string, Record<string, number>>;
};

export type ModelArtifact = {
  version: string;
  methodology: {
    populationRows: number;
    sampleRows: number;
    trainRows: number;
    validationRows: number;
    testRows: number;
    positiveRate: number;
    predictionMoment: string;
    sourceYear: number;
  };
  metrics: {
    classifier: {
      testAuc: number;
      accuracy: number;
      precision: number;
      recall: number;
      f1: number;
    };
    regressor: { mae: number; rmse: number; r2: number };
  };
  classifier: LinearArtifact;
  regressor: LinearArtifact;
  options: {
    airlines: string[];
    origins: string[];
    destinations: string[];
  };
};

export type PredictionInput = {
  airline: string;
  origin: string;
  destination: string;
  flightDate: string;
  scheduledDeparture: string;
  departureDelay: number;
  taxiOut: number;
  scheduledDuration: number;
};

export type Contribution = {
  key: string;
  label: string;
  value: number;
};

export type PredictionResult = {
  probability: number;
  predictedDelay: number;
  updatedArrival: string;
  risk: "Low" | "Moderate" | "Elevated" | "High";
  contributions: Contribution[];
};

const LABELS: Record<string, string> = {
  DepDelay: "Departure delay",
  TaxiOut: "Taxi-out time",
  CRSElapsedTime: "Scheduled duration",
  dep_sin: "Time of day",
  dep_cos: "Time of day",
  Month: "Season",
  DayofMonth: "Day of month",
  DayOfWeek: "Day of week",
  is_weekend: "Weekend",
  Airline: "Airline",
  Origin: "Origin airport",
  Dest: "Destination airport",
};

function dateParts(dateString: string) {
  const parsed = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Choose a valid flight date.");
  }
  const jsDay = parsed.getDay();
  return {
    Month: parsed.getMonth() + 1,
    DayofMonth: parsed.getDate(),
    DayOfWeek: jsDay === 0 ? 7 : jsDay,
    is_weekend: jsDay === 0 || jsDay === 6 ? 1 : 0,
  };
}

function timeParts(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) throw new Error("Choose a valid scheduled departure time.");
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const total = hours * 60 + minutes;
  return {
    total,
    dep_sin: Math.sin((2 * Math.PI * total) / 1440),
    dep_cos: Math.cos((2 * Math.PI * total) / 1440),
  };
}

function rawFeatures(input: PredictionInput) {
  const date = dateParts(input.flightDate);
  const time = timeParts(input.scheduledDeparture);
  return {
    DepDelay: input.departureDelay,
    TaxiOut: input.taxiOut,
    CRSElapsedTime: input.scheduledDuration,
    dep_sin: time.dep_sin,
    dep_cos: time.dep_cos,
    Month: date.Month,
    DayofMonth: date.DayofMonth,
    DayOfWeek: date.DayOfWeek,
    is_weekend: date.is_weekend,
    Airline: input.airline,
    Origin: input.origin.toUpperCase(),
    Dest: input.destination.toUpperCase(),
  };
}

function scoreLinear(
  model: LinearArtifact,
  features: ReturnType<typeof rawFeatures>,
) {
  let score = model.intercept;
  const contributions: Contribution[] = [];

  for (const [name, term] of Object.entries(model.numeric)) {
    const raw = Number(features[name as keyof typeof features]);
    const contribution = term.coefficient * ((raw - term.mean) / term.scale);
    score += contribution;
    contributions.push({
      key: name,
      label: LABELS[name] ?? name,
      value: contribution,
    });
  }

  const categories: Array<[string, string]> = [
    ["Airline", features.Airline],
    ["Origin", features.Origin],
    ["Dest", features.Dest],
  ];
  for (const [name, value] of categories) {
    const contribution = model.categorical[name]?.[value] ?? 0;
    score += contribution;
    contributions.push({
      key: `${name}:${value}`,
      label: `${LABELS[name]} · ${value}`,
      value: contribution,
    });
  }

  return { score, contributions };
}

function formatClock(totalMinutes: number) {
  const rounded = Math.round(totalMinutes);
  const dayOffset = Math.floor(rounded / 1440);
  const withinDay = ((rounded % 1440) + 1440) % 1440;
  const hours = Math.floor(withinDay / 60);
  const minutes = withinDay % 60;
  const clock = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  if (dayOffset > 0) return `${clock} +${dayOffset}d`;
  if (dayOffset < 0) return `${clock} ${dayOffset}d`;
  return clock;
}

export function runPrediction(
  artifact: ModelArtifact,
  input: PredictionInput,
): PredictionResult {
  if (!input.airline || !input.origin || !input.destination) {
    throw new Error("Complete the airline, origin, and destination fields.");
  }
  if (input.origin.toUpperCase() === input.destination.toUpperCase()) {
    throw new Error("Origin and destination must be different.");
  }
  if (input.taxiOut < 0 || input.scheduledDuration <= 0) {
    throw new Error("Taxi-out and scheduled duration must be valid positive values.");
  }

  const features = rawFeatures(input);
  const classification = scoreLinear(artifact.classifier, features);
  const regression = scoreLinear(artifact.regressor, features);
  const probability = 1 / (1 + Math.exp(-classification.score));
  const scheduledMinutes = timeParts(input.scheduledDeparture).total;
  const predictedDelay = regression.score;
  const updatedArrival = formatClock(
    scheduledMinutes + input.scheduledDuration + predictedDelay,
  );
  const risk =
    probability >= 0.75
      ? "High"
      : probability >= 0.5
        ? "Elevated"
        : probability >= 0.25
          ? "Moderate"
          : "Low";

  return {
    probability,
    predictedDelay,
    updatedArrival,
    risk,
    contributions: classification.contributions
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 5),
  };
}

