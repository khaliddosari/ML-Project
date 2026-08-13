# Feature Selection Notes

Companion to `DelayPredictionModels_improved.ipynb`, which is the feature-selection upgrade of
`DelayPredictionModels_baseline.ipynb`. Same two problems, same model families, same splits —
only the feature set changes, so any metric movement is attributable to feature work.

## 1. What the target actually measures

From `EDAFlight.ipynb`:

```python
Delay   = clip(ActualElapsedTime - CRSElapsedTime, lower=0)
Delayed = (Delay >= 15).astype(int)
```

This is **not** arrival delay. It is gate-to-gate **overrun against the published schedule**: did the
flight take 15+ minutes longer than the airline said it would? That reframes the problem — the
physical drivers are taxi-out queueing at the origin, taxi-in/holding at the destination, en-route
routing, and how much padding the airline built into the block time.

The baseline feature list was chosen for a "will this flight be late" problem, not for this one.
That mismatch is the main reason it topped out at 0.65 accuracy.

## 2. Gaps found in the baseline feature set

Baseline: `Airline, DepTime, CRSElapsedTime, Month, DayofMonth, DayOfWeek, DestStateName, DistanceGroup, DepDelay`

| # | Gap | Why it costs accuracy |
|---|-----|----------------------|
| 1 | **`Origin` never used** | Taxi-out queueing at the origin is the largest single contributor to elapsed-time overrun. ORD/EWR/JFK behave nothing like ABY. The baseline models the destination *state* and ignores the departure airport entirely. |
| 2 | **`Distance` never used** — only the 11-bucket `DistanceGroup` | `CRSElapsedTime` alone cannot say whether a block time is tight. `CRSElapsedTime` *relative to* `Distance` can, and that ratio nearly measures the target directly. |
| 3 | **No schedule-padding feature** | The target *is* schedule error. `CRSElapsedTime − expected_flight_time(Distance)` is the most directly relevant legal predictor available, and it was absent. |
| 4 | **`DepTime` used as raw HHMM** | 1259 → 1300 is a +41 jump; 2359 → 0005 is −2354. That column is then `StandardScaler`-ed and fed to a linear model. `Dep_mins`/`CRSDep_mins` (true minutes past midnight) already exist in the cleaned file and were unused. Time of day is cyclic and needs sin/cos, not a ruler. |
| 5 | **No selection step at all** | The list is hand-picked; nothing measured whether `DayofMonth` earns its place. |

## 3. Two methodology bugs that make the baseline numbers unreliable

6. **Balancing happens before the split.** `delay_df_balanced` is built first, then `train_test_split`
   runs on it — so the *test set is artificially 50/50*. Reported accuracy is therefore not accuracy
   on real traffic (real base rate is 366,197 / 5,598,897 ≈ **6.5%**). It also discards ~4.87M
   majority rows of usable signal.
7. **The regressor trains on the class-balanced frame.** Delayed flights are over-represented roughly
   8×, so the `Delay` distribution the regressor sees is not the real one. `MAE = 12.1` is measured on
   that distorted population.

Consequence: **the improved notebook's MAE/RMSE are not comparable to the baseline's 12.1 / 16.6.**
The valid comparison is baseline-features vs selected-features *inside* the improved notebook, where
both rows share one naturally-distributed test set.

## 4. Leakage audit (done before any feature was added)

`Delay ≡ ActualElapsedTime − CRSElapsedTime`, and `Arr_mins − Dep_mins` reconstructs
`ActualElapsedTime`. So these are banned from `X`:

```
ActualElapsedTime, AirTime, ArrTime, Arr_mins, ArrDelay, DivAirportLandings
```

Adding any of them sends ROC-AUC to ~1.00 and produces a worthless model. The notebook demonstrates
this explicitly rather than just asserting it.

`DepTime` / `Dep_mins` / `DepDelay` are **kept** — known at pushback, before the overrun is
determined, which matches the baseline's "at departure" framing. `CRSElapsedTime` is kept: published
months ahead, carries schedule information without revealing the outcome.

## 5. What was added

- **Schedule geometry** — `sched_speed = Distance/CRSElapsedTime`, `sched_pad`, `sched_pad_ratio`
  (cruise speed estimated from the training split only).
- **Cyclic time of day** — sin/cos of `CRSDep_mins` and `CRSArr_mins`, plus `dep_hour`,
  `is_redeye`, `mins_since_0500`.
- **Calendar** — `is_weekend`, `day_of_year`, `is_summer`, `is_winter`, `days_to_holiday`
  (wrap-aware), `is_holiday_window`.
- **Out-of-fold smoothed target encoding** for `Origin`, `Dest`, `route`, `Airline`,
  `Airline×Origin`, `DestStateName` — encoding both the delay *rate* and the mean delay
  *magnitude*. Fit on train only; out-of-fold within train so the model cannot memorise its own
  target through the encoding. This is what makes high-cardinality `route` usable without adding
  thousands of one-hot columns.
- **Congestion proxies** — scheduled departures per (airport, hour) and per airport per day, and the
  hour's share of the airport's day. Counted from the training split only.

## 6. How features were selected

Four filters, cheapest first, then a decision about *how many* to keep:

1. **Redundancy pruning** — drop one of any pair with |r| > 0.95.
2. **Mutual information** — model-free, catches non-linear relationships.
3. **XGBoost gain** — how much a tree ensemble actually used each feature (one-hot columns summed
   back onto their source column so groups compare fairly).
4. **Permutation importance on validation** — the arbiter, and the only one of the four measured on
   data the model was not fit on.

The three rankings are averaged into a consensus rank. A **forward-selection curve** then adds
features in that order and tracks validation ROC-AUC; the retained set is the smallest one within
0.001 AUC of the best point — the simplest model that is not measurably worse.

## 7. Running it

```python
DATA_PATH = "Cleaned_Flights_2018.csv"   # output of EDAFlight.ipynb
SAMPLE_N  = 600_000                       # stratified subsample; set None for all 5.6M rows
```

Feature selection needs many repeated fits, hence the subsample. `MI_SAMPLE` and `PERM_SAMPLE`
control the two most expensive diagnostics.

Requires `scikit-learn >= 1.1` (`OneHotEncoder(min_frequency=...)`).

**The notebook ships un-executed.** It was validated end-to-end against a synthetic dataset built to
the same 41-column schema and the same target formula, because `Cleaned_Flights_2018.csv` is
gitignored and not in the repo. All reported metrics must come from your own run on the real data.

## 8. Capstone parts this covers

Part 5 (feature preparation, selecting useful features, preventing data leakage), Part 6 (splitting
and leakage prevention), Part 9 (metrics appropriate for an imbalanced target — ROC-AUC and PR-AUC
rather than accuracy), Part 10 (over/underfitting via the train-vs-validation gap table).
