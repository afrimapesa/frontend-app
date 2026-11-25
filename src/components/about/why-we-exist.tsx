// Plain markup: the page's NewsMotion wrapper fades in anything marked data-reveal.

const ROWS = [
  {
    kicker: "Money transfers",
    title: "Hidden exchange rate markups",
    body: "Many providers advertise zero fees, then take their margin in the exchange rate. We price every quote against the mid-market rate, so the full cost is on the table.",
    icon: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
  },
  {
    kicker: "Banking",
    title: "Rates scattered bank by bank",
    body: "Savings and loan rates sit on dozens of separate websites and PDFs, when they are published at all. We gather them in one place and rank them, after inflation.",
    icon: <path d="M3 10 12 4l9 6M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18" />,
  },
  {
    kicker: "Government debt",
    title: "Bond yields that are hard to read",
    body: "Auction results and bond prices are spread across central banks and exchanges. We turn them into yields you can compare, and show the real return.",
    icon: <path d="M3 19c4-1 6-6 9-9s5-4 9-5M3 19h18M3 5v14" />,
  },
];

export function WhyWeExist() {
  return (
    <section aria-labelledby="why-heading" className="flex flex-col gap-8">
      <div data-reveal className="flex max-w-[44rem] flex-col gap-3">
        <p className="text-xs font-bold tracking-[0.2em] text-accent-text uppercase">
          Why we exist
        </p>
        <h2
          id="why-heading"
          className="font-display text-[clamp(1.7rem,3.4vw,2.6rem)] leading-[1.08] font-bold tracking-tight text-balance"
        >
          Africa&apos;s financial prices are hard to see, and harder to compare
        </h2>
      </div>

      <ol className="grid gap-4 md:grid-cols-3">
        {ROWS.map((row, i) => (
          <li
            key={row.title}
            data-reveal
            className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-paper text-accent-text ring-1 ring-line">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="size-5 fill-none stroke-current"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {row.icon}
                </svg>
              </span>
              <span className="tabular font-display text-sm font-bold text-muted">
                0{i + 1}
              </span>
            </div>
            <p className="mt-2 text-[0.7rem] font-bold tracking-[0.18em] text-muted uppercase">
              {row.kicker}
            </p>
            <h3 className="font-display text-lg leading-snug font-bold tracking-tight">
              {row.title}
            </h3>
            <p className="text-sm text-muted">{row.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
