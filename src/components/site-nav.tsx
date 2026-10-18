"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { SocialLinks } from "@/components/social-links";
import { BRAND } from "@/lib/site";

gsap.registerPlugin(useGSAP);

export const NAV_LINKS = [
  { href: "/", label: "Send money" },
  { href: "/bank-rates", label: "Save money" },
  { href: "/bonds", label: "Invest in bonds" },
  { href: "/insights", label: "News & insights" },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    NAV_LINKS.findIndex((l) =>
      l.href === "/" ? pathname === "/" : pathname.startsWith(l.href),
    ),
  );

  return (
    // Solid background on purpose: backdrop-filter would trap the fixed mobile sheet inside the header.
    <header className="relative z-40 border-b border-line bg-paper">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-xl font-bold tracking-[0.08em]"
        >
          <Mark />
          {BRAND}
        </Link>
        <div className="flex items-center gap-4">
          <DesktopLinks activeIndex={activeIndex} />
          <SocialLinks className="hidden border-l border-line pl-3 md:flex" />
          <MobileMenu activeIndex={activeIndex} />
        </div>
      </nav>
    </header>
  );
}

/** Two offset rings: money moving between two places. */
function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="size-7">
      <circle
        cx="12"
        cy="16"
        r="9"
        className="fill-none stroke-ink"
        strokeWidth="3"
      />
      <circle
        cx="20"
        cy="16"
        r="9"
        className="fill-accent/90 stroke-none mix-blend-multiply"
      />
    </svg>
  );
}

/** Jade marker slides to whichever link is hovered or focused, then home to the active one. */
function DesktopLinks({ activeIndex }: { activeIndex: number }) {
  const list = useRef<HTMLUListElement>(null);
  const marker = useRef<HTMLSpanElement>(null);

  const moveTo = useCallback((index: number, instant = false) => {
    // Query the <li>s, not children: the marker itself is the list's first child.
    const item =
      list.current?.querySelectorAll<HTMLElement>(":scope > li")[index];
    if (!item || !marker.current) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    gsap.to(marker.current, {
      x: item.offsetLeft,
      width: item.offsetWidth,
      duration: instant || reduce ? 0 : 0.45,
      ease: "elastic.out(1, 0.75)",
      overwrite: true,
    });
  }, []);

  useGSAP(() => moveTo(activeIndex, true), {
    dependencies: [activeIndex],
    scope: list,
  });

  useEffect(() => {
    const onResize = () => moveTo(activeIndex, true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex, moveTo]);

  return (
    <ul
      ref={list}
      className="relative hidden items-center md:flex"
      onMouseLeave={() => moveTo(activeIndex)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) moveTo(activeIndex);
      }}
    >
      <span
        ref={marker}
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-0 h-9 -translate-y-1/2 rounded-full bg-accent/25"
      />
      {NAV_LINKS.map((link, i) => (
        <li key={link.href} className="relative">
          <Link
            href={link.href}
            aria-current={i === activeIndex ? "page" : undefined}
            onMouseEnter={() => moveTo(i)}
            onFocus={() => moveTo(i)}
            className="block rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink aria-[current=page]:text-ink"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Full-screen sheet: ink curtain drops, oversized links rise into place line by line. */
function MobileMenu({ activeIndex }: { activeIndex: number }) {
  const [open, setOpen] = useState(false);
  const scope = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      tl.current = gsap
        .timeline({ paused: true })
        .set("[data-sheet]", { visibility: "visible" })
        .fromTo(
          "[data-sheet]",
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 0.55, ease: "power4.inOut" },
        )
        .fromTo(
          "[data-sheet-link]",
          { yPercent: 110 },
          { yPercent: 0, duration: 0.6, ease: "power3.out", stagger: 0.06 },
          "-=0.2",
        )
        .fromTo(
          "[data-sheet-foot]",
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.3 },
          "-=0.3",
        );
    },
    { scope },
  );

  useEffect(() => {
    const t = tl.current;
    if (!t) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (open) {
      document.body.style.overflow = "hidden";
      if (reduce) t.progress(1);
      else t.timeScale(1).play();
      scope.current?.querySelector<HTMLElement>("[data-sheet] a")?.focus();
    } else {
      document.body.style.overflow = "";
      if (reduce) t.progress(0);
      else t.timeScale(1.6).reverse();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        button.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={scope} className="md:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="relative z-50 rounded-full px-4 py-2 text-sm font-semibold"
        style={{ color: open ? "var(--paper)" : undefined }}
      >
        {open ? "Close" : "Menu"}
      </button>
      <div
        id="mobile-menu"
        data-sheet
        className="invisible fixed inset-0 z-40 flex flex-col justify-between bg-ink px-6 pt-24 pb-10 text-paper"
        inert={!open}
      >
        <ul className="flex flex-col gap-2">
          {NAV_LINKS.map((link, i) => (
            <li key={link.href} className="overflow-hidden">
              <Link
                href={link.href}
                data-sheet-link
                aria-current={i === activeIndex ? "page" : undefined}
                onClick={() => setOpen(false)}
                className="block font-display text-[clamp(2.4rem,11vw,3.5rem)] leading-[1.1] font-semibold tracking-tight aria-[current=page]:text-accent"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <SocialLinks className="-ml-2" />
        <p data-sheet-foot className="text-sm text-paper/70">
          Remittance, bank rates and sovereign yields for Nigeria, Ghana, Kenya,
          Tanzania, Egypt and South Africa.
        </p>
      </div>
    </div>
  );
}
