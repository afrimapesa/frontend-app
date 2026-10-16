"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

import { rate } from "@/lib/format";
import { sampleMidRate } from "@/lib/sample-quotes";

gsap.registerPlugin(useGSAP);

const PAIRS: [string, string][] = [
  ["GBP", "NGN"],
  ["USD", "NGN"],
  ["EUR", "NGN"],
  ["USD", "GHS"],
  ["GBP", "KES"],
  ["USD", "KES"],
  ["USD", "TZS"],
  ["EUR", "EGP"],
  ["USD", "EGP"],
  ["GBP", "ZAR"],
  ["USD", "ZAR"],
];

// Deterministic sample daily change in [-1.2%, +1.2%] (stable between server and client).
function sampleChange(pair: string): number {
  let h = 7;
  for (const ch of pair) h = (h * 33 + ch.charCodeAt(0)) % 9973;
  return ((h % 241) - 120) / 10000;
}

const ITEMS = PAIRS.map(([b, q]) => ({
  pair: `${b}/${q}`,
  value: rate(sampleMidRate(b, q)),
  change: sampleChange(b + q),
}));

/** Endless FX strip. Pauses on hover or keyboard focus; static and scrollable with reduced motion. */
export function FxTicker() {
  const root = useRef<HTMLDivElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      tween.current = gsap.to("[data-track]", {
        xPercent: -50,
        duration: 45,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: root },
  );

  const pause = () => tween.current?.pause();
  const play = () => tween.current?.play();

  return (
    <div
      ref={root}
      className="relative overflow-x-auto bg-ink text-paper motion-safe:overflow-hidden"
      onMouseEnter={pause}
      onMouseLeave={play}
      onFocus={pause}
      onBlur={play}
      tabIndex={0}
      role="region"
      aria-label="Mid-market exchange rates (sample data)"
    >
      <div data-track className="flex w-max">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-8 py-2 pr-8 text-xs sm:text-sm">
            <li className="rounded-sm bg-paper/15 px-2 py-0.5 text-[0.7rem] font-semibold text-paper/80">
              Sample rates
            </li>
            {ITEMS.map((item) => (
              <li key={item.pair} className="flex items-baseline gap-2 whitespace-nowrap">
                <span className="text-paper/60">{item.pair}</span>
                <span className="tabular font-medium">{item.value}</span>
                <span
                  className={`tabular ${item.change >= 0 ? "text-[#7fd1a8]" : "text-[#f29b85]"}`}
                >
                  <span aria-hidden>{item.change >= 0 ? "▲" : "▼"}</span>
                  {Math.abs(item.change * 100).toFixed(2)}%
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
