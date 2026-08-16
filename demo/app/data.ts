// Every figure below comes from the capstone notebook run (random_state 42,
// stratified 30,000-row sample, 60/20/20 split). Decision Tree and Random Forest
// were removed from the project; clustering now uses KMeans + DBSCAN.

export const classificationModels = [
  { name: "Logistic Regression", train: 0.9681, validation: 0.9572, test: 0.9649, f1: 0.8214, baseline: true, selected: true },
  { name: "SVM (RBF)", train: 0.9854, validation: 0.9557, test: 0.9639, f1: 0.8310 },
  { name: "Gradient Boosting", train: 0.9930, validation: 0.9574, test: 0.9631, f1: 0.8348 },
  { name: "KNN", train: 0.9411, validation: 0.8981, test: 0.8969, f1: 0.5594 },
];

export const regressionModels = [
  { name: "Linear Regression", mae: 7.2919, rmse: 10.3488, r2: 0.9579, baseline: true, selected: true },
  { name: "KNN Regressor", mae: 12.5411, rmse: 18.3577, r2: 0.8676 },
  { name: "Gradient Boosting Regressor", mae: 8.2921, rmse: 19.1833, r2: 0.8555 },
  { name: "SVR (RBF)", mae: 9.3863, rmse: 31.3088, r2: 0.6150 },
];

/** Train minus validation ROC-AUC. Lower is better generalization. */
export const overfittingGaps = [
  { name: "Logistic Regression", gap: 0.011, baseline: true },
  { name: "SVM (RBF)", gap: 0.030 },
  { name: "Gradient Boosting", gap: 0.036 },
  { name: "KNN", gap: 0.043 },
];

/** All three sweeps score classification ROC-AUC. */
export const hyperparameterRuns = [
  { model: "KNN", parameter: "n_neighbors", chosen: "k = 50", note: "k=1 memorized training: 1.000 train against 0.707 validation." },
  { model: "Gradient Boosting", parameter: "learning_rate", chosen: "rate = 0.03", note: "Validation peaked at 0.961; larger steps widened the gap." },
  { model: "SVM", parameter: "C", chosen: "C = 1", note: "Beyond C=1 validation fell while train AUC reached 1.000." },
];

export const dayDelay = [
  ["Mon", 6.63], ["Tue", 4.92], ["Wed", 3.92], ["Thu", 7.08],
  ["Fri", 8.03], ["Sat", 2.31], ["Sun", 4.42],
] as const;

export const monthDelay = [2.80, 5.17, 3.00, 4.23, 7.27, 10.26, 9.68, 11.51, 2.98, 3.04, 5.60, 3.71];

export const airlineRates = [
  ["JetBlue", 27.31], ["ExpressJet", 21.30], ["American", 20.69],
  ["Southwest", 19.55], ["United", 19.46], ["Republic", 19.15],
  ["SkyWest", 19.10], ["Spirit", 17.97], ["Alaska", 15.83], ["Delta", 12.50],
] as const;

export const dataChecks = [
  { check: "Missing values", found: "1.8% of arrival fields", decision: "Drop cancelled and diverted flights" },
  { check: "Duplicate rows", found: "None found", decision: "Nothing to remove" },
  { check: "Incorrect type", found: "CRSDepTime stores an HHMM clock code", decision: "Convert to cyclic sine and cosine" },
  { check: "Invalid values", found: "67 negative durations", decision: "Drop 67 of 5.69M rows" },
  { check: "Categories", found: "No case or spelling collisions", decision: "No cleaning required" },
  { check: "Outliers", found: "9–13% flagged on delay fields", decision: "Keep them: they are the phenomenon" },
  { check: "Class balance", found: "80.5% on time / 19.5% delayed", decision: "Use ROC-AUC, F1, Recall and balanced weights" },
];

export const kmeansClusters = [
  { id: 0, name: "Long-haul, mostly steady", size: 4599, delay: -0.87, late: 18, detail: "277 min · 1,935 mi" },
  { id: 1, name: "Early short-haul pressure", size: 10222, delay: 5.03, late: 24, detail: "113 min · 579 mi" },
  { id: 2, name: "Later short-haul calm", size: 14567, delay: -1.90, late: 14, detail: "115 min · 589 mi" },
  { id: 3, name: "Severe delay pocket", size: 612, delay: 245.80, late: 100, detail: "DepDelay 249 min" },
];

/** DBSCAN eps=0.90, min_samples=12 (2x the six clustering features). */
export const dbscanGroups = [
  {
    id: 0,
    label: "Core cluster",
    size: 29299,
    share: 97.7,
    delay: 1.37,
    late: 18,
    taxi: 16.62,
    detail: "138 min · 784 mi",
    note: "Ordinary traffic forms one continuous dense mass with no internal gaps.",
    severe: false,
  },
  {
    id: -1,
    label: "Noise",
    size: 701,
    share: 2.3,
    delay: 185.35,
    late: 92,
    taxi: 39.13,
    detail: "201 min · 1,271 mi",
    note: "Too sparse to join any dense neighborhood: almost entirely severe, high-taxi flights.",
    severe: true,
  },
];

