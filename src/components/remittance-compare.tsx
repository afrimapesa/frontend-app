"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useCallback, useMemo, useRef, useState } from "react";

import { AnimatedNumber } from "@/components/animated-number";
import { Odometer } from "@/components/odometer";
import { ProviderLogo } from "@/components/provider-logo";
import { RateTrend } from "@/components/rate-trend";
import type { Country, Provider } from "@/lib/api";
import { duration, money, rate } from "@/lib/format";
import { type RankedQuote, rankQuotes } from "@/lib/remittance";
import { sampleMidRate, sampleQuotes } from "@/lib/sample-quotes";

gsap.registerPlugin(useGSAP, Flip);

type Props = {
  sending: Country[];
  receiving: Country[];
  providers: Provider[];
};

export function RemittanceCompare({ sending, receiving, providers }: Props) {
  const [amountText, setAmountText] = useState("200");
  const [sendCode, setSendCode] = useState(
    sending.find((c) => c.code === "GB")?.code ?? sending[0].code,
  );
  const [receiveCode, setReceiveCode] = useState(
    receiving.find((c) => c.code === "NG")?.code ?? receiving[0].code,
  );

  const send = sending.find((c) => c.code === sendCode)!;
  const receive = receiving.find((c) => c.code === receiveCode)!;
  const amount = Number(amountText.replace(/,/g, ""));
  const corridorCode = `${send.code}-${send.currency}-${receive.code}-${receive.currency}`;

  const { mid, ranked, servingCount } = useMemo(() => {
    const serving = providers.filter((p) => p.corridors.includes(corridorCode));
    const mid = sampleMidRate(send.currency, receive.currency);
    return {
      mid,
      ranked: rankQuotes(
        sampleQuotes(serving, send.currency, receive.currency),
        amount,
        mid,
      ),
      servingCount: serving.length,
    };
  }, [providers, corridorCode, send.currency, receive.currency, amount]);

  // Flip: record row positions before any input change, animate to new order after render.
  const list = useRef<HTMLOListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const capture = () => {
    if (list.current)
      flipState.current = Flip.getState(
        list.current.querySelectorAll("[data-flip-id]"),
      );
  };
  const order = ranked.map((r) => r.provider).join(",");

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
      const ring = list.current?.querySelector("[data-ring]");
      if (ring)
        gsap.fromTo(
          ring,
          { scale: 1, autoAlpha: 0.7 },
          {
            scale: 3.2,
            autoAlpha: 0,
            duration: 0.9,
            ease: "power2.out",
            delay: 1.4,
          },
        );
    },
    { dependencies: [order, corridorCode], scope: list },
  );

  const fmtReceive = useCallback(
    (n: number) => money(n, receive.currency),
    [receive.currency],
  );
  const fmtLoss = useCallback(
    (n: number) => `\u2212${money(n, receive.currency)}`,
    [receive.currency],
  );
  const midPayout = amount > 0 ? amount * mid : 0;
  // Track scale: the finish line is the mid-market payout; the worst provider shown sits
  // about a quarter of the way along, so differences between providers stay visible.
  const worstGap = Math.max(...ranked.map((r) => midPayout - r.netPayout), 0);
  const span = Math.max(worstGap * 1.35, midPayout * 0.001, 0.01);
  const trackX = (payout: number) =>
    Math.min(100, Math.max(2, (1 - (midPayout - payout) / span) * 100));
  const best = ranked[0];
  const worst = ranked.at(-1);

  return (
    // Mobile order: form, best deal, rankings, trend. Desktop: two columns, with the
    // wrappers switching from `contents` (children join the outer flow) to flex columns.
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12 xl:gap-16">
      <div className="contents lg:flex lg:flex-col lg:gap-12">
        <div className="order-1 flex flex-col gap-6 lg:order-none">
          <header className="flex flex-col gap-2">
            <h1 className="font-display text-[clamp(1.9rem,4vw,2.9rem)] leading-[1.1] font-bold tracking-tight text-balance">
              Get the most for your money to Africa
            </h1>
            <p className="text-muted sm:text-lg">
              Compare exchange rates and fees from {servingCount || 15}{" "}
              providers, ranked by what your recipient actually receives.
            </p>
          </header>

          <form
            className="grid gap-5 rounded-xl border border-line p-5 sm:grid-cols-2 sm:p-6"
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
                }))}
              />
            </Field>
            <Field id="amount" label="Amount to send" className="sm:col-span-2">
              <div className="flex items-center rounded-lg border border-line bg-paper focus-within:border-ink focus-within:ring-1 focus-within:ring-ink">
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
                  className="tabular min-w-0 flex-1 bg-transparent px-4 py-3 font-display text-2xl font-semibold outline-none placeholder:text-base placeholder:font-normal placeholder:text-muted"
                />
                <span className="px-4 text-sm font-semibold text-muted">
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
              Top provider rankings
            </h2>
            {ranked.length > 0 && (
              <p className="text-sm text-muted">
                Top {ranked.length} of {servingCount}, ranked by what your
                recipient gets
              </p>
            )}
          </div>

          {!(amount > 0) ? (
            <p className="rounded-lg border border-dashed border-line p-6 text-muted">
              Enter an amount to compare providers.
            </p>
          ) : ranked.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line p-6 text-muted">
              No provider we track can send {money(amount, send.currency)} on
              this route. Try a larger amount.
            </p>
          ) : (
            <div className="relative">
              <div className={`${ROW_GRID} pb-3 text-xs text-muted sm:text-sm`}>
                <span />
                <span className="pr-2 text-right">
                  Mid-market{" "}
                  <span className="tabular text-ink">
                    {money(midPayout, receive.currency)}
                  </span>
                </span>
                <span className="text-right">Recipient gets</span>
              </div>
              {/* The finish line: one dashed rule through every track. */}
              <span
                aria-hidden
                className={`pointer-events-none absolute top-7 bottom-0 border-r-2 border-dashed border-ink/35 ${FINISH_LINE}`}
              />
              <ol ref={list} className="border-b border-line">
                {ranked.map((r) => (
                  <ResultRow
                    key={r.provider}
                    result={r}
                    isBest={r === best}
                    x={trackX(r.netPayout)}
                    sendCurrency={send.currency}
                    formatPayout={fmtReceive}
                    formatLoss={fmtLoss}
                    loss={Math.max(0, midPayout - r.netPayout)}
                  />
                ))}
              </ol>
            </div>
          )}

          {best && worst && best !== worst && (
            <p className="text-sm text-muted sm:text-base">
              Choosing {best.name} over {worst.name} puts{" "}
              <span className="tabular font-medium text-ink">
                {money(best.netPayout - worst.netPayout, receive.currency)}
              </span>{" "}
              more in your recipient&apos;s hands.
            </p>
          )}

          <p className="rounded-md border border-dashed border-line px-4 py-3 text-sm text-muted">
            Preview with sample rates. Countries and provider coverage are live;
            exchange rates and fees are illustrative until live quote collection
            is switched on.
          </p>
        </section>
      </div>

      <aside className="contents lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-10 lg:self-start">
        {best && amount > 0 && (
          <div className="order-2 lg:order-none">
            <BestDeal
              best={best}
              mid={mid}
              midPayout={midPayout}
              sendCurrency={send.currency}
              receiveCurrency={receive.currency}
              receiveCountry={receive.name}
              formatPayout={fmtReceive}
            />
          </div>
        )}
        <div className="order-4 lg:order-none">
          <RateTrend base={send.currency} quote={receive.currency} />
        </div>
      </aside>
    </div>
  );
}

