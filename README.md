# Flight Delay Prediction

A tool that predicts how late a US domestic flight will land, right after it leaves the gate. Built for airlines and aviation regulators who need a fast, reliable estimate of arrival delay to support operations, passenger updates, and connection planning.

## What it does

The model uses information available the moment a flight leaves the gate, such as airline, route, day, and ground delay so far, to predict:

- Whether the flight will land 15 minutes or more late
- How many minutes late the flight will land

On flights it has never seen before, it reaches a 96% ROC-AUC score, a standard accuracy measure for this type of prediction. That is well above what a simple schedule based estimate can achieve.

## Why it matters for airlines and regulators

Once a flight leaves the gate, airlines and airports still mostly rely on the original schedule for arrival estimates. This model replaces that guess with a live, data backed prediction. In practice, that supports:

- Better passenger updates at the gate and for connecting flights
- Better ground crew and gate planning
- A clearer, measurable view of on time performance for regulators

## A gap this project found

This model only works after a flight has already departed. Predicting delay before departure, while the flight is still being scheduled, is a harder and more valuable problem, and this project found a real gap there.

Using only the data commonly tracked before departure (schedule, route, day, time), prediction accuracy tops out around 70%, far below the 96% reached after departure. Early work on this project shows that gap is a data problem, not a modeling problem. Signals like how much padding is built into a schedule, how congested a departure airport tends to be at a given hour, and how delay prone a specific route has been are rarely collected or used today, but they carry real predictive value.

For airlines and regulators, this points to a clear opportunity: collecting and using this kind of pre-departure data could close much of that gap, moving delay prediction from reactive (after departure) to proactive (before departure).

## What's in this repo

- `Capstone_ArrivalDelay.ipynb`: the full analysis, from data cleaning through modeling, evaluation, and final recommendations
- `demo/`: an interactive web app that shows the models and results live, and lets you test predictions yourself
- `Docs/`: the project brief, presentation deck, and summary report

## Try it

Visit `https://mlproject.khalid-ai.dev` for a live demo.
