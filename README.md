# CryptoDash

Live prices for ten major coins, plus a BTC 24-hour projection page built from my own research project.

The projection is a walk-forward quantile model tested on 2,865 daily forecasts. It gives a calibrated range, not a direction: 82.5% of outcomes landed inside the 80% band, and the model beat a last-price baseline in 1 of 16 test periods. The page shows that evidence in full. It is not financial advice.

## Pages

- `/` Market table with 24-hour change, range, and volume (Binance public API, refreshed every minute, with a saved snapshot as fallback).
- `/projection` Latest 24-hour range, a 90 day and 1 year chart with the forecast band, error against the baseline for each of 16 folds, backtest summary, and method.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS 4, d3-scale and d3-shape for charts, Geist fonts.

## Data

`scripts/export_data.py` reads the output CSVs of the research project and writes static JSON into `public/data/`. The site only ships those JSON files, never the raw data or model code.

The projection uses data through 2026-11-05 and the model has not been re-run since. Live prices on the Market page are newer.

## Run

```bash
npm install
npm run dev
```
