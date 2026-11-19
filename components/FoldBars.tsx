import { scaleLinear } from "d3-scale";

type Fold = { fold: number; period: string; gain_pct: number };
const W = 1000, H = 260, M = { t: 28, r: 8, b: 30, l: 48 };

export function FoldBars({ folds }: { folds: Fold[] }) {
  const lo = Math.min(0, ...folds.map((f) => f.gain_pct));
  const hi = Math.max(0, ...folds.map((f) => f.gain_pct));
  const y = scaleLinear().domain([lo * 1.1, Math.max(hi * 1.4, 4)]).range([H - M.b, M.t]).nice(4);
  const bw = (W - M.l - M.r) / folds.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
      aria-label="Model error versus the last-price baseline for each of 16 test folds. Bars below zero mean the model was worse.">
      {y.ticks(4).map((t) => (
        <g key={t}>
          <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="var(--rule)" strokeWidth={t === 0 ? 1.5 : 1} />
          <text x={M.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" className="num">{t}%</text>
        </g>
      ))}
      {folds.map((f, i) => {
        const x = M.l + i * bw + bw * 0.18;
        const h = Math.abs(y(f.gain_pct) - y(0));
        const top = f.gain_pct >= 0 ? y(f.gain_pct) : y(0);
        return (
          <g key={f.fold}>
            <rect x={x} y={top} width={bw * 0.64} height={Math.max(h, 1)} rx="1"
              fill={f.gain_pct >= 0 ? "var(--accent)" : "var(--ink)"} opacity={f.gain_pct >= 0 ? 1 : 0.72}>
              <title>{`Fold ${f.fold}, ${f.period}: ${f.gain_pct}% vs baseline`}</title>
            </rect>
            <text x={x + bw * 0.32} y={f.gain_pct >= 0 ? top - 6 : top + h + 14} textAnchor="middle" fontSize="11.5"
              fontWeight={f.gain_pct >= 0 ? 600 : 400} fill={f.gain_pct >= 0 ? "var(--accent)" : "var(--muted)"} className="num">
              {f.gain_pct > 0 ? "+" : ""}{f.gain_pct}
            </text>
            <text x={x + bw * 0.32} y={H - 8} textAnchor="middle" fontSize="11.5" fill="var(--muted)" className="num">{f.fold}</text>
          </g>
        );
      })}
    </svg>
  );
}
