"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Status = "live" | "soon" | "planned";

const SERVICES: {
  title: string;
  body: string;
  status: Status;
  href?: string;
  icon: React.ReactNode;
  wide?: boolean;
}[] = [
  {
    title: "Money transfer comparison",
    body: "Exchange rates and fees from money transfer companies and fintechs, ranked by what your recipient actually receives, next to the mid-market rate.",
    status: "live",
    href: "/",
    wide: true,
    icon: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
  },
  {
    title: "Bank savings and loan rates",
    body: "Fixed deposit, savings, personal loan and mortgage rates from major banks, with the real return after inflation.",
    status: "soon",
    href: "/bank-rates",
    icon: <path d="M3 10 12 4l9 6M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18" />,
  },
  {
    title: "Government bonds and T-bills",
    body: "Auction yields, yield curves, Eurobonds and credit ratings, with inflation-adjusted real yields.",
    status: "soon",
    href: "/bonds",
    icon: <path d="M3 19c4-1 6-6 9-9s5-4 9-5M3 19h18M3 5v14" />,
  },
  {
    title: "News and insights",
    body: "Analysis, explainers and commentary on African currencies, money transfers, banking and debt markets.",
    status: "live",
    href: "/insights",
    wide: true,
    icon: <path d="M5 4h11l3 3v13H5zM8 9h8M8 13h8M8 17h5" />,
  },
  {
    title: "Local exchange rates",
    body: "Interbank and retail exchange rates compared side by side within each market.",
    status: "planned",
    icon: (
      <path d="M12 3v18M17 7.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 2.8 5 3.5 5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3" />
    ),
  },
  {
    title: "Insurance comparison",
    body: "Life, non-life and specialist insurance products compared across our markets.",
    status: "planned",
    icon: <path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z" />,
  },
];

const STATUS: Record<Status, { label: string; cls: string }> = {
  live: {
    label: "Live",
    cls: "bg-accent text-[var(--night)]",
  },
  soon: { label: "Coming soon", cls: "bg-ink text-paper" },
  planned: { label: "Planned", cls: "border border-line text-muted" },
};

export function ServicesGrid() {
  const root = useRef<HTMLUListElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const cards = gsap.utils.toArray<HTMLElement>(
        "[data-card]",
        root.current,
      );
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(cards, {
          y: 24,
          autoAlpha: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: { each: 0.08, grid: "auto", from: "start" },
          scrollTrigger: { trigger: root.current, start: "top 80%" },
        });
      });

      // Cursor glow: the card's --mx/--my follow the pointer.
      const onMove = contextSafe!((e: PointerEvent) => {
        const card = e.currentTarget as HTMLElement;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
      cards.forEach((c) => c.addEventListener("pointermove", onMove));
      return () => {
        cards.forEach((c) => c.removeEventListener("pointermove", onMove));
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <ul ref={root} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SERVICES.map((s) => {
        const status = STATUS[s.status];
        const inner = (
          <>
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-10 place-items-center rounded-xl bg-paper text-accent-text ring-1 ring-line transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="size-5 fill-none stroke-current"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {s.icon}
                </svg>
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold tracking-wider uppercase ${status.cls}`}
              >
                {status.label}
              </span>
            </div>
            <h3 className="mt-3 font-display text-lg leading-snug font-bold tracking-tight">
              {s.title}
            </h3>
            <p className="text-sm text-muted">{s.body}</p>
            {s.href && (
              <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-bold text-accent-text">
                {s.status === "live" ? "Open" : "Preview"}
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            )}
          </>
        );
        const cls =
          "spotlight group flex h-full flex-col gap-1.5 rounded-2xl border border-line p-5 transition-[border-color,translate] duration-300 hover:-translate-y-1 hover:border-accent/60";
        return (
          <li key={s.title} data-card className={s.wide ? "lg:col-span-2" : ""}>
            {s.href ? (
              <Link href={s.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
