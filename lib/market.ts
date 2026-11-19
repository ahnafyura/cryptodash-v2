import snapshot from "@/public/data/market_snapshot.json";

export type Row = { s: string; p: number; chg: number; hi: number; lo: number; vol: number };
export type Market = { rows: Row[]; asof: string; live: boolean };

const NAMES: Record<string, string> = {
  BTC: "Bitcoin", ETH: "Ethereum", BNB: "BNB", SOL: "Solana", XRP: "XRP",
  ADA: "Cardano", DOGE: "Dogecoin", AVAX: "Avalanche", LINK: "Chainlink", TRX: "TRON",
};
export const nameOf = (s: string) => NAMES[s] ?? s;

const SYMS = Object.keys(NAMES).map((s) => `${s}USDT`);

export async function getMarket(): Promise<Market> {
  const url = "https://data-api.binance.vision/api/v3/ticker/24hr?symbols=" + encodeURIComponent(JSON.stringify(SYMS));
  try {
    const res = await fetch(url, { next: { revalidate: 60 }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(String(res.status));
    const t = (await res.json()) as Array<Record<string, string>>;
    const rows: Row[] = t.map((x) => ({
      s: x.symbol.replace("USDT", ""), p: +x.lastPrice, chg: +x.priceChangePercent,
      hi: +x.highPrice, lo: +x.lowPrice, vol: +x.quoteVolume,
    }));
    rows.sort((a, b) => b.vol - a.vol);
    return { rows, asof: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC", live: true };
  } catch {
    const rows = [...snapshot.rows].sort((a, b) => b.vol - a.vol);
    return { rows, asof: snapshot.asof, live: false };
  }
}