export const requirementParts = [
  [1, "Problem & dataset", "Overview"], [2, "Initial exploration", "Data"],
  [3, "Quality & cleaning", "Data"], [4, "Exploratory analysis", "Explore"],
  [5, "Feature preparation", "Data"], [6, "Data splitting", "Data"],
  [7, "Baseline models", "Models"], [8, "Model development", "Models"],
  [9, "Evaluation", "Models"], [10, "Over/underfitting", "Models"],
  [11, "Hyperparameters", "Models"], [12, "Selection", "Models"],
  [13, "Error analysis", "Errors"], [14, "Clustering", "Clustering"],
  [15, "PCA", "PCA"], [16, "Insights & recommendations", "Methodology"],
  [17, "Reflection", "Methodology"],
] as const;

export const navItems = [
  ["overview", "01", "Overview"],
  ["predict", "02", "Predict"],
  ["data", "03", "Data"],
  ["explore", "04", "Explore"],
  ["models", "05", "Models"],
  ["errors", "06", "Errors"],
  ["clustering", "07", "Clustering"],
  ["pca", "08", "PCA"],
  ["plots", "09", "Plots"],
  ["methodology", "10", "Methodology"],
] as const;

export type PlotId =
  | "target-distribution" | "missing-values" | "outliers" | "class-balance"
  | "delay-by-day" | "delay-by-month" | "delay-by-airline" | "eda-combined"
  | "clf-roc-auc" | "reg-r2" | "train-val-gap" | "perf-vs-gen"
  | "knn-sweep" | "xgboost-sweep" | "svm-sweep"
  | "confusion-matrix" | "residuals"
  | "kmeans-elbow" | "kmeans-clusters" | "dbscan-kdistance" | "dbscan-arrdelay"
  | "pca-components" | "pca-accuracy";

export type Plot = { title: string; caption: string };

/** Notebook figures. Files live in /public/plots. */
export const plots: Record<PlotId, Plot> = {
  "target-distribution": { title: "ArrDel15 target distribution", caption: "Raw target counts once cancelled and diverted flights are excluded." },
  "missing-values": { title: "Missing values by column", caption: "Every gap sits in an arrival or departure field." },
  "outliers": { title: "Outlier view, IQR box plots", caption: "Whiskers at 1.5x IQR for ArrDelay, DepDelay and TaxiOut." },
  "class-balance": { title: "ArrDel15 class balance", caption: "80.5% on time against 19.5% delayed." },
  "delay-by-day": { title: "Mean arrival delay by day of week", caption: "Friday is worst; Saturday is calmest." },
  "delay-by-month": { title: "Mean arrival delay by month", caption: "Summer runs roughly three times worse than autumn." },
  "delay-by-airline": { title: "Delay rate by airline", caption: "ArrDel15 rate across the ten largest carriers by volume." },
  "eda-combined": { title: "DepDelay, departure hour and feature correlation", caption: "Three EDA views: the 0.96 DepDelay relationship, delay compounding through the day, and the full correlation matrix." },
  "clf-roc-auc": { title: "Classification models, test ROC-AUC", caption: "All four classifiers on the held-out test set." },
  "reg-r2": { title: "Regression models, test R²", caption: "All four regressors on the held-out test set." },
  "train-val-gap": { title: "Train against validation AUC by model", caption: "The gap between the two bars is the overfitting measure." },
  "perf-vs-gen": { title: "Performance against generalization", caption: "Test ROC-AUC plotted against the train minus validation gap." },
  "knn-sweep": { title: "KNN: AUC by n_neighbors", caption: "k=1 memorizes; the gap closes as k grows." },
  "xgboost-sweep": { title: "XGBoost: AUC by learning_rate", caption: "Validation peaks at 0.03 then declines." },
  "svm-sweep": { title: "SVM: AUC by C", caption: "Validation peaks at C=1 then declines." },
  "confusion-matrix": { title: "Confusion matrix", caption: "Selected classifier on the 6,000-row test set." },
  "residuals": { title: "Residual analysis", caption: "Mean residual by delay bucket, predicted against actual, and the residual distribution." },
  "kmeans-elbow": { title: "KMeans elbow and silhouette", caption: "Inertia and silhouette score across candidate k values." },
  "kmeans-clusters": { title: "KMeans clusters and mean delay", caption: "Cluster scatter plus mean ArrDelay per cluster." },
  "dbscan-kdistance": { title: "DBSCAN k-distance plot", caption: "Distance to the 12th nearest neighbor, sorted. The knee near 0.9 sets eps." },
  "dbscan-arrdelay": { title: "Mean ArrDelay by DBSCAN label", caption: "The noise group against the single dense core cluster." },
  "pca-components": { title: "PCA explained variance", caption: "First ten components and the cumulative variance curve." },
  "pca-accuracy": { title: "PCA accuracy cost and 2D projection", caption: "ROC-AUC with and without PCA, plus the test set in the first two components." },
};

/** Figures that span several models or several insights at once. */
export const crossCuttingPlots = [
  {
    group: "Model comparison",
    track: "Classification and regression side by side",
    items: ["clf-roc-auc", "reg-r2"] as PlotId[],
  },
  {
    group: "Generalization",
    track: "All four classifiers together",
    items: ["train-val-gap", "perf-vs-gen"] as PlotId[],
  },
  {
    group: "Exploratory analysis",
    track: "Three findings in one figure",
    items: ["eda-combined"] as PlotId[],
  },
];
