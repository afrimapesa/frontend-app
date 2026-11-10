"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/** Motion for the news pages. Markup opts in with data attributes:
 *  - data-split: headline whose lines rise through a mask
 *  - data-rise: fades up as part of the opening sequence
 *  - data-stagger: its direct children slide in one after another
 *  - data-reveal: fades up when scrolled into view
 *  Nothing moves when the visitor prefers reduced motion. */
export function NewsMotion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

        gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el, i) => {
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 110,
                duration: 0.9,
                stagger: 0.08,
                ease: "power4.out",
                delay: 0.1 + i * 0.12,
              }),
          });
        });

        // Not every page has every kind of target; skip what's absent (GSAP warns otherwise).
        const rise = gsap.utils.toArray("[data-rise]");
        const stagger = gsap.utils.toArray("[data-stagger] > *");
        const reveal = gsap.utils.toArray("[data-reveal]");

        if (rise.length)
          intro.from(rise, {
            y: 24,
            autoAlpha: 0,
            duration: 0.7,
            stagger: 0.08,
          });
        if (stagger.length)
          intro.from(
            stagger,
            { x: 18, autoAlpha: 0, duration: 0.5, stagger: 0.045 },
            0.25,
          );
        if (!reveal.length) return;

        // Hide first, then reveal on entry (anything already on screen enters immediately).
        gsap.set(reveal, { y: 36, autoAlpha: 0 });
        ScrollTrigger.batch(reveal as Element[], {
          start: "top 92%",
          once: true,
          onEnter: (els) =>
            gsap.to(els, {
              y: 0,
              autoAlpha: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: "power3.out",
            }),
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
