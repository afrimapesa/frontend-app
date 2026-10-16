"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

/** Counts from the previous value to the new one when it changes (instant if reduced motion). */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const counter = useRef({ n: value });
  // React renders the text once; GSAP owns it afterwards, so the two never fight over it.
  const [initial] = useState(() => format(value));

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      gsap.to(counter.current, {
        n: value,
        duration: reduce ? 0 : 0.6,
        ease: "power2.out",
        overwrite: true,
        onUpdate: () => {
          el.textContent = format(counter.current.n);
        },
      });
    },
    { dependencies: [value, format], scope: ref },
  );

  return (
    <span ref={ref} className={className}>
      {initial}
    </span>
  );
}
