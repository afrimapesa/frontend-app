"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import Link from "next/link";
import { useRef } from "react";

import { BRAND } from "@/lib/site";

gsap.registerPlugin(
  useGSAP,
  DrawSVGPlugin,
  MotionPathPlugin,
  ScrambleTextPlugin,
);

// Abstract route map (not to geographic scale): sending regions top-left, African
// cities lower-right. Every origin connects to every city: the 18 corridors we compare.
const ORIGINS = [
  { id: "us", label: "United States", symbol: "$", x: 70, y: 120 },
  { id: "uk", label: "United Kingdom", symbol: "£", x: 230, y: 52 },
  { id: "eu", label: "Euro area", symbol: "€", x: 360, y: 92 },
];
const CITIES = [
  { id: "cai", label: "Cairo", symbol: "E£", x: 488, y: 214 },
  { id: "acc", label: "Accra", symbol: "₵", x: 262, y: 352 },
  { id: "los", label: "Lagos", symbol: "₦", x: 344, y: 372 },
  { id: "nbo", label: "Nairobi", symbol: "KSh", x: 556, y: 380 },
  { id: "dar", label: "Dar es Salaam", symbol: "TSh", x: 540, y: 452 },
  { id: "jnb", label: "Johannesburg", symbol: "R", x: 452, y: 522 },
];

const ROUTES = ORIGINS.flatMap((o) =>
  CITIES.map((c) => {
    // Quadratic curve bowed to one side, so the 18 lines fan out instead of overlapping.
    const mx = (o.x + c.x) / 2;
    const my = (o.y + c.y) / 2;
    const dx = c.x - o.x;
    const dy = c.y - o.y;
    const bow = 0.22;
    const cx = mx + dy * bow;
    const cy = my - dx * bow;
    return {
      id: `${o.id}-${c.id}`,
      origin: o,
      city: c,
      d: `M${o.x} ${o.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${c.x} ${c.y}`,
    };
  }),
);

const COINS = 6;
const WORDS = ["transparent", "comparable", "fair", "simple"];

