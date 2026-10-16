// SAMPLE DATA ONLY: plausible, deterministic quotes for designing the comparison page
// before live ingestion exists. Do not show these numbers as real rates.

import type { Quote } from "./remittance";

// Approximate mid-market rates per 1 USD (illustrative, not live).
const USD_TO: Record<string, number> = {
  USD: 1,
  GBP: 0.75,
  EUR: 0.86,
  NGN: 1530,
  GHS: 15.4,
  KES: 129.2,
  TZS: 2655,
  EGP: 48.6,
  ZAR: 17.7,
};

export function sampleMidRate(send: string, receive: string): number {
  return USD_TO[receive] / USD_TO[send];
}

// Rough provider profiles: exchange-rate margin and fee shape.
const PROFILES: Record<
  string,
  { margin: number; flat: number; pct: number; minutes: number | null }
> = {
  wise: { margin: 0.002, flat: 0.79, pct: 0.0045, minutes: 30 },
  remitly: { margin: 0.019, flat: 0, pct: 0, minutes: 60 },
  worldremit: { margin: 0.014, flat: 1.99, pct: 0, minutes: 120 },
  "western-union": { margin: 0.035, flat: 1.99, pct: 0, minutes: 1440 },
  moneygram: { margin: 0.032, flat: 3.99, pct: 0, minutes: null },
  lemfi: { margin: 0.006, flat: 0, pct: 0, minutes: 10 },
  sendwave: { margin: 0.011, flat: 0, pct: 0, minutes: 15 },
  nala: { margin: 0.008, flat: 0, pct: 0, minutes: 20 },
  "chipper-cash": { margin: 0.013, flat: 0, pct: 0, minutes: 30 },
  flutterwave: { margin: 0.012, flat: 0.99, pct: 0, minutes: 60 },
  opay: { margin: 0.015, flat: 0, pct: 0, minutes: 30 },
  revolut: { margin: 0.005, flat: 0, pct: 0.005, minutes: 1440 },
  "taptap-send": { margin: 0.009, flat: 0, pct: 0, minutes: 15 },
  ofx: { margin: 0.007, flat: 0, pct: 0, minutes: 2880 },
  xe: { margin: 0.01, flat: 0, pct: 0, minutes: 1440 },
};

// Small deterministic jitter so each corridor looks a little different.
function jitter(seed: string): number {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 1000) / 1000 - 0.5) * 0.006; // ±0.3%
}

export function sampleQuotes(
  providers: { slug: string; name: string }[],
  send: string,
  receive: string,
): Quote[] {
  const mid = sampleMidRate(send, receive);
  return providers.flatMap((p, i) => {
    const profile = PROFILES[p.slug];
    if (!profile) return [];
    const margin = Math.max(
      0,
      profile.margin + jitter(`${p.slug}${send}${receive}`),
    );
    return [
      {
        provider: p.slug,
        name: p.name,
        fxRate: Number((mid * (1 - margin)).toFixed(4)),
        feeFlat: profile.flat,
        feePct: profile.pct,
        transferMinutes: profile.minutes,
        ageMinutes: 2 + ((i * 7) % 50),
      },
    ];
  });
}
