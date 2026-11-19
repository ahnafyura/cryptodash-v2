import type { Metadata } from "next";
import { ProjectionChart } from "@/components/ProjectionChart";
import { FoldBars } from "@/components/FoldBars";
import daily from "@/public/data/projection_daily.json";
import folds from "@/public/data/projection_folds.json";
import summary from "@/public/data/projection_summary.json";
import { usd } from "@/lib/format";

export const metadata: Metadata = {
  title: "BTC projection | CryptoDash",
  description: "A calibrated 24-hour BTC range from a walk-forward quantile model, with the full evidence that it has no directional skill.",
};

const missed = summary.folds_total - summary.folds_better_than_naive;
const L = summary.latest;
const lo = L.close * (1 + L.band_pct_from_fold.q10 / 100);
const mid = L.close * (1 + L.band_pct_from_fold.q50 / 100);
const hi = L.close * (1 + L.band_pct_from_fold.q90 / 100);
const asof = L.asof.slice(0, 10);

const backtests = [
  { rule: "Buy and hold", total: "+1,791%", dd: "-76%", sharpe: "0.92" },
  { rule: "Long and short, always in market", total: "+51%", dd: "-90%", sharpe: "0.39" },
  { rule: "Long only", total: "-38%", dd: "-66%", sharpe: "-0.08" },
  { rule: "Short only", total: "-54%", dd: "-57%", sharpe: "-0.60" },
];

const method: [string, string][] = [
  ["Data", "BTCUSDT hourly candles from Binance spot, September 2017 to November 2026, with volume, technical indicators, and the Fear and Greed Index."],
  ["Model", "An LSTM trained to output the 10th, 50th, and 90th percentile of the next 24-hour return."],
  ["Validation", "Walk-forward. Sixteen consecutive half-year test folds from 2019, each trained only on earlier data."],
  ["Baseline", "Repeat the last price. It is hard to beat at this horizon, and the model does not beat it."],
  ["Limits", "Direction accuracy is about 51%. No news, on-chain, or order book data. Not financial advice."],
];

export default function Projection() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <section className="rise max-w-3xl">
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">BTC 24-hour projection</h1>
        <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-muted">
          A walk-forward quantile model tested on {summary.steps.toLocaleString("en-US")} daily forecasts. It gives a calibrated range, not a direction.
        </p>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Latest projection</h2>
          <p className="num text-sm text-muted">Data through {asof} 00:00 UTC</p>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
          <div><dt className="text-sm text-muted">Close</dt><dd className="num mt-1 text-2xl md:text-3xl">{usd(L.close)}</dd></div>
          <div><dt className="text-sm text-muted">Low, 10th percentile</dt><dd className="num mt-1 text-2xl md:text-3xl">{usd(lo)}</dd></div>
          <div><dt className="text-sm text-muted">Median</dt><dd className="num mt-1 text-2xl text-accent md:text-3xl">{usd(mid)}</dd></div>
          <div><dt className="text-sm text-muted">High, 90th percentile</dt><dd className="num mt-1 text-2xl md:text-3xl">{usd(hi)}</dd></div>
        </dl>
        <p className="mt-5 max-w-[78ch] text-sm leading-relaxed text-muted">
          The model was last run on data through {asof}. Prices on the Market page are newer. The range is the median quantile output of the latest test fold ({L.fold_steps} forecasts), applied to that close.
        </p>
      </section>

      <section className="mt-10">
        <ProjectionChart days={daily} latest={L} />
      </section>

      <section className="mt-20 grid gap-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="num text-5xl font-medium tracking-tight">{summary.coverage_80_overall}%</p>
          <p className="mt-2 max-w-[28ch] text-sm leading-relaxed text-muted">of next-day outcomes fell inside the 80% band. The target was 80%.</p>
        </div>
        <div className="md:col-span-4">
          <p className="num text-5xl font-medium tracking-tight">{summary.folds_better_than_naive} of {summary.folds_total}</p>
          <p className="mt-2 max-w-[28ch] text-sm leading-relaxed text-muted">test periods where the model beat the last-price baseline on average error.</p>
        </div>
        <div className="md:col-span-4">
          <p className="num text-5xl font-medium tracking-tight">{summary.mae_gain_mean_pct}%</p>
          <p className="mt-2 max-w-[28ch] text-sm leading-relaxed text-muted">average error against the baseline. The median fold is {summary.mae_gain_median_pct}%.</p>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Error against the baseline, by test period</h2>
        <p className="mt-3 max-w-[62ch] leading-relaxed text-muted">
          Each bar is one half-year fold. A bar below zero means the model was worse than repeating the last price. {missed} of {summary.folds_total} folds fall below.
        </p>
        <div className="mt-8"><FoldBars folds={folds} /></div>
        <details className="group mt-6">
          <summary className="cursor-pointer text-sm font-medium text-accent hover:underline">Show all {folds.length} folds</summary>
          <div className="mt-4 overflow-x-auto">
            <table className="num w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-rule text-xs text-muted">
                  <th className="py-2 pr-4 font-medium">Fold</th>
                  <th className="py-2 pr-4 font-medium">Period</th>
                  <th className="py-2 pr-4 text-right font-medium">MAE model</th>
                  <th className="py-2 pr-4 text-right font-medium">MAE baseline</th>
                  <th className="py-2 pr-4 text-right font-medium">Gain</th>
                  <th className="py-2 text-right font-medium">In band</th>
                </tr>
              </thead>
              <tbody>
                {folds.map((f) => (
                  <tr key={f.fold} className="hover:bg-rule/40">
                    <td className="py-2 pr-4">{f.fold}</td>
                    <td className="py-2 pr-4 text-muted">{f.period}</td>
                    <td className="py-2 pr-4 text-right">{usd(f.mae_model, 1)}</td>
                    <td className="py-2 pr-4 text-right">{usd(f.mae_naive, 1)}</td>
                    <td className={`py-2 pr-4 text-right ${f.gain_pct >= 0 ? "text-pos" : "text-neg"}`}>{f.gain_pct}%</td>
                    <td className="py-2 text-right">{f.coverage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="mt-20 grid gap-8 md:grid-cols-12">
        <div className="md:col-span-5">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Trading on the signal did not work</h2>
          <p className="mt-3 max-w-[48ch] leading-relaxed text-muted">
            Daily horizon, 2019 to November 2026, fee of 0.1% per side plus funding. Fibonacci levels were also reached no more often than on random price paths.
          </p>
        </div>
        <div className="overflow-x-auto md:col-span-7">
          <table className="num w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-rule text-xs text-muted">
                <th className="py-2 pr-4 font-medium">Rule</th>
                <th className="py-2 pr-4 text-right font-medium">Total</th>
                <th className="py-2 pr-4 text-right font-medium">Max drawdown</th>
                <th className="py-2 text-right font-medium">Sharpe</th>
              </tr>
            </thead>
            <tbody>
              {backtests.map((b) => (
                <tr key={b.rule} className="hover:bg-rule/40">
                  <td className="font-sans py-3 pr-4">{b.rule}</td>
                  <td className="py-3 pr-4 text-right">{b.total}</td>
                  <td className="py-3 pr-4 text-right text-muted">{b.dd}</td>
                  <td className="py-3 text-right">{b.sharpe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">How it was built</h2>
        <dl className="mt-8 grid gap-y-5">
          {method.map(([k, v]) => (
            <div key={k} className="grid gap-1 md:grid-cols-12 md:gap-x-10">
              <dt className="text-sm font-medium md:col-span-3">{k}</dt>
              <dd className="max-w-[70ch] leading-relaxed text-muted md:col-span-8">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