export function AboutHero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Headline: each fixed line rises through its own mask.
        gsap.from(q("[data-hero-line]"), {
          yPercent: 115,
          duration: 1.1,
          stagger: 0.12,
          ease: "power4.out",
          delay: 0.15,
        });

        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .from(q("[data-hero-fade]"), {
            y: 24,
            autoAlpha: 0,
            duration: 0.8,
            stagger: 0.1,
            delay: 0.35,
          })
          .from(
            q("[data-route]"),
            {
              drawSVG: 0,
              duration: 1.4,
              stagger: { each: 0.04, from: "random" },
              ease: "power2.inOut",
            },
            0.2,
          )
          .from(
            q("[data-node]"),
            {
              scale: 0,
              transformOrigin: "50% 50%",
              duration: 0.6,
              stagger: 0.06,
              ease: "back.out(2)",
            },
            0.6,
          )
          .from(
            q("[data-node-label]"),
            { autoAlpha: 0, y: 6, duration: 0.5, stagger: 0.05 },
            1,
          );

        // Rotating word with a scramble between values.
        const word = q("[data-word]")[0];
        const words = gsap.timeline({ repeat: -1, delay: 2.2 });
        WORDS.slice(1)
          .concat(WORDS[0])
          .forEach((w) => {
            words.to(word, {
              duration: 0.9,
              scrambleText: { text: w, chars: "₦$£€₵R%", speed: 0.6 },
              ease: "none",
            });
            words.to({}, { duration: 2 });
          });

        // Coins travel the corridors; each one cycles through three routes and the
        // destination pulses on arrival. Built up front so cleanup reverts everything.
        q("[data-coin]").forEach((coin, i) => {
          const tl = gsap.timeline({ repeat: -1, delay: 1.6 + i * 0.55 });
          const TRIP = 2.4;
          [0, 7, 13].forEach((offset, leg) => {
            const route = ROUTES[(i * 3 + offset) % ROUTES.length];
            const path = q(
              `[data-route-id="${route.id}"]`,
            )[0] as unknown as SVGPathElement;
            const ring = q(`[data-ring="${route.city.id}"]`)[0];
            const label = coin.querySelector("text");
            // Every step of a leg is placed relative to this label (start of the trip).
            const go = `leg${leg}`;
            tl.set(coin, { autoAlpha: 0 })
              .call(() => {
                if (label) label.textContent = route.origin.symbol;
              })
              .addLabel(go)
              .to(
                coin,
                {
                  duration: TRIP,
                  ease: "power1.inOut",
                  motionPath: {
                    path,
                    align: path,
                    alignOrigin: [0.5, 0.5],
                  },
                },
                go,
              )
              .to(coin, { autoAlpha: 1, duration: 0.3 }, go)
              .to(
                coin,
                { autoAlpha: 0, duration: 0.25 },
                `${go}+=${TRIP - 0.25}`,
              )
              .fromTo(
                ring,
                { scale: 1, autoAlpha: 0.9 },
                {
                  scale: 3,
                  autoAlpha: 0,
                  transformOrigin: "50% 50%",
                  immediateRender: false,
                  duration: 0.9,
                  ease: "power2.out",
                },
                `${go}+=${TRIP}`,
              )
              .to({}, { duration: 0.6 });
          });
        });

        // Drifting glows.
        gsap.to(q("[data-glow]"), {
          xPercent: "random(-18, 18)",
          yPercent: "random(-14, 14)",
          duration: 7,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: 1.5,
        });

        // Pointer parallax on the map layers (fine pointers only).
        const layers = q("[data-depth]");
        const movers = layers.map((layer) => ({
          depth: Number(layer.dataset.depth),
          x: gsap.quickTo(layer, "x", { duration: 0.8, ease: "power3" }),
          y: gsap.quickTo(layer, "y", { duration: 0.8, ease: "power3" }),
        }));
        const onMove = contextSafe!((e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          const r = el.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          movers.forEach((m) => {
            m.x(nx * m.depth);
            m.y(ny * m.depth);
          });
        });
        el.addEventListener("pointermove", onMove);

        return () => {
          el.removeEventListener("pointermove", onMove);
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative isolate overflow-hidden bg-[var(--night)] text-white"
    >
      {/* Backdrop: dotted grid and two drifting glows. */}
      <div aria-hidden className="dot-grid absolute inset-0 -z-10" />
      <div
        aria-hidden
        data-glow
        className="absolute top-[-20%] right-[-10%] -z-10 size-[42rem] rounded-full bg-[#12a37f]/25 blur-[120px]"
      />
      <div
        aria-hidden
        data-glow
        className="absolute bottom-[-30%] left-[-15%] -z-10 size-[36rem] rounded-full bg-[#2563eb]/20 blur-[120px]"
      />

      <div className="mx-auto grid w-full max-w-[90rem] items-center gap-6 px-4 pt-12 pb-8 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-4 lg:px-10 lg:pt-16 lg:pb-16">
        <div className="relative z-10 flex flex-col gap-6">
          <p
            data-hero-fade
            className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#2fd3a4] uppercase"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#2fd3a4] opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-[#2fd3a4]" />
            </span>
            About {BRAND}
          </p>
          <h1 className="font-display text-[clamp(2.6rem,6.4vw,5.2rem)] leading-[0.98] font-bold tracking-tight">
            {/* Fixed line breaks; the cycling word sits alone on the last line so
                changing it never reflows the headline. */}
            {["Money across", "Africa, made"].map((line) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <span data-hero-line className="block">
                  {line}
                </span>
              </span>
            ))}
            <span className="block overflow-hidden pb-[0.12em]">
              <span
                data-hero-line
                className="block bg-gradient-to-r from-[#2fd3a4] to-[#7cc4ff] bg-clip-text text-transparent"
              >
                <span data-word>{WORDS[0]}</span>
              </span>
            </span>
          </h1>
          <p
            data-hero-fade
            className="max-w-[54ch] text-base text-white/70 sm:text-lg"
          >
            {BRAND} compares money transfer costs, bank rates and government
            bond yields across six African markets. We gather prices that are
            scattered, hidden or hard to read, put them side by side, and
            explain what they mean.
          </p>
          <div data-hero-fade className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full bg-[#2fd3a4] px-6 py-3 text-sm font-bold text-[#061427] transition-transform hover:scale-[1.03]"
            >
              Compare transfer costs
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
            <a
              href="#partners"
              className="inline-flex items-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:border-white hover:bg-white/5"
            >
              Partner with us
            </a>
          </div>
        </div>

        <RouteMap />
      </div>
    </section>
  );
}