function BestDeal({
  best,
  mid,
  midPayout,
  sendCurrency,
  receiveCurrency,
  receiveCountry,
  formatPayout,
}: {
  best: RankedQuote;
  mid: number;
  midPayout: number;
  sendCurrency: string;
  receiveCurrency: string;
  receiveCountry: string;
  formatPayout: (n: number) => string;
}) {
  const card = useRef<HTMLElement>(null);
  const lost = Math.max(0, midPayout - best.netPayout);

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
      className="relative overflow-hidden rounded-2xl bg-black px-6 py-7 text-white sm:px-8 sm:py-8"
    >
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -top-20 -right-20 hidden size-72 text-white opacity-[0.09] sm:block"
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
      <p className="relative text-white/75">
        Best deal right now: with{" "}
        <span className="inline-flex items-center gap-1.5 align-middle font-semibold text-white">
          <ProviderLogo
            slug={best.provider}
            name={best.name}
            size={22}
            className="border-white/20"
          />
          {best.name}
        </span>
        , your recipient in {receiveCountry} gets
      </p>
      <Odometer
        text={formatPayout(best.netPayout)}
        className="relative mt-3 font-display text-[clamp(2.4rem,9vw,4.25rem)] font-bold tracking-tight tabular"
      />
      <dl className="relative mt-6 grid grid-cols-2 gap-4 border-t border-white/20 pt-5">
        <div>
          <dt className="text-xs text-white/65 sm:text-sm">Mid-market rate</dt>
          <dd className="tabular mt-1 font-semibold">
            1 {sendCurrency} = {rate(mid)} {receiveCurrency}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-white/65 sm:text-sm">
            Mid-market payout
          </dt>
          <dd className="tabular mt-1 font-semibold">
            {formatPayout(midPayout)}
          </dd>
        </div>
      </dl>
      <p className="relative mt-4 text-sm text-white/75">
        <AnimatedNumber
          value={lost}
          format={formatPayout}
          className="tabular font-semibold text-white"
        />{" "}
        lost on the way ({money(best.totalCost, sendCurrency)} of what you send)
        compared with the mid-market payout.
      </p>
    </section>
  );
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
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-lg border border-line bg-paper py-3 pr-10 pl-4 font-medium outline-none focus:border-ink focus:ring-1 focus:ring-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 8"
        className="pointer-events-none absolute top-1/2 right-4 w-2.5 -translate-y-1/2 fill-current text-muted"
      >
        <path d="M6 8 0 0h12z" />
      </svg>
    </div>
  );
}

