"use client";
import { useEffect, useRef, useState } from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import { area, line } from "d3-shape";
import { extent } from "d3-array";

type Day = { d: string; c: number; lo: number; mid: number; hi: number; out: number; in: boolean };
type Latest = { asof: string; close: number; band_pct_from_fold: { q10: number; q50: number; q90: number } };

const DAY = 86400000;
const usd0 = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const RANGES = [
  { key: "90", label: "90 days", n: 90 },
  { key: "365", label: "1 year", n: 365 },
] as const;

export function ProjectionChart({ days, latest }: { days: Day[]; latest: Latest }) {
  const [range, setRange] = useState<"90" | "365">("90");
  const [W, setW] = useState(900);
  const box = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const cross = useRef<SVGLineElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    setW(Math.max(320, Math.round(el.getBoundingClientRect().width)));
    const ro = new ResizeObserver(([e]) => setW(Math.max(320, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = W < 640 ? 320 : 400;
  const M = { t: 22, r: W < 640 ? 62 : 80, b: 30, l: 4 };
  const n = RANGES.find((r) => r.key === range)!.n;
  const view = days.slice(-n);

  const t0 = new Date(view[0].d).getTime();
  const tLast = new Date(view[view.length - 1].d).getTime() + DAY;
  const tEnd = tLast + DAY;
  const span = tEnd - t0;
  const b = latest.band_pct_from_fold;
  const pLo = latest.close * (1 + b.q10 / 100), pMid = latest.close * (1 + b.q50 / 100), pHi = latest.close * (1 + b.q90 / 100);

  const x = scaleTime().domain([t0, tEnd + span * 0.03]).range([M.l, W - M.r]);
  const [ymin, ymax] = extent([...view.flatMap((d) => [d.lo, d.hi, d.out, d.c]), pLo, pHi]) as [number, number];
  const pad = (ymax - ymin) * 0.08;
  const y = scaleLinear().domain([ymin - pad, ymax + pad]).range([H - M.b, M.t]).nice(5);

  const xt = (s: string) => x(new Date(s).getTime());
  const pts = view.map((d) => ({ t: new Date(d.d).getTime(), v: d.c }));
  pts.push({ t: tLast, v: latest.close });
  const closeLine = line<{ t: number; v: number }>().x((d) => x(d.t)).y((d) => y(d.v))(pts) ?? "";
  const band = area<Day>().x((d) => xt(d.d)).y0((d) => y(d.lo)).y1((d) => y(d.hi))(view) ?? "";
  const misses = view.filter((d) => !d.in);
  const missPct = Math.round((misses.length / view.length) * 100);

  const ticks = y.ticks(5);
  const xticks: { t: number; label: string }[] = [];
  const step = n <= 90 ? (W < 640 ? 30 : 14) : 0;
  if (step) {
    for (let t = t0; t < tEnd; t += step * DAY) xticks.push({ t, label: new Date(t).toLocaleString("en-US", { month: "short", day: "numeric" }) });
  } else {
    for (let d = new Date(new Date(t0).getFullYear(), new Date(t0).getMonth() + 1, 1); d.getTime() < tEnd; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      xticks.push({ t: d.getTime(), label: d.toLocaleString("en-US", { month: "short", year: d.getMonth() === 0 ? "2-digit" : undefined }) });
    }
  }

  // keep the two end labels from colliding
  let yHi = y(pHi), yLo = y(pLo);
  if (yLo - yHi < 16) { const m = (yHi + yLo) / 2; yHi = m - 8; yLo = m + 8; }

  function move(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    let i = Math.round((x.invert(px).getTime() - t0) / DAY);
    i = Math.max(0, Math.min(view.length - 1, i));
    const d = view[i];
    const cx = xt(d.d);
    cross.current?.setAttribute("x1", String(cx));
    cross.current?.setAttribute("x2", String(cx));
    cross.current?.setAttribute("opacity", "1");
    if (tip.current) {
      tip.current.style.opacity = "1";
      tip.current.style.transform = `translate(${Math.min(cx + 14, r.width - 214)}px, 36px)`;
      tip.current.innerHTML =
        `<div class="num text-xs text-muted">${d.d}</div>` +
        `<div class="num mt-1 text-sm">Close ${usd0(d.c)}</div>` +
        `<div class="num text-xs text-muted">Band ${usd0(d.lo)} to ${usd0(d.hi)}</div>` +
        `<div class="num text-xs ${d.in ? "text-muted" : "text-accent"}">Next day ${usd0(d.out)}, ${d.in ? "inside" : "outside"}</div>`;
    }
  }
  function leave() {
    if (tip.current) tip.current.style.opacity = "0";
    cross.current?.setAttribute("opacity", "0");
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-2"><svg width="18" height="8" aria-hidden><line x1="0" y1="4" x2="18" y2="4" stroke="var(--ink)" strokeWidth="1.5" /></svg>BTC daily close</span>
          <span className="inline-flex items-center gap-2"><svg width="18" height="10" aria-hidden><rect width="18" height="10" fill="var(--accent)" opacity="0.3" /></svg>80% band for the next 24h</span>
          <span className="inline-flex items-center gap-2"><svg width="10" height="10" aria-hidden><circle cx="5" cy="5" r="3.5" fill="none" stroke="var(--accent)" strokeWidth="1.5" /></svg>Outside the band, {missPct}% of days</span>
        </div>
        <div role="group" aria-label="Chart range" className="flex gap-1 text-sm">
          {RANGES.map((r) => (
            <button key={r.key} type="button" onClick={() => setRange(r.key)} aria-pressed={range === r.key}
              className={`rounded-sm px-3 py-1.5 transition-colors ${range === r.key ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={box} className="relative w-full">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block touch-pan-y" role="img"
          aria-label="BTC daily close with the model's 80 percent forecast band and a projected range for the next 24 hours"
          onPointerMove={move} onPointerLeave={leave}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="var(--rule)" strokeWidth="1" />
              <text x={M.l + 2} y={y(t) - 6} fontSize="12" fill="var(--muted)" className="num">{usd0(t)}</text>
            </g>
          ))}
          {xticks.map((m) => (
            <text key={m.t} x={x(m.t)} y={H - 8} fontSize="12" fill="var(--muted)" className="num">{m.label}</text>
          ))}
          <path d={band} fill="var(--accent)" opacity="0.3" />
          <path d={closeLine} fill="none" stroke="var(--ink)" strokeWidth="1.75" strokeLinejoin="round" />
          {misses.map((d) => (
            <circle key={d.d} cx={x(new Date(d.d).getTime() + DAY)} cy={y(d.out)} r={n <= 90 ? 3.5 : 2.5} fill="var(--bg)" stroke="var(--accent)" strokeWidth="1.5" />
          ))}
          <polygon fill="var(--accent)" opacity="0.4" points={`${x(tLast)},${y(latest.close)} ${x(tEnd)},${y(pHi)} ${x(tEnd)},${y(pLo)}`} />
          <line x1={x(tLast)} y1={y(latest.close)} x2={x(tEnd)} y2={y(pMid)} stroke="var(--accent)" strokeWidth="1.75" strokeDasharray="4 3" />
          <text x={x(tEnd) + 8} y={yHi + 4} fontSize="12" fontWeight="600" fill="var(--accent)" className="num">{usd0(pHi)}</text>
          <text x={x(tEnd) + 8} y={yLo + 4} fontSize="12" fontWeight="600" fill="var(--accent)" className="num">{usd0(pLo)}</text>
          <line ref={cross} y1={M.t} y2={H - M.b} stroke="var(--muted)" strokeWidth="1" opacity="0" />
        </svg>
        <div ref={tip} className="pointer-events-none absolute left-0 top-0 w-[200px] border border-rule bg-bg px-3 py-2 opacity-0 transition-opacity" />
      </div>
    </div>
  );
}
