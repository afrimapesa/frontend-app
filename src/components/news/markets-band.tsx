"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";

import type { FxMovers } from "@/lib/api";
import { rate as fmtRate } from "@/lib/format";

gsap.registerPlugin(useGSAP);

type Mover = FxMovers["movers"][number];

/** How much the African currency itself gained (+) or lost (−) against the base.
 *  The API's change is in the rate (units per 1 base), which moves the other way. */
function strength(change: string | null): number | null {
  if (change === null) return null;
  return 1 / (1 + Number(change)) - 1;
}

function Change({
  value,
  className = "",
}: {
  value: number | null;
  className?: string;
}) {
  if (value === null)
    return <span className={`text-muted ${className}`}>–</span>;
  const up = value >= 0;
  return (
    <span
      className={`tabular font-semibold whitespace-nowrap ${up ? "text-accent-text" : "text-loss"} ${className}`}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      <span className="sr-only">{up ? "up" : "down"}</span>{" "}
      {Math.abs(value * 100).toFixed(2)}%
    </span>
  );
}

export function MarketsBand({ data }: { data: FxMovers }) {
  const [selected, setSelected] = useState(data.movers[0]?.currency);
  const active =
    data.movers.find((m) => m.currency === selected) ?? data.movers[0];

  if (!active) {
    return (
      <p className="rounded-xl border border-line bg-surface p-6 text-muted">
        Currency data appears here as rates are collected.
      </p>
    );
  }

  return (
    <div className="grid overflow-hidden rounded-xl border border-line bg-surface lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="flex flex-col gap-4 border-line p-5 sm:p-6 lg:border-r">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <p className="text-sm font-medium text-muted">
              {active.country} · {active.currency} per {data.base}
            </p>
            <p className="tabular font-display text-[clamp(2rem,4vw,2.75rem)] leading-none font-bold">
              {fmtRate(Number(active.rate))}
            </p>
          </div>
          <dl className="flex gap-6 text-sm">
            <div>
              <dt className="text-muted">1 day</dt>
              <dd>
                <Change value={strength(active.change_1d)} />
              </dd>
            </div>
            <div>
              <dt className="text-muted">{data.days} days</dt>
              <dd>
                <Change value={strength(active.change_period)} />
              </dd>
            </div>
          </dl>
        </div>
        <BigChart mover={active} />
        <p className="text-xs text-muted">
          Change shows how the {active.name.toLowerCase()} moved against the{" "}
          {data.base === "USD" ? "US dollar" : data.base}: ▲ stronger, ▼ weaker.
          {data.sample && " Sample data for the preview."}
        </p>
      </div>

      <table className="w-full self-start text-sm">
        <caption className="sr-only">
          African currencies against the {data.base}; select a row to chart it
        </caption>
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="py-3 pl-5 font-medium sm:pl-6">Currency</th>
            <th className="py-3 text-right font-medium">Rate</th>
            <th className="py-3 pl-3 text-right font-medium">1D</th>
            <th className="hidden py-3 pr-5 pl-3 text-right font-medium sm:table-cell sm:pr-6">
              {data.days}D
            </th>
          </tr>
        </thead>
        <tbody>
          {data.movers.map((m) => (
            <MoverRow
              key={m.currency}
              mover={m}
              active={m.currency === active.currency}
              onSelect={() => setSelected(m.currency)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MoverRow({
  mover,
  active,
  onSelect,
}: {
  mover: Mover;
  active: boolean;
  onSelect: () => void;
}) {
  const period = strength(mover.change_period);
  return (
    <tr
      className={`group cursor-pointer border-b border-line last:border-0 transition-colors ${
        active ? "bg-paper" : "hover:bg-paper/60"
      }`}
      onClick={onSelect}
    >
      <td className="py-3 pl-5 sm:pl-6">
        <button
          type="button"
          aria-pressed={active}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="flex items-center gap-3 text-left"
        >
          <span
            aria-hidden
            className={`h-8 w-1 rounded-full transition-colors ${active ? "bg-accent" : "bg-transparent"}`}
          />
          <span>
            <span className="block font-display font-bold">
              {mover.currency}
            </span>
            <span className="block text-xs text-muted">{mover.country}</span>
          </span>
        </button>
      </td>
      <td className="py-3 text-right">
        <span className="flex items-center justify-end gap-3">
          <Sparkline points={mover.points} up={(period ?? 0) >= 0} />
          <span className="tabular font-medium">
            {fmtRate(Number(mover.rate))}
          </span>
        </span>
      </td>
      <td className="py-3 pl-3 text-right">
        <Change value={strength(mover.change_1d)} />
      </td>
      <td className="hidden py-3 pr-5 pl-3 text-right sm:table-cell sm:pr-6">
        <Change value={period} />
      </td>
    </tr>
  );
}

function Sparkline({ points, up }: { points: Mover["points"]; up: boolean }) {
  const w = 72;
  const h = 24;
  if (points.length < 2) return <span style={{ width: w }} />;
  // Plot the currency's strength (inverse of the rate), so up on the line means stronger.
  const values = points.map((p) => 1 / Number(p.rate));
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - 2 - ((v - lo) / (hi - lo || 1)) * (h - 4);
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join("");
  return (
    <svg width={w} height={h} aria-hidden className="hidden shrink-0 sm:block">
      <path
        d={d}
        fill="none"
        strokeWidth={1.5}
        className={up ? "stroke-accent" : "stroke-loss"}
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CHART_H = 200;
const PAD = { top: 12, right: 60, bottom: 24, left: 2 };

function BigChart({ mover }: { mover: Mover }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const pts = mover.points.map((p) => Number(p.rate));
    if (width === 0 || pts.length < 2) return null;
    const lo = Math.min(...pts);
    const hi = Math.max(...pts);
    const pad = (hi - lo) * 0.15 || hi * 0.005;
    const [min, max] = [lo - pad, hi + pad];
    const innerW = width - PAD.left - PAD.right;
    const innerH = CHART_H - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (i / (pts.length - 1)) * innerW;
    const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * innerH;
    const line = pts
      .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
      .join("");
    const base = PAD.top + innerH;
    return {
      line,
      area: `${line}L${x(pts.length - 1)},${base}L${x(0)},${base}Z`,
      last: { x: x(pts.length - 1), y: y(pts.at(-1)!) },
      ticks: [hi, (hi + lo) / 2, lo].map((v) => ({ v, y: y(v) })),
      innerW,
      base,
    };
  }, [mover, width]);

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
          duration: 1,
          ease: "power2.inOut",
          clearProps: "strokeDasharray,strokeDashoffset",
        },
      );
      gsap.fromTo(
        "[data-area]",
        { opacity: 0 },
        { opacity: 1, duration: 0.6, delay: 0.35 },
      );
      gsap.fromTo(
        "[data-dot]",
        { scale: 0 },
        {
          scale: 1,
          duration: 0.4,
          delay: 0.9,
          transformOrigin: "center",
          ease: "back.out(3)",
        },
      );
    },
    { dependencies: [mover.currency, geo !== null], scope: wrap },
  );

  const first = mover.points[0]?.date;
  const last = mover.points.at(-1)?.date;

  return (
    <div
      ref={wrap}
      role="img"
      aria-label={`${mover.currency} per US dollar over ${mover.points.length} days, from ${first} to ${last}`}
    >
      <svg
        width="100%"
        height={CHART_H}
        aria-hidden
        className="block overflow-visible"
      >
        {geo && (
          <>
            {geo.ticks.map((t) => (
              <g key={t.v}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + geo.innerW}
                  y1={t.y}
                  y2={t.y}
                  className="stroke-line"
                  strokeDasharray="3 4"
                />
                <text
                  x={PAD.left + geo.innerW + 8}
                  y={t.y}
                  dy="0.35em"
                  className="tabular fill-muted text-[11px]"
                >
                  {fmtRate(t.v)}
                </text>
              </g>
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
            />
            <circle
              data-dot
              cx={geo.last.x}
              cy={geo.last.y}
              r={4.5}
              className="fill-[var(--chart-line)] stroke-surface"
              strokeWidth={2}
            />
            <line
              x1={PAD.left}
              x2={PAD.left + geo.innerW}
              y1={geo.base}
              y2={geo.base}
              className="stroke-ink"
              strokeWidth={1}
            />
            {first && (
              <text
                x={PAD.left}
                y={CHART_H - 4}
                className="fill-muted text-[11px]"
              >
                {fmtDay(first)}
              </text>
            )}
            {last && (
              <text
                x={PAD.left + geo.innerW}
                y={CHART_H - 4}
                textAnchor="end"
                className="fill-muted text-[11px]"
              >
                {fmtDay(last)}
              </text>
            )}
          </>
        )}
      </svg>
    </div>
  );
}

function fmtDay(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
