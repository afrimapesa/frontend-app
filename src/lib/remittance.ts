// Client-side mirror of the backend engine (backend app/apps/remittance/engine.py).
// Used only while quotes are sample data; once GET /v1/remittance/compare exists (T12)
// the ranking comes from the API and this file goes away.

export type Quote = {
  provider: string; // slug
  name: string;
  website: string; // provider's site, for the outbound link
  fxRate: number; // receiving units per 1 sending unit
  feeFlat: number;
  feePct: number; // fraction: 0.015 = 1.5%
  transferMinutes: number | null;
  ageMinutes: number; // minutes since the quote was observed
};

export type RankedQuote = Quote & {
  rank: number;
  fee: number;
  netPayout: number;
  feeCost: number; // in sending currency
  marginCost: number; // exchange-rate margin vs mid-market, in sending currency
  totalCost: number;
};

const floor2 = (n: number) => Math.floor(n * 100 + 1e-9) / 100;
const round2 = (n: number) => Math.round(n * 100) / 100;

export function rankQuotes(
  quotes: Quote[],
  amount: number,
  fxMid: number,
  limit = 5,
) {
  if (!(amount > 0) || !(fxMid > 0)) return [];
  return quotes
    .map((q) => {
      const fee = round2(q.feeFlat + amount * q.feePct);
      if (fee >= amount) return null;
      const netPayout = floor2((amount - fee) * q.fxRate);
      const totalCost = round2(amount - netPayout / fxMid);
      return {
        ...q,
        rank: 0,
        fee,
        netPayout,
        feeCost: fee,
        marginCost: Math.max(0, round2(totalCost - fee)),
        totalCost,
      };
    })
    .filter((r): r is RankedQuote => r !== null)
    .sort(
      (a, b) =>
        b.netPayout - a.netPayout ||
        a.fee - b.fee ||
        (a.transferMinutes ?? Infinity) - (b.transferMinutes ?? Infinity) ||
        a.provider.localeCompare(b.provider),
    )
    .slice(0, limit)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
