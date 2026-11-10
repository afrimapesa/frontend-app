// Shared helpers for the news pages. Not a client module: safe to import from server code.

import type { SectionKey } from "@/lib/api";

export const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "markets", label: "Markets" },
  { key: "currencies", label: "Currencies" },
  { key: "remittance", label: "Money transfers" },
  { key: "bonds", label: "Bonds" },
  { key: "banking", label: "Savings & banking" },
  { key: "economy", label: "Economy" },
];

export function sectionLabel(key: string): string | undefined {
  return SECTIONS.find((s) => s.key === key)?.label;
}

export const articleHref = (slug: string) => `/insights/${slug}`;
export const sectionHref = (key: string) => `/insights/section/${key}`;

/** "12 min ago", "3 hours ago", "Yesterday", then a date. Relative to the API's clock. */
export function timeAgo(iso: string, asOf: string): string {
  const minutes = Math.max(0, (Date.parse(asOf) - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${Math.floor(minutes)} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (hours < 48) return "Yesterday";
  return shortDate(iso);
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export type Block = { type: "h2" | "p"; text: string };

/** Article bodies: blank-line separated paragraphs; "## " starts a subheading. */
export function parseBody(body: string): Block[] {
  return body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .flatMap<Block>((b) =>
      b.startsWith("## ")
        ? [{ type: "h2", text: b.slice(3).trim() }]
        : [{ type: "p", text: b.replace(/\s*\n\s*/g, " ") }],
    );
}
