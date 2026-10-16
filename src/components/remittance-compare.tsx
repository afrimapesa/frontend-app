"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useCallback, useMemo, useRef, useState } from "react";

import { AnimatedNumber } from "@/components/animated-number";
import type { Country, Provider } from "@/lib/api";
import { currencySymbol, duration, money, percent, rate } from "@/lib/format";
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
      if (
        !state ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
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
    },
    { dependencies: [order], scope: list },
  );

  const fmtReceive = useCallback(
    (n: number) => money(n, receive.currency),
    [receive.currency],
  );
  const maxCost = Math.max(
    ...ranked.map((r) => r.feeCost + r.marginCost),
    0.01,
  );
  const midPayout = amount > 0 ? amount * mid : 0;
  const best = ranked[0];
  const worst = ranked.at(-1);

  return (
    <div className="flex flex-col gap-12">
      <form
        className="font-display text-[clamp(1.9rem,5.2vw,3.6rem)] leading-[1.15] font-semibold tracking-tight text-balance"
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
              { "--len": Math.max(amountText.length, 1) } as React.CSSProperties
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

      <section
        aria-labelledby="results-heading"
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1 border-l-[3px] border-line pl-4 text-sm text-muted sm:text-base">
          <h2 id="results-heading" className="sr-only">
            Best deals
          </h2>
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
              . Every provider below delivers less. The gap is what the transfer
              really costs you.
            </p>
          )}
        </div>

        {!(amount > 0) ? (
          <p className="rounded-lg bg-surface p-6 text-muted">
            Enter an amount to compare providers.
          </p>
        ) : ranked.length === 0 ? (
          <p className="rounded-lg bg-surface p-6 text-muted">
            No provider we track can send {money(amount, send.currency)} on this
            route. Try a larger amount.
          </p>
        ) : (
          <ol ref={list} className="flex flex-col gap-3">
            {ranked.map((r) => (
              <ResultRow
                key={r.provider}
                result={r}
                isBest={r === best}
                sendCurrency={send.currency}
                amount={amount}
                maxCost={maxCost}
                formatPayout={fmtReceive}
              />
            ))}
          </ol>
        )}

        {best && worst && best !== worst && (
          <p className="text-sm text-muted sm:text-base">
            Choosing {best.name} over {worst.name} puts{" "}
            <span className="tabular font-medium text-ink">
              {money(best.netPayout - worst.netPayout, receive.currency)}
            </span>{" "}
            more in your recipient&apos;s hands. Showing the top {ranked.length}{" "}
            of {servingCount} providers on this route.
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
    <span className="relative inline-flex items-baseline gap-[0.15em] border-b-[3px] border-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-gold">
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

function ResultRow({
  result: r,
  isBest,
  sendCurrency,
  amount,
  maxCost,
  formatPayout,
}: {
  result: RankedQuote;
  isBest: boolean;
  sendCurrency: string;
  amount: number;
  maxCost: number;
  formatPayout: (n: number) => string;
}) {
  const costTotal = r.feeCost + r.marginCost;
  return (
    <li
      data-flip-id={r.provider}
      className={`grid grid-cols-[2rem_1fr] gap-x-3 gap-y-4 rounded-xl bg-surface p-4 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center sm:p-5 ${
        isBest ? "shadow-[inset_4px_0_0_var(--gold)]" : ""
      }`}
    >
      <span className="font-display tabular text-2xl font-semibold text-muted sm:text-3xl">
        {r.rank}
      </span>

      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex flex-wrap items-baseline gap-x-3 font-display text-xl font-semibold">
          {r.name}
          {isBest && (
            <span className="font-sans text-sm font-medium text-gold-text">
              Most money delivered
            </span>
          )}
        </p>
        <p className="text-sm text-muted">{duration(r.transferMinutes)}</p>
        <p className="text-xs text-muted">
          Rate checked {r.ageMinutes} min ago
        </p>
      </div>

      <div className="col-start-2 flex flex-col gap-1 sm:col-start-3 sm:row-start-1 sm:items-end">
        <span className="text-sm text-muted">Recipient gets</span>
        <AnimatedNumber
          value={r.netPayout}
          format={formatPayout}
          className="font-display tabular text-[clamp(1.5rem,4vw,2.1rem)] leading-none font-semibold"
        />
      </div>

      <div className="col-span-2 flex flex-col gap-2 sm:col-span-3">
        <div
          className="flex h-2 overflow-hidden rounded-full bg-paper"
          role="img"
          aria-label={`Cost breakdown: fee ${money(r.feeCost, sendCurrency)}, exchange-rate margin ${money(r.marginCost, sendCurrency)}`}
        >
          <span
            className="bg-fee transition-[width] duration-500"
            style={{ width: `${(r.feeCost / maxCost) * 100}%` }}
          />
          <span
            className="bg-margin transition-[width] duration-500"
            style={{ width: `${(r.marginCost / maxCost) * 100}%` }}
          />
        </div>
        <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="font-medium">
            Costs you{" "}
            <span className="tabular">{money(costTotal, sendCurrency)}</span> (
            {percent(costTotal / amount)})
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="size-2 rounded-full bg-fee" aria-hidden /> Fee{" "}
            <span className="tabular">{money(r.feeCost, sendCurrency)}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="size-2 rounded-full bg-margin" aria-hidden />{" "}
            Hidden in the rate{" "}
            <span className="tabular">{money(r.marginCost, sendCurrency)}</span>
          </span>
        </p>
      </div>
    </li>
  );
}
