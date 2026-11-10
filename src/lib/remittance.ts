// Shapes the compare API response (backend: GET /v1/remittance/compare/) for display.
// Ranking happens on the backend; nothing here recalculates prices.

import type { CompareResult } from "./api";

export type RankedQuote = {
  rank: number;
  provider: string; // slug
  name: string;
  website: string;
  netPayout: number;
  feeCost: number; // in sending currency
  marginCost: number; // cost hidden in the exchange rate, sending currency
  totalCost: number;
  transferMinutes: number | null;
  ageMinutes: number; // minutes between the quote and when the results were fetched
  isStale: boolean;
};

/** `fetchedAt` is fixed per response so server and browser render the same ages. */
export function toRankedQuote(
  r: CompareResult,
  fetchedAt: number,
): RankedQuote {
  return {
    rank: r.rank,
    provider: r.provider.slug,
    name: r.provider.name,
    website: r.provider.website,
    netPayout: Number(r.net_payout),
    feeCost: Number(r.transfer_fee),
    marginCost: Number(r.margin_cost),
    totalCost: Number(r.total_cost),
    transferMinutes: r.transfer_time_minutes,
    ageMinutes: Math.max(
      0,
      Math.round((fetchedAt - Date.parse(r.observed_at)) / 60_000),
    ),
    isStale: r.is_stale,
  };
}