function RouteMap() {
  return (
    <figure className="relative mx-auto w-full max-w-[40rem]">
      <svg
        viewBox="0 0 640 570"
        role="img"
        aria-label="Illustration: money routes from the United States, United Kingdom and euro area to Cairo, Accra, Lagos, Nairobi, Dar es Salaam and Johannesburg"
        className="h-auto w-full overflow-visible"
      >
        <defs>
          <linearGradient id="route-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7cc4ff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#2fd3a4" stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id="coin-grad">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#2fd3a4" />
          </radialGradient>
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Decorative orbits on a deeper layer, for parallax. */}
        <g data-depth="38" opacity="0.5">
          {[120, 200, 290].map((r) => (
            <circle
              key={r}
              cx="400"
              cy="330"
              r={r}
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.07"
              strokeDasharray="2 8"
            />
          ))}
        </g>

        {/* Routes, nodes and coins share one layer so coins stay on their lines. */}
        <g data-depth="16">
          {ROUTES.map((r) => (
            <path
              key={r.id}
              data-route
              data-route-id={r.id}
              d={r.d}
              fill="none"
              stroke="url(#route-grad)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          ))}

          {ORIGINS.map((o) => (
            <g key={o.id}>
              <g data-node>
                <circle
                  cx={o.x}
                  cy={o.y}
                  r="17"
                  fill="#0b2142"
                  stroke="#7cc4ff"
                  strokeWidth="1.5"
                />
                <text
                  x={o.x}
                  y={o.y + 5}
                  textAnchor="middle"
                  className="fill-white font-display text-[15px] font-bold"
                >
                  {o.symbol}
                </text>
              </g>
              <text
                data-node-label
                x={o.x}
                y={o.y - 26}
                textAnchor="middle"
                className="fill-white/60 text-[12px] font-semibold"
              >
                {o.label}
              </text>
            </g>
          ))}

          {CITIES.map((c) => (
            <g key={c.id}>
              <circle
                data-ring={c.id}
                cx={c.x}
                cy={c.y}
                r="9"
                fill="none"
                stroke="#2fd3a4"
                strokeWidth="1.5"
                opacity="0"
              />
              <g data-node>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="9"
                  fill="#2fd3a4"
                  filter="url(#glow)"
                />
                <circle cx={c.x} cy={c.y} r="3.5" fill="#061427" />
              </g>
              <text
                data-node-label
                x={c.x + (c.x > 500 ? -16 : 16)}
                y={c.y + 4}
                textAnchor={c.x > 500 ? "end" : "start"}
                className="fill-white text-[13px] font-semibold"
              >
                {c.label}{" "}
                <tspan className="fill-[#2fd3a4] font-bold">{c.symbol}</tspan>
              </text>
            </g>
          ))}

          {Array.from({ length: COINS }, (_, i) => (
            <g key={i} data-coin opacity="0" filter="url(#glow)">
              <circle r="11" fill="url(#coin-grad)" />
              <text
                y="4"
                textAnchor="middle"
                className="fill-[#061427] font-display text-[11px] font-extrabold"
              >
                $
              </text>
            </g>
          ))}
        </g>
      </svg>
      <figcaption className="sr-only">
        The 18 corridors {BRAND} compares.
      </figcaption>
    </figure>
  );
}
