"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";

import { api } from "@/lib/api";
import { rate as fmtRate } from "@/lib/format";
import { sampleHistory } from "@/lib/sample-quotes";

gsap.registerPlugin(useGSAP);

const RANGES = [
  { days: 30, label: "1M" },
  { days: 90, label: "3M" },
] as const;

const HEIGHT = 220;
const PAD = { top: 16, right: 64, bottom: 28, left: 4 };

type Series = {
  key: string; // which request (pair + range) this data answers
  points: { date: string; rate: number }[];
  source: "live" | "sample";
  derived: boolean;
  unreachable: boolean;
};

/** Mid-market rate trend for one currency pair: line + crosshair tooltip + table view. */
export function RateTrend({ base, quote }: { base: string; quote: string }) {
  const [days, setDays] = useState<number>(90);
  const [series, setSeries] = useState<Series | null>(null);
  const key = `${base}-${quote}-${days}`;
  const loading = series?.key !== key;

  useEffect(() => {
    const controller = new AbortController();
    const fallback = (unreachable: boolean): Series => ({
      points: sampleHistory(
        base,
        quote,
        days,
        new Date().toISOString().slice(0, 10),
      ),
      key,
      source: "sample",
      derived: false,
      unreachable,
    });
    api
      .fxHistory(base, quote, days, controller.signal)
      .then((h) =>
        setSeries(
          h.points.length >= 2
            ? {
                key,
                points: h.points.map((p) => ({
                  date: p.date,
                  rate: Number(p.rate),
                })),
                source: "live",
                derived: h.derived,
                unreachable: false,
              }
            : fallback(false),
        ),
      )
      .catch((e: unknown) => {
        if ((e as Error).name !== "AbortError") setSeries(fallback(true));
      });
    return () => controller.abort();
  }, [base, quote, days, key]);

  const first = series?.points[0];
  const last = series?.points.at(-1);
  const change = first && last ? last.rate / first.rate - 1 : 0;
  const coveredDays = series?.points.length ?? 0;

  return (
    <section
      aria-labelledby="trend-heading"
      className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h2 id="trend-heading" className="font-display text-lg font-semibold">
            {base} to {quote} mid-market rate
          </h2>
          {first && last && (
            <p className="text-sm text-muted">
              <span className="tabular font-medium text-ink">
                {change >= 0 ? "+" : "−"}
                {Math.abs(change * 100).toFixed(2)}%
              </span>{" "}
              over the last {coveredDays} days
              {series?.derived && " (calculated via USD)"}
            </p>
          )}
        </div>
        <div
          role="group"
          aria-label="Time range"
          className="flex rounded-full border border-line p-0.5"
        >
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              aria-pressed={days === r.days}
              onClick={() => setDays(r.days)}
              className="rounded-full px-3 py-1 text-sm font-medium text-muted transition-colors aria-pressed:bg-ink aria-pressed:text-paper"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`transition-opacity ${loading && series ? "opacity-50" : ""}`}
      >
        {series ? (
          <Chart points={series.points} quote={quote} />
        ) : (
          <div
            style={{ height: HEIGHT }}
            className="rounded-lg bg-paper"
            aria-busy
          />
        )}
      </div>

      {series?.source === "sample" && (
        <p className="text-xs text-muted">
          {series.unreachable
            ? "Couldn't reach rate history, so this is sample data."
            : "Sample data. The real trend appears once historical rates are imported."}
        </p>
      )}
      {series?.source === "live" && coveredDays < days && (
        <p className="text-xs text-muted">
          History so far covers {coveredDays} days; it fills in as rates are
          collected.
        </p>
      )}

      {series && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted hover:text-ink">
            Show as table
          </summary>
          <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-line">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 text-right font-medium">
                    1 {base} in {quote}
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...series.points].reverse().map((p) => (
                  <tr key={p.date} className="border-t border-line">
                    <td className="px-3 py-1.5">{formatDate(p.date, true)}</td>
                    <td className="tabular px-3 py-1.5 text-right">
                      {fmtRate(p.rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}

function Chart({
  points,
  quote,
}: {
  points: { date: string; rate: number }[];
  quote: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    if (width === 0 || points.length < 2) return null;
    const rates = points.map((p) => p.rate);
    const ticks = niceTicks(Math.min(...rates), Math.max(...rates), 4);
    const [lo, hi] = [ticks[0], ticks.at(-1)!];
    const innerW = width - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
    const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo || 1)) * innerH;
    const line = points
      .map(
        (p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.rate).toFixed(1)}`,
      )
      .join("");
    const area = `${line}L${x(points.length - 1)},${PAD.top + innerH}L${x(0)},${PAD.top + innerH}Z`;
    const xTickIdx = [
      0,
      Math.round((points.length - 1) / 3),
      Math.round(((points.length - 1) * 2) / 3),
      points.length - 1,
    ];
    return { ticks, x, y, line, area, innerW, innerH, xTickIdx };
  }, [width, points]);

  // Draw the line in from the left whenever the series changes.
  useGSAP(
    () => {
      if (!geo || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;
      const path = wrap.current?.querySelector<SVGPathElement>("[data-line]");
      if (!path) return;
      const len = path.getTotalLength();
      gsap.fromTo(
        path,
        { strokeDasharray: len, strokeDashoffset: len },
        {
          strokeDashoffset: 0,
          duration: 1.1,
          ease: "power2.inOut",
          clearProps: "strokeDasharray,strokeDashoffset",
        },
      );
      gsap.fromTo(
        "[data-area]",
        { opacity: 0 },
        { opacity: 1, duration: 0.8, delay: 0.4 },
      );
    },
    { dependencies: [points, geo !== null], scope: wrap },
  );

  const indexAt = (clientX: number) => {
    const rect = wrap.current!.getBoundingClientRect();
    const t = (clientX - rect.left - PAD.left) / (geo!.innerW || 1);
    return Math.max(
      0,
      Math.min(points.length - 1, Math.round(t * (points.length - 1))),
    );
  };

  const last = points.length - 1;
  const shown = active ?? null;

  return (
    <div
      ref={wrap}
      className="relative outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-accent"
      tabIndex={0}
      role="img"
      aria-label={`Line chart of the ${quote} mid-market rate. Use left and right arrow keys to read values.`}
      onPointerMove={(e) => geo && setActive(indexAt(e.clientX))}
      onPointerLeave={() => setActive(null)}
      onFocus={() => setActive(last)}
      onBlur={() => setActive(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft")
          setActive((i) => Math.max(0, (i ?? last) - 1));
        else if (e.key === "ArrowRight")
          setActive((i) => Math.min(last, (i ?? last) + 1));
        else if (e.key === "Escape") setActive(null);
        else return;
        e.preventDefault();
      }}
    >
      <svg
        width="100%"
        height={HEIGHT}
        aria-hidden
        className="block overflow-visible"
      >
        {geo && (
          <>
            {geo.ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + geo.innerW}
                  y1={geo.y(t)}
                  y2={geo.y(t)}
                  className="stroke-line"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left + geo.innerW + 8}
                  y={geo.y(t)}
                  dy="0.35em"
                  className="fill-muted text-[11px] tabular"
                >
                  {compact(t)}
                </text>
              </g>
            ))}
            {geo.xTickIdx.map((i, k) => (
              <text
                key={i}
                x={geo.x(i)}
                y={HEIGHT - 6}
                textAnchor={
                  k === 0
                    ? "start"
                    : k === geo.xTickIdx.length - 1
                      ? "end"
                      : "middle"
                }
                className="fill-muted text-[11px]"
              >
                {formatDate(points[i].date)}
              </text>
            ))}
            <path
              data-area
              d={geo.area}
              className="fill-[var(--chart-line)]"
              fillOpacity={0.1}
            />
            <path
              data-line
              d={geo.line}
              fill="none"
              className="stroke-[var(--chart-line)]"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {shown === null && (
              <circle
                cx={geo.x(last)}
                cy={geo.y(points[last].rate)}
                r={4}
                className="fill-[var(--chart-line)] stroke-surface"
                strokeWidth={2}
              />
            )}
            {shown !== null && (
              <>
                <line
                  x1={geo.x(shown)}
                  x2={geo.x(shown)}
                  y1={PAD.top}
                  y2={PAD.top + geo.innerH}
                  className="stroke-muted"
                  strokeWidth={1}
                />
                <circle
                  cx={geo.x(shown)}
                  cy={geo.y(points[shown].rate)}
                  r={4.5}
                  className="fill-[var(--chart-line)] stroke-surface"
                  strokeWidth={2}
                />
              </>
            )}
          </>
        )}
      </svg>

      {geo && shown !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs shadow-sm"
          style={{
            left: Math.min(Math.max(geo.x(shown) - 60, 0), width - 132),
          }}
        >
          <p className="tabular text-sm font-semibold text-ink">
            {fmtRate(points[shown].rate)} {quote}
          </p>
          <p className="text-muted">{formatDate(points[shown].date, true)}</p>
        </div>
      )}
    </div>
  );
}

function niceTicks(min: number, max: number, count: number): number[] {
  if (min === max) {
    const pad = Math.abs(min) * 0.01 || 1;
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step)
    ticks.push(Number(v.toPrecision(12)));
  if (ticks.at(-1)! < max)
    ticks.push(Number((ticks.at(-1)! + step).toPrecision(12)));
  return ticks;
}

function compact(v: number): string {
  if (Math.abs(v) >= 10_000)
    return `${(v / 1000).toLocaleString("en-GB", { maximumFractionDigits: 1 })}K`;
  return v.toLocaleString("en-GB", {
    maximumFractionDigits: v >= 100 ? 0 : v >= 1 ? 2 : 4,
  });
}

function formatDate(iso: string, withYear = false): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}
