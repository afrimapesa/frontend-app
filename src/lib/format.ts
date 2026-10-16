const cache = new Map<string, Intl.NumberFormat>();

export function money(value: number, currency: string): string {
  let fmt = cache.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    cache.set(currency, fmt);
  }
  return fmt.format(value);
}

export function rate(value: number): string {
  const digits = value >= 100 ? 2 : value >= 1 ? 4 : 6;
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function duration(minutes: number | null): string {
  if (minutes === null) return "Delivery time not published";
  if (minutes < 60) return `Arrives in about ${minutes} min`;
  if (minutes < 1440) return `Arrives in about ${Math.round(minutes / 60)} h`;
  const days = Math.round(minutes / 1440);
  return `Arrives in ${days} day${days > 1 ? "s" : ""}`;
}

export function currencySymbol(currency: string): string {
  return (
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}