// Rank | provider + track | payout. The track's right edge is the finish line.
const ROW_GRID =
  "grid grid-cols-[1.75rem_minmax(0,1fr)_8.75rem] gap-x-3 sm:grid-cols-[2.75rem_minmax(0,1fr)_12rem] sm:gap-x-5";
const FINISH_LINE =
  "right-[calc(8.75rem+0.75rem)] sm:right-[calc(12rem+1.25rem)]";

function ResultRow({
  result: r,
  isBest,
  x,
  sendCurrency,
  formatPayout,
  formatLoss,
  loss,
}: {
  result: RankedQuote;
  isBest: boolean;
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
      className={`${ROW_GRID} items-start border-t border-line py-5 sm:py-6`}
    >
      <span
        className={`font-display tabular text-3xl leading-none font-semibold sm:text-[2.6rem] ${
          isBest ? "text-accent-text" : "text-ink/25"
        }`}
      >
        {r.rank}
      </span>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center gap-3">
          <ProviderLogo slug={r.provider} name={r.name} size={40} />
          <p className="flex flex-wrap items-baseline gap-x-3 font-display text-lg leading-tight font-semibold sm:text-xl">
            {r.name}
            {isBest && (
              <span className="font-sans text-sm font-medium text-accent-text">
                Most money delivered
              </span>
            )}
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
            className={`absolute top-1/2 left-0 h-[3px] -translate-y-1/2 rounded-full transition-[width] duration-500 ${
              isBest ? "bg-accent" : "bg-ink/70"
            }`}
            style={{ width: `${x}%` }}
          />
          <span
            data-dot
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-500"
            style={{ left: `${x}%` }}
          >
            {isBest && (
              <span
                data-ring
                aria-hidden
                className="invisible absolute inset-0 rounded-full bg-accent"
              />
            )}
            <span
              className={`relative block size-3.5 rounded-full border-2 ${
                isBest ? "border-accent bg-accent" : "border-ink bg-paper"
              }`}
            />
          </span>
        </div>

        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted sm:text-sm">
          <span>{duration(r.transferMinutes)}</span>
          <span>
            Fee{" "}
            <span className="tabular">{money(r.feeCost, sendCurrency)}</span> +
            rate margin{" "}
            <span className="tabular">{money(r.marginCost, sendCurrency)}</span>
          </span>
          <span>Checked {r.ageMinutes} min ago</span>
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 text-right">
        <AnimatedNumber
          value={r.netPayout}
          format={formatPayout}
          className="font-display tabular text-base leading-tight font-semibold sm:text-[1.6rem]"
        />
        <AnimatedNumber
          value={loss}
          format={formatLoss}
          className="tabular text-xs font-medium text-loss sm:text-sm"
        />
        {r.website && (
          <a
            href={r.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Go to ${r.name} (opens in a new tab)`}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold transition-colors hover:border-ink hover:bg-ink hover:text-paper sm:text-sm"
          >
            <span className="sm:hidden">Visit</span>
            <span className="hidden whitespace-nowrap sm:inline">
              {r.name.length > 12 ? "Visit site" : `Go to ${r.name}`}
            </span>
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              className="size-3.5 fill-none stroke-current"
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
