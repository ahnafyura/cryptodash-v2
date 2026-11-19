"""Export research outputs from the BTC projection project into static JSON for the site.

Read-only on the source project. Source: ~/Documents/btc-projection/SUBMISSION-DLTM-DICODING
Run: python3 scripts/export_data.py
"""
import json, os, urllib.request
from pathlib import Path
import pandas as pd

SRC = Path.home() / "Documents/btc-projection/SUBMISSION-DLTM-DICODING/forecasting"
OUT = Path(__file__).resolve().parent.parent / "public/data"
OUT.mkdir(parents=True, exist_ok=True)

steps = pd.read_csv(SRC / "bt_D_all_steps.csv", parse_dates=["Date"])
folds = pd.read_csv(SRC / "bt_D_all_folds.csv")

# Per-day out-of-sample projection record: price band for the next 24h and what actually happened.
steps["lo"] = steps["last"] * (1 + steps["q10"])
steps["mid"] = steps["last"] * (1 + steps["q50"])
steps["hi"] = steps["last"] * (1 + steps["q90"])
steps["out"] = steps["last"] * (1 + steps["ret24"])
recent = steps.tail(365)
daily = [
    {"d": r.Date.strftime("%Y-%m-%d"), "c": round(r.last, 2), "lo": round(r.lo, 2),
     "mid": round(r.mid, 2), "hi": round(r.hi, 2), "out": round(r.out, 2), "in": bool(r.inband)}
    for r in recent.itertuples()
]

cover = steps.groupby("fold")["inband"].mean().mul(100).round(1)
fold_rows = []
for r in folds.itertuples():
    fold_rows.append({
        "fold": int(r.fold), "period": r.periode.replace("..", " to "),
        "mae_model": round(r.MAE_model, 1), "mae_naive": round(r.MAE_naif, 1),
        "gain_pct": round(r.gain_pct, 2), "coverage": float(cover.get(r.fold, float("nan"))),
    })

last_fold = steps[steps["fold"] == steps["fold"].max()]
latest_close = float(pd.read_csv(SRC.parent / "Bitcoin_v2.csv", usecols=["Date", "Close"]).tail(1)["Close"].iloc[0])
latest_date = str(pd.read_csv(SRC.parent / "Bitcoin_v2.csv", usecols=["Date"]).tail(1)["Date"].iloc[0])
band = {k: round(float(last_fold[k].median()) * 100, 2) for k in ("q10", "q50", "q90")}

summary = {
    "source": "walk-forward LSTM quantile model, feature set D_all, 16 folds, 2019-01 to 2026-11-04",
    "steps": int(len(steps)),
    "coverage_80_overall": round(float(steps["inband"].mean() * 100), 1),
    "mae_gain_mean_pct": round(float(folds["gain_pct"].mean()), 2),
    "mae_gain_median_pct": round(float(folds["gain_pct"].median()), 2),
    "folds_better_than_naive": int((folds["gain_pct"] > 0).sum()),
    "folds_total": int(len(folds)),
    "latest": {"asof": latest_date, "close": latest_close, "band_pct_from_fold": band,
               "fold": int(last_fold["fold"].iloc[0]), "fold_steps": int(len(last_fold))},
}
(OUT / "projection_daily.json").write_text(json.dumps(daily, separators=(",", ":")))
(OUT / "projection_folds.json").write_text(json.dumps(fold_rows, indent=1))
(OUT / "projection_summary.json").write_text(json.dumps(summary, indent=1))

# Market snapshot (fallback when the live endpoint is unreachable). Public market data only.
syms = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "LINKUSDT", "TRXUSDT"]
url = "https://data-api.binance.vision/api/v3/ticker/24hr?symbols=" + urllib.request.quote(json.dumps(syms, separators=(",", ":")))
try:
    with urllib.request.urlopen(url, timeout=20) as r:
        t = json.load(r)
    snap = {"asof": pd.Timestamp.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            "rows": [{"s": x["symbol"].replace("USDT", ""), "p": float(x["lastPrice"]),
                      "chg": float(x["priceChangePercent"]), "hi": float(x["highPrice"]),
                      "lo": float(x["lowPrice"]), "vol": float(x["quoteVolume"])} for x in t]}
    (OUT / "market_snapshot.json").write_text(json.dumps(snap, indent=1))
    print("snapshot ok", len(snap["rows"]))
except Exception as e:
    print("snapshot failed", e)

print(json.dumps(summary, indent=1))
print("daily rows", len(daily), "folds", len(fold_rows))
