export function RangeMark({ lo, hi, p }: { lo: number; hi: number; p: number }) {
  const x = hi > lo ? ((p - lo) / (hi - lo)) * 88 + 4 : 48;
  return (
    <svg width="96" height="12" viewBox="0 0 96 12" role="img" aria-label="Position within the 24 hour range">
      <line x1="4" y1="6" x2="92" y2="6" stroke="var(--rule)" strokeWidth="2" strokeLinecap="round" />
      <line x1={x} y1="1" x2={x} y2="11" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
