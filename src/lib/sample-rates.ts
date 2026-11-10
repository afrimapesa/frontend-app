// SAMPLE DATA for the FX ticker only, until it reads live rates (plan task T40).
// Approximate mid-market rates per 1 USD; not real quotes.
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
