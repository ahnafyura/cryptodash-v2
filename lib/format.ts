export function price(n: number): string {
  const d = n >= 1000 ? 2 : n >= 1 ? 2 : 4;
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
export function compact(n: number): string {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}
export function pct(n: number, d = 2): string {
  const s = Math.abs(n).toFixed(d);
  return (n > 0 ? "+" : n < 0 ? "-" : "") + s + "%";
}
export function usd(n: number, d = 0): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
