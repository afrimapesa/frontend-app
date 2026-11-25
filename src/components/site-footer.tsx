"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { SocialLinks } from "@/components/social-links";
import { BRAND } from "@/lib/site";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);

const COLUMNS = [
  {
    title: "Compare",
    links: [
      { href: "/", label: "Send money" },
      { href: "/bank-rates", label: "Save money" },
      { href: "/bonds", label: "Invest in bonds" },
    ],
  },
  {
    title: "Read",
    links: [
      { href: "/insights", label: "News & insights" },
      { href: "/insights/section/currencies", label: "Currencies" },
      { href: "/insights/section/remittance", label: "Money transfers" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/about#partners", label: "Partners" },
      { href: "/about#partners", label: "Advertise with us" },
    ],
  },
];

export function SiteFooter() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(q("[data-foot-col]"), {
          y: 24,
          autoAlpha: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 85%" },
        });
      });

      const top = q("[data-top]")[0];
      const toTop = contextSafe!(() => {
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        gsap.to(window, {
          scrollTo: 0,
          duration: reduce ? 0 : 1.2,
          ease: "power3.inOut",
        });
      });
      top?.addEventListener("click", toTop);
      return () => {
        top?.removeEventListener("click", toTop);
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <footer
      ref={root}
      className="relative isolate mt-auto overflow-hidden bg-[var(--night)] text-white"
    >
      <div aria-hidden className="dot-grid absolute inset-0 -z-10 opacity-60" />
      <div
        aria-hidden
        className="absolute -bottom-56 left-1/2 -z-10 h-[28rem] w-[60rem] -translate-x-1/2 rounded-full bg-[#12a37f]/20 blur-[120px]"
      />

      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-14 px-4 pt-16 pb-10 sm:px-6 lg:px-10">
        {/* Call to action */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-12 md:flex-row md:items-end">
          <h2 className="max-w-[18ch] font-display text-[clamp(1.9rem,4.2vw,3.4rem)] leading-[1.05] font-bold tracking-tight">
            Know what it costs{" "}
            <span className="bg-gradient-to-r from-[#2fd3a4] to-[#7cc4ff] bg-clip-text text-transparent">
              before you send.
            </span>
          </h2>
          <Link
            href="/"
            className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-white py-2 pr-2 pl-6 text-sm font-bold text-[var(--night)] transition-transform hover:scale-[1.03]"
          >
            Compare providers now
            <span className="grid size-9 place-items-center rounded-full bg-[var(--night)] text-white transition-transform group-hover:rotate-[-45deg]">
              →
            </span>
          </Link>
        </div>

        {/* Columns */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,5fr)_repeat(3,minmax(0,2fr))]">
          <div data-foot-col className="flex flex-col gap-4">
            <Link href="/" className="flex w-fit items-center gap-3">
              <Image
                src="/brand/afrimapesa-mark.png"
                alt=""
                width={40}
                height={40}
                className="size-10 rounded-lg"
              />
              <span className="font-display text-xl font-bold tracking-[0.08em]">
                {BRAND}
              </span>
            </Link>
            <p className="max-w-[40ch] text-sm text-white/60">
              Independent comparison of money transfers, bank rates and
              government bonds across Nigeria, Ghana, Kenya, Tanzania, Egypt and
              South Africa.
            </p>
            <SocialLinks className="-ml-2 text-white" />
          </div>
          {COLUMNS.map((col) => (
            <nav
              key={col.title}
              data-foot-col
              aria-label={col.title}
              className="flex flex-col gap-3"
            >
              <h3 className="text-xs font-bold tracking-[0.2em] text-[#2fd3a4] uppercase">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="group relative inline-block text-sm text-white/75 transition-colors hover:text-white"
                    >
                      {l.label}
                      <span
                        aria-hidden
                        className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-[#2fd3a4] transition-transform duration-300 group-hover:scale-x-100"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <p className="max-w-[80ch]">
            {BRAND} compares and explains; it does not transfer money. Figures
            are for information only. Check fees, limits and terms with the
            provider before you act.
          </p>
          <div className="flex shrink-0 items-center gap-5">
            <span>© 2026 {BRAND}</span>
            <button
              type="button"
              data-top
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 font-semibold text-white/80 transition-colors hover:border-white hover:text-white"
            >
              Back to top
              <span
                aria-hidden
                className="transition-transform group-hover:-translate-y-0.5"
              >
                ↑
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
