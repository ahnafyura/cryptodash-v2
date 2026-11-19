import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getMarket, nameOf } from "@/lib/market";
import { price, pct, compact } from "@/lib/format";
import { RangeMark } from "@/components/RangeMark";
import summary from "@/public/data/projection_summary.json";


export default async function Home() {
  const m = await getMarket();
  const missed = summary.folds_total - summary.folds_better_than_naive;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <section className="rise grid gap-6 md:grid-cols-12">
        <div className="md:col-span-7">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">Ten major coins, live.</h1>
          <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-muted">
            24-hour change, range, and volume from Binance spot. Refreshes every minute.
          </p>
        </div>
        <p className="num self-end text-sm text-muted md:col-span-5 md:text-right">
          {m.live ? "Live" : "Snapshot"} as of {m.asof}
          {!m.live && <span className="block">Live feed unreachable, showing the last saved data.</span>}
        </p>
      </section>

      <section className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b border-rule text-xs text-muted">
              <th className="py-3 pr-4 font-medium">Asset</th>
              <th className="py-3 pr-4 text-right font-medium">Price (USDT)</th>
              <th className="py-3 pr-4 text-right font-medium">24h</th>
              <th className="hidden py-3 pr-4 font-medium md:table-cell">24h range</th>
              <th className="hidden py-3 text-right font-medium md:table-cell">Volume (USDT)</th>
            </tr>
          </thead>
          <tbody>
            {m.rows.map((r) => (
              <tr key={r.s} className="transition-colors hover:bg-rule/40">
                <td className="py-4 pr-4">
                  <span className="font-medium">{nameOf(r.s)}</span>
                  <span className="num ml-2 text-xs text-muted">{r.s}</span>
                </td>
                <td className="num py-4 pr-4 text-right">{price(r.p)}</td>
                <td className={`num py-4 pr-4 text-right ${r.chg >= 0 ? "text-pos" : "text-neg"}`}>{pct(r.chg)}</td>
                <td className="hidden py-4 pr-4 md:table-cell"><RangeMark lo={r.lo} hi={r.hi} p={r.p} /></td>
                <td className="num hidden py-4 text-right text-muted md:table-cell">{compact(r.vol)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-20 grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5 md:col-start-1">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">A projection that admits what it cannot do.</h2>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <p className="max-w-[60ch] leading-relaxed text-muted">
            In {summary.steps.toLocaleString("en-US")} out-of-sample forecasts, {summary.coverage_80_overall}% of outcomes landed inside the 80% band.
            The same model did not beat a plain last-price baseline in {missed} of {summary.folds_total} test periods.
            The range is useful. The direction is not.
          </p>
          <Link href="/projection" className="mt-6 inline-flex items-center gap-2 font-medium text-accent hover:underline">
            Read the BTC projection <ArrowRight size={16} weight="regular" />
          </Link>
        </div>
      </section>
    </div>
  );
}
