"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Mechanical-counter number: every digit is its own rolling column.
 * Columns are keyed by position from the right, so "405,618.10" -> "1,405,618.10"
 * keeps units under units and only the new leading digit appears.
 * On first mount the digits roll up from zero; afterwards they roll to each new value.
 */
export function Odometer({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const mounted = useRef(false);
  const chars = Array.from(text);

  useGSAP(
    () => {
      const strips = gsap.utils.toArray<HTMLElement>(
        "[data-digit]",
        root.current,
      );
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      strips.forEach((strip) => {
        const target = -Number(strip.dataset.digit) * 10;
        const fromRight = Number(strip.dataset.pos);
        if (reduce) {
          gsap.set(strip, { y: 0, yPercent: target });
        } else if (!mounted.current) {
          gsap.fromTo(
            strip,
            { y: 0, yPercent: 0 },
            {
              yPercent: target,
              duration: 1.4,
              ease: "expo.out",
              delay: 0.15 + fromRight * 0.06,
            },
          );
        } else {
          gsap.to(strip, {
            y: 0,
            yPercent: target,
            duration: 0.8,
            ease: "power3.out",
            delay: fromRight * 0.025,
            overwrite: true,
          });
        }
      });
      mounted.current = true;
    },
    { dependencies: [text], scope: root },
  );

  return (
    <span ref={root} className={`inline-flex leading-none ${className ?? ""}`}>
      <span className="sr-only">{text}</span>
      {chars.map((ch, i) => {
        const pos = chars.length - 1 - i;
        if (!/\d/.test(ch)) {
          return (
            <span
              key={`p${pos}`}
              aria-hidden
              className="inline-block h-[1.1em] leading-[1.1em]"
            >
              {ch}
            </span>
          );
        }
        return (
          <span
            key={`p${pos}`}
            aria-hidden
            className="inline-block h-[1.1em] overflow-hidden leading-[1.1em]"
          >
            <span
              data-digit={ch}
              data-pos={pos}
              className="odometer-strip block"
              style={{ "--d": ch } as React.CSSProperties}
            >
              {DIGITS.map((d) => (
                <span key={d} className="block h-[1.1em]">
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
