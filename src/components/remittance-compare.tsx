"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatedNumber } from "@/components/animated-number";
import { Odometer } from "@/components/odometer";
import { ProviderLogo } from "@/components/provider-logo";
import { RateTrend } from "@/components/rate-trend";
import { api, type Country } from "@/lib/api";
import { duration, money, rate } from "@/lib/format";
import {
  compareKey,
  DEFAULT_AMOUNT,
  DEFAULT_RECEIVE,
  DEFAULT_SEND,
  type LoadedComparison,
  MAX_AMOUNT,
} from "@/lib/compare";
import { type RankedQuote, toRankedQuote } from "@/lib/remittance";

gsap.registerPlugin(useGSAP, Flip);

const TOP_N = 5;

type Props = {
  sending: Country[];
  receiving: Country[];
  /** First comparison, fetched on the server so the rankings show without a loading state. */
  initial: LoadedComparison | null;
  /** Rendered under the rate trend (top news, a small ad); streamed in by the page. */
  aside?: React.ReactNode;
};

export function RemittanceCompare({
  sending,
  receiving,
  initial,
  aside,
}: Props) {
  const [amountText, setAmountText] = useState(DEFAULT_AMOUNT);
  const [sendCode, setSendCode] = useState(
    sending.find((c) => c.code === DEFAULT_SEND)?.code ?? sending[0].code,
  );
  const [receiveCode, setReceiveCode] = useState(
    receiving.find((c) => c.code === DEFAULT_RECEIVE)?.code ??
      receiving[0].code,
  );
  const [loaded, setLoaded] = useState<LoadedComparison | null>(initial);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const send = sending.find((c) => c.code === sendCode)!;
  const amount = Number(amountText.replace(/,/g, ""));
  const validAmount = amount > 0 && amount <= MAX_AMOUNT;
  const amountParam = validAmount ? amount.toFixed(2) : "";
  const key = compareKey(sendCode, receiveCode, amountParam);

  // Flip: record row positions before any input change  // Flip: record row positions before any input change, animate to new order after render.
  const list = useRef<HTMLOListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const capture = useCallback(() => {
    if (list.current)
      flipState.current = Flip.getState(
        list.current.querySelectorAll("[data-flip-id]"),
      );
  }, []);

  // Ask the backend for the ranking; typing is debounced so each keystroke isn't a request.
  useEffect(() => {
    if (!validAmount || loaded?.key === key) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .compare(sendCode, receiveCode, amountParam, controller.signal)
        .then((data) => {
          capture();
          setFailedKey(null);
          setLoaded({ key, data, fetchedAt: Date.parse(data.as_of) });
        })
        .catch((e: unknown) => {
          if ((e as Error).name !== "AbortError") setFailedKey(key);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    key,
    validAmount,
    loaded?.key,
    sendCode,
    receiveCode,
    amountParam,
    capture,
  ]);

  // What's on screen is always one consistent response, even while the next one loads.
  const data = loaded?.data ?? null;
  const pending = validAmount && loaded?.key !== key && failedKey !== key;
  const ranked = useMemo<RankedQuote[]>(
    () =>
      loaded
        ? loaded.data.results.map((r) => toRankedQuote(r, loaded.fetchedAt))
        : [],
    [loaded],
  );
  const corridorCode = data?.corridor ?? "";
  const sendCurrency = data?.send_currency ?? send.currency;
  const receiveCurrency = data?.receive_currency ?? "";
  const receiveCountry =
    receiving.find((c) => c.currency === receiveCurrency)?.name ?? "";
  const mid = data?.mid_rate ? Number(data.mid_rate) : null;
  const midPayout = data?.mid_payout ? Number(data.mid_payout) : 0;
  const servingCount = data?.providers_on_route ?? 0;
  // The API returns every priced provider; the top 5 show until the list is expanded.
  const shown = showAll ? ranked : ranked.slice(0, TOP_N);
  const hiddenCount = ranked.length - TOP_N;
  const order = shown.map((r) => r.provider).join(",");

  useGSAP(
    () => {
      const state = flipState.current;
      flipState.current = null;
      // The list isn't rendered while the amount is empty or no provider qualifies.
      if (!list.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (state) {
        Flip.from(state, {
          targets: list.current?.querySelectorAll("[data-flip-id]"),
          duration: 0.55,
          ease: "power3.inOut",
          onEnter: (els) =>
            gsap.fromTo(
              els,
              { autoAlpha: 0, y: 16 },
              { autoAlpha: 1, y: 0, duration: 0.4 },
            ),
        });
      }
      // Race: markers run from the start line to where each provider finishes,
      // staggered by rank. Distance left to the finish line is money lost.
      const rows = gsap.utils.toArray<HTMLElement>(
        "[data-flip-id]",
        list.current,
      );
      rows.forEach((row, i) => {
        const x = row.dataset.x ?? "0";
        const opts = {
          duration: 1.25,
          ease: "power3.out",
          delay: 0.25 + i * 0.09,
        };
        gsap.fromTo(
          row.querySelector("[data-fill]"),
          { width: "0%" },
          { width: `${x}%`, ...opts },
        );
        gsap.fromTo(
          row.querySelector("[data-dot]"),
          { left: "0%" },
          { left: `${x}%`, ...opts },
        );
      });
    },
    { dependencies: [order, corridorCode], scope: list },
  );

  const fmtReceive = useCallback(
    (n: number) => (receiveCurrency ? money(n, receiveCurrency) : ""),
    [receiveCurrency],
  );
  const fmtLoss = useCallback(
    (n: number) =>
      receiveCurrency ? `\u2212${money(n, receiveCurrency)}` : "",
    [receiveCurrency],
  );
  // Track scale: the finish line is the mid-market payout; the worst provider shown sits
  // about a quarter of the way along, so differences between providers stay visible.
  const worstGap = Math.max(...shown.map((r) => midPayout - r.netPayout), 0);
  const span = Math.max(worstGap * 1.35, midPayout * 0.001, 0.01);
  const trackX = (payout: number) =>
    Math.min(100, Math.max(2, (1 - (midPayout - payout) / span) * 100));

  return (
    // Mobile order: form, mid-market card, rankings, trend. Desktop: two columns, with the
    // wrappers switching from `contents` (children join the outer flow) to flex columns.
    // On phones the header, form and card are kept compact so the card shows in the first screen.
    <div className="flex flex-col gap-5 sm:gap-8 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10 xl:gap-14">
      <div className="contents lg:flex lg:flex-col lg:gap-8">
        <div className="order-1 flex flex-col gap-4 lg:order-none">
          <header className="flex flex-col gap-1.5 sm:gap-2">
            <h1 className="font-display text-[clamp(1.6rem,3.4vw,2.5rem)] leading-[1.1] font-bold tracking-tight text-balance">
              Get the most for your money to Africa
            </h1>
            <p className="text-sm text-muted sm:text-base">
              Compare exchange rates and fees from {servingCount || 15}{" "}
              providers, ranked by what your recipient actually receives.
            </p>
          </header>

          <form
            className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-surface p-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)] sm:gap-4 sm:p-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <Field id="send" label="Sending from">
              <Select
                id="send"
                value={sendCode}
                onChange={(v) => {
                  capture();
                  setSendCode(v);
                }}
                options={sending.map((c) => ({
                  value: c.code,
                  label: `${c.name} (${c.currency})`,
                  name: c.name,
                  currency: c.currency,
                }))}
              />
            </Field>
            <Field id="receive" label="Receiving in">
              <Select
                id="receive"
                value={receiveCode}
                onChange={(v) => {
                  capture();
                  setReceiveCode(v);
                }}
                options={receiving.map((c) => ({
                  value: c.code,
                  label: `${c.name} (${c.currency})`,
                  name: c.name,
                  currency: c.currency,
                }))}
              />
            </Field>
            <Field
              id="amount"
              label="Amount to send"
              className="col-span-2 sm:col-span-1"
            >
              <div className="flex items-center rounded-lg border border-line bg-surface focus-within:border-ink focus-within:ring-1 focus-within:ring-ink">
                <input
                  id="amount"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="Enter amount"
                  value={amountText}
                  onChange={(e) => {
                    capture();
                    setAmountText(e.target.value.replace(/[^\d.,]/g, ""));
                  }}
                  className="tabular min-w-0 flex-1 bg-transparent py-2 pl-3 font-display text-lg font-semibold outline-none sm:pl-4 placeholder:text-base placeholder:font-normal placeholder:text-muted"
                />
                <span className="px-3 text-sm font-semibold text-muted">
                  {send.currency}
                </span>
              </div>
            </Field>
          </form>
        </div>

        <section
          aria-labelledby="results-heading"
          className="order-3 flex flex-col gap-5 lg:order-none"
        >
          <div>
            <h2
              id="results-heading"
              className="font-display text-xl font-semibold"
            >
              {showAll ? "All provider rankings" : "Top provider rankings"}
            </h2>
            {ranked.length > 0 && (
              <p className="text-sm text-muted">
                {showAll ? "All" : "Top"} {shown.length} of {servingCount},
                ranked by what your recipient gets
              </p>
            )}
          </div>

          {!validAmount ? (
            <p className="rounded-lg border border-dashed border-line p-6 text-muted">
              Enter an amount up to {MAX_AMOUNT.toLocaleString("en-GB")} to
              compare providers.
            </p>
          ) : failedKey === key ? (
            <p className="rounded-lg border border-dashed border-line p-6 text-muted">
              Couldn&apos;t load provider quotes. Check your connection and try
              again.
            </p>
          ) : !data ? (
            <div
              aria-busy
              className="h-64 animate-pulse rounded-xl bg-surface"
            />
          ) : mid === null ? (
            <p className="rounded-lg border border-dashed border-line p-6 text-muted">
              The mid-market rate for this route isn&apos;t available right now,
              so providers can&apos;t be compared fairly. Try again shortly.
            </p>
          ) : ranked.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line p-6 text-muted">
              No provider quotes are available for this route right now.
            </p>
          ) : (
            <div
              className={`transition-opacity ${pending ? "opacity-60" : ""}`}
              aria-busy={pending}
            >
              {/* The finish line spans this box only, not the "View all" button below. */}
              <div className="relative">
                <div
                  className={`${ROW_GRID} pb-3 text-xs text-muted sm:text-sm`}
                >
                  <span />
                  <span className="pr-2 text-right">
                    Mid-market{" "}
                    <span className="tabular text-ink">
                      {fmtReceive(midPayout)}
                    </span>
                  </span>
                  <span className="text-right">Recipient gets</span>
                </div>
                {/* The finish line: one dashed rule through every track. */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute top-7 bottom-0 border-r-2 border-dashed border-ink/35 ${FINISH_LINE}`}
                />
                <ol
                  ref={list}
                  id="provider-list"
                  className="border-b border-line"
                >
                  {shown.map((r) => (
                    <ResultRow
                      key={r.provider}
                      result={r}
                      x={trackX(r.netPayout)}
                      sendCurrency={sendCurrency}
                      formatPayout={fmtReceive}
                      formatLoss={fmtLoss}
                      loss={Math.max(0, midPayout - r.netPayout)}
                    />
                  ))}
                </ol>
              </div>
              {hiddenCount > 0 && (
                <button
                  type="button"
                  aria-expanded={showAll}
                  aria-controls="provider-list"
                  onClick={() => {
                    capture();
                    setShowAll((v) => !v);
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-sm font-semibold transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                >
                  {showAll
                    ? "Show top 5 only"
                    : `View all ${ranked.length} providers`}
                  <svg
                    aria-hidden
                    viewBox="0 0 12 8"
                    className={`w-2.5 fill-current transition-transform ${showAll ? "rotate-180" : ""}`}
                  >
                    <path d="M6 8 0 0h12z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          <p className="text-sm text-muted">
            Providers are listed in order of the amount your recipient receives.{" "}
            AFRIMAPESA does not recommend any provider: check fees, limits and
            terms with the provider before you send.
          </p>

          {data?.sample && (
            <p className="rounded-md border border-dashed border-line px-4 py-3 text-sm text-muted">
              Preview with sample rates. Countries and provider coverage are
              live; exchange rates and fees are illustrative until live quote
              collection is switched on.
            </p>
          )}
        </section>
      </div>

      <aside className="contents lg:flex lg:flex-col lg:gap-6">
        {data && mid !== null && (
          <div className="order-2 lg:order-none">
            <MidMarketCard
              amount={Number(data.amount)}
              mid={mid}
              midPayout={midPayout}
              sendCurrency={sendCurrency}
              receiveCurrency={receiveCurrency}
              receiveCountry={receiveCountry}
              formatPayout={fmtReceive}
            />
          </div>
        )}
        {receiveCurrency && (
          <div className="order-4 lg:order-none">
            <RateTrend base={sendCurrency} quote={receiveCurrency} />
          </div>
        )}
        {aside && <div className="order-5 lg:order-none">{aside}</div>}
      </aside>
    </div>
  );
}

function MidMarketCard({
  amount,
  mid,
  midPayout,
  sendCurrency,
  receiveCurrency,
  receiveCountry,
  formatPayout,
}: {
  amount: number;
  mid: number;
  midPayout: number;
  sendCurrency: string;
  receiveCurrency: string;
  receiveCountry: string;
  formatPayout: (n: number) => string;
}) {
  const card = useRef<HTMLElement>(null);
  // Currency codes (KES 257,648.63) run longer than symbols (₦408,000.00).
  const payoutText = formatPayout(midPayout);

  // The page's one orchestrated entrance: the card wipes open, then the odometer rolls.
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        card.current,
        { clipPath: "inset(0% 100% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.9,
          ease: "power4.inOut",
          clearProps: "clipPath",
        },
      );
    },
    { scope: card },
  );

  return (
    <section
      ref={card}
      aria-live="polite"
      className="relative overflow-hidden rounded-2xl bg-black px-5 py-4 text-white sm:px-6"
    >
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -top-14 -right-14 hidden size-40 text-white opacity-[0.09] sm:block"
      >
        <circle
          cx="80"
          cy="100"
          r="70"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="120"
          cy="100"
          r="70"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <p className="relative text-xs text-white/70 sm:text-sm">
        At the mid-market rate, {money(amount, sendCurrency)} sent to{" "}
        {receiveCountry} becomes
      </p>
      <div className="relative mt-1 flex flex-wrap items-baseline justify-between gap-x-4">
        <Odometer
          text={payoutText}
          className="font-display font-bold tracking-tight tabular"
          style={{ fontSize: payoutSize(payoutText) }}
        />
        <p className="tabular text-sm font-semibold text-white/90">
          <span className="sr-only">Mid-market rate: </span>1 {sendCurrency} ={" "}
          {rate(mid)} {receiveCurrency}
        </p>
      </div>
      <p className="relative mt-2 border-t border-white/15 pt-2 text-xs text-white/60">
        The rate banks trade currencies at. Providers add fees and a margin, so
        your recipient receives less.
      </p>
    </section>
  );
}

/**
 * Odometer font size that keeps the figure inside the card at any length: each digit is
 * ~0.62em wide; the figure shares its row with the rate on desktop (~420px) and gets ~82vw on a phone.
 * Capped lower on phones (clamp) so the card stays short enough to sit in the first screen.
 */
function payoutSize(text: string): string {
  const n = Math.max(text.length, 1);
  return `min(clamp(2rem, 6vw, 2.6rem), ${(420 / (n * 0.62)).toFixed(1)}px, ${(82 / (n * 0.62)).toFixed(2)}vw)`;
}

function Field({
  id,
  label,
  className = "",
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-xs font-semibold sm:text-sm">
        {label}
      </label>
      {children}
    </div>
  );
}

// Phone-width names for the half-row selects (the open picker still lists full names).
const SHORT_NAMES: Record<string, string> = {
  "United States": "USA",
  "United Kingdom": "UK",
  "European Union": "EU",
  "South Africa": "S. Africa",
};

function Select({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; name: string; currency: string }[];
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  // The native select (transparent, on top) keeps the platform picker; the face underneath
  // truncates the country name but always shows the currency, so it fits half a phone row.
  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-line bg-surface py-2.5 pr-8 pl-3 font-medium focus-within:border-ink focus-within:ring-1 focus-within:ring-ink">
      <span aria-hidden className="min-w-0 flex-1 truncate">
        <span className="sm:hidden">
          {SHORT_NAMES[current?.name ?? ""] ?? current?.name}
        </span>
        <span className="hidden sm:inline">{current?.name}</span>
      </span>
      <span aria-hidden className="shrink-0 text-sm font-semibold text-muted">
        {current?.currency}
      </span>
      <svg
        aria-hidden
        viewBox="0 0 12 8"
        className="pointer-events-none absolute top-1/2 right-3 w-2.5 -translate-y-1/2 fill-current text-muted"
      >
        <path d="M6 8 0 0h12z" />
      </svg>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Rank | provider + track | payout. The track's right edge is the finish line.
const ROW_GRID =
  "grid grid-cols-[1.25rem_minmax(0,1fr)_7.5rem] gap-x-3 sm:grid-cols-[1.75rem_minmax(0,1fr)_9rem] sm:gap-x-4";
const FINISH_LINE =
  "right-[calc(7.5rem+0.75rem)] sm:right-[calc(9rem+1rem)]";

function ResultRow({
  result: r,
  x,
  sendCurrency,
  formatPayout,
  formatLoss,
  loss,
}: {
  result: RankedQuote;
  x: number;
  sendCurrency: string;
  formatPayout: (n: number) => string;
  formatLoss: (n: number) => string;
  loss: number;
}) {
  return (
    <li
      data-flip-id={r.provider}
      data-x={x.toFixed(2)}
      className={`${ROW_GRID} items-start border-t border-line py-3.5 sm:py-4`}
    >
      <span className="font-display tabular text-lg leading-none font-semibold text-ink/30 sm:text-xl">
        {r.rank}
      </span>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <ProviderLogo slug={r.provider} name={r.name} size={26} />
          <p className="font-display text-sm leading-tight font-semibold sm:text-base">
            {r.name}
          </p>
        </div>

        <div
          className="relative h-4"
          role="img"
          aria-label={`${formatLoss(loss)} short of the mid-market payout`}
        >
          <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
          <span
            data-fill
            className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 rounded-full bg-ink/70 transition-[width] duration-500"
            style={{ width: `${x}%` }}
          />
          <span
            data-dot
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-500"
            style={{ left: `${x}%` }}
          >
            <span className="relative block size-3 rounded-full border-2 border-ink bg-paper" />
          </span>
        </div>

        <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-[0.7rem] text-muted sm:text-xs">
          <span>{duration(r.transferMinutes)}</span>
          <span>
            Fee{" "}
            <span className="tabular">{money(r.feeCost, sendCurrency)}</span> +
            rate margin{" "}
            <span className="tabular">{money(r.marginCost, sendCurrency)}</span>
          </span>
          <span>Checked {r.ageMinutes} min ago</span>
          {r.isStale && (
            <span className="font-medium text-loss">
              Rate may be out of date
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 text-right">
        <AnimatedNumber
          value={r.netPayout}
          format={formatPayout}
          className="font-display tabular text-sm leading-tight font-semibold sm:text-base"
        />
        <AnimatedNumber
          value={loss}
          format={formatLoss}
          className="tabular text-[0.7rem] font-medium text-loss sm:text-xs"
        />
        {r.website && (
          <a
            href={r.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Go to ${r.name} (opens in a new tab)`}
            className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-semibold transition-colors hover:border-ink hover:bg-ink hover:text-paper"
          >
            <span className="sm:hidden">Visit</span>
            <span className="hidden whitespace-nowrap sm:inline">
              {r.name.length > 12 ? "Visit site" : `Go to ${r.name}`}
            </span>
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              className="size-3 fill-none stroke-current"
              strokeWidth="1.8"
            >
              <path
                d="M6 3h7v7M13 3 4 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        )}
      </div>
    </li>
  );
}
