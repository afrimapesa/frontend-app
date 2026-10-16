"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useCallback, useMemo, useRef, useState } from "react";

import { AnimatedNumber } from "@/components/animated-number";
import { Odometer } from "@/components/odometer";
import type { Country, Provider } from "@/lib/api";
import { currencySymbol, duration, money, rate } from "@/lib/format";
import { type RankedQuote, rankQuotes } from "@/lib/remittance";
import { sampleMidRate, sampleQuotes } from "@/lib/sample-quotes";

gsap.registerPlugin(useGSAP, Flip);

// Reads naturally in "Send £200 from the UK to Nigeria".
const SENDING_LABELS: Record<string, string> = {
  US: "the US",
  GB: "the UK",
  EU: "the EU",
};

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
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 xl:gap-20">
      <div className="flex flex-col gap-8 lg:sticky lg:top-8 lg:self-start">
        <form
          className="font-display text-[clamp(1.9rem,5.2vw,3.6rem)] leading-[1.15] font-semibold tracking-tight text-balance lg:text-[clamp(2.2rem,3.4vw,3.4rem)]"
          onSubmit={(e) => e.preventDefault()}
        >
          <label htmlFor="amount">Send </label>
          <span className="inline-flex items-baseline border-b-[3px] border-ink">
            <span aria-hidden>{currencySymbol(send.currency)}</span>
            <input
              id="amount"
              inputMode="decimal"
              autoComplete="off"
              value={amountText}
              onChange={(e) => {
                capture();
                setAmountText(e.target.value.replace(/[^\d.,]/g, ""));
              }}
              className="amount-input tabular bg-transparent outline-none"
              style={
                {
                  "--len": Math.max(amountText.length, 1),
                } as React.CSSProperties
              }
              aria-describedby="amount-help"
            />
          </span>{" "}
          <label htmlFor="send">from</label>{" "}
          <InlineSelect
            id="send"
            value={sendCode}
            onChange={(v) => {
              capture();
              setSendCode(v);
            }}
            options={sending.map((c) => ({
              value: c.code,
              label: SENDING_LABELS[c.code] ?? c.name,
            }))}
          />{" "}
          <label htmlFor="receive">to</label>{" "}
          <InlineSelect
            id="receive"
            value={receiveCode}
            onChange={(v) => {
              capture();
              setReceiveCode(v);
            }}
            options={receiving.map((c) => ({ value: c.code, label: c.name }))}
          />
          <p id="amount-help" className="sr-only">
            Amount in {send.currency}
          </p>
        </form>

        {best && amount > 0 && (
          <BestDeal
            best={best}
            midPayout={midPayout}
            sendCurrency={send.currency}
            receiveCurrency={receive.currency}
            receiveCountry={receive.name}
            formatPayout={fmtReceive}
          />
        )}

        <div className="flex flex-col gap-1 border-l-[3px] border-line pl-4 text-sm text-muted sm:text-base">
          <p>
            Mid-market rate:{" "}
            <span className="tabular font-medium text-ink">
              1 {send.currency} = {rate(mid)} {receive.currency}
            </span>
          </p>
          {midPayout > 0 && (
            <p>
              At that rate with no fees, your recipient would get{" "}
              <span className="tabular font-medium text-ink">
                {money(midPayout, receive.currency)}
              </span>
              . Every provider delivers less. The gap is what the transfer
              really costs you.
            </p>
          )}
        </div>
      </div>

      <section
        aria-labelledby="results-heading"
        className="flex flex-col gap-5"
      >
        <h2
          id="results-heading"
          className="text-sm font-medium text-muted sm:text-base"
        >
          {ranked.length > 0
            ? `Top ${ranked.length} of ${servingCount} providers, ranked by what your recipient gets`
            : "Providers on this route"}
        </h2>

        {!(amount > 0) ? (
          <p className="rounded-lg border border-dashed border-line p-6 text-muted">
            Enter an amount to compare providers.
          </p>
        ) : ranked.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-6 text-muted">
            No provider we track can send {money(amount, send.currency)} on this
            route. Try a larger amount.
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
  );
}

function BestDeal({
  best,
  midPayout,
  sendCurrency,
  receiveCurrency,
  receiveCountry,
  formatPayout,
}: {
  best: RankedQuote;
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
      className="relative overflow-hidden rounded-[1.25rem] bg-ink px-5 py-7 text-paper sm:px-9 sm:py-10"
    >
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -top-16 -right-16 hidden size-72 opacity-[0.12] sm:block"
      >
        <circle
          cx="80"
          cy="100"
          r="70"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="120" cy="100" r="70" fill="var(--accent)" />
      </svg>
      <p className="relative text-base text-paper/75 sm:text-lg">
        Best deal right now: with{" "}
        <span className="font-semibold text-paper">{best.name}</span>, your
        recipient in {receiveCountry} gets
      </p>
      <Odometer
        text={formatPayout(best.netPayout)}
        className="relative mt-3 font-display text-[clamp(2.5rem,10vw,5.75rem)] font-semibold tracking-tight tabular lg:text-[clamp(2.6rem,4.4vw,4.6rem)]"
      />
      <p className="relative mt-5 text-sm text-paper/75 sm:text-base">
        <AnimatedNumber
          value={lost}
          format={formatPayout}
          className="tabular font-semibold text-loss-soft"
        />{" "}
        lost on the way ({money(best.totalCost, sendCurrency)} of what you
        send), compared with the {receiveCurrency} mid-market rate.
      </p>
    </section>
  );
}

function InlineSelect({
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
  // A native <select> is as wide as its longest option; show the chosen label instead and
  // lay the (invisible) select over it so keyboard, screen reader and mobile pickers still work.
  const label = options.find((o) => o.value === value)?.label;
  return (
    <span className="relative inline-flex items-baseline gap-[0.15em] border-b-[3px] border-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-accent">
      <span aria-hidden>{label}</span>
      <svg
        aria-hidden
        viewBox="0 0 12 8"
        className="w-[0.42em] shrink-0 fill-current text-muted"
      >
        <path d="M6 8 0 0h12z" />
      </svg>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
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
        <p className="flex flex-wrap items-baseline gap-x-3 font-display text-lg leading-tight font-semibold sm:text-xl">
          {r.name}
          {isBest && (
            <span className="font-sans text-sm font-medium text-accent-text">
              Most money delivered
            </span>
          )}
        </p>

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
      </div>
    </li>
  );
}
