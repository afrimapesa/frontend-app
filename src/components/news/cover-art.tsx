import type { ArticleCard } from "@/lib/api";

/* Generated cover art for stories without a photo. Deterministic per slug, so the server
   and client draw the same picture. Charts for market stories, bars for explainers,
   a quotation mark for opinion. Cool palette only. */

const PALETTES = [
  { bg: "#0b1f3a", grid: "#1c3456", ink: "#2fd3a4", text: "#e9f4ee" },
  { bg: "#0b5c4a", grid: "#14705b", ink: "#bff0dc", text: "#e9f4ee" },
  { bg: "#0e4d64", grid: "#18607a", ink: "#7fe0c4", text: "#e6f3f7" },
  { bg: "#1d2b44", grid: "#2a3b59", ink: "#9bb4d8", text: "#e6edf7" },
  { bg: "#d4ebe0", grid: "#bcdccd", ink: "#0b1f3a", text: "#0b1f3a" },
] as const;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 800;
const H = 450;

export function CoverArt({
  article,
  className = "",
  label = true,
}: {
  article: Pick<
    ArticleCard,
    "slug" | "kind" | "currency" | "section" | "cover_image_url" | "title"
  >;
  className?: string;
  label?: boolean;
}) {
  if (article.cover_image_url) {
    return (
      // Editors paste image URLs from any host, so a plain <img> (no next/image allow-list).
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={article.cover_image_url}
        alt=""
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const seed = hash(article.slug);
  const p = PALETTES[seed % PALETTES.length];
  const rand = rng(seed);
  const tag = article.currency ?? article.section.label.toUpperCase();

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={`block h-full w-full ${className}`}
      style={{ background: p.bg }}
    >
      {Array.from({ length: 7 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          x2={W}
          y1={(H / 7) * (i + 0.5)}
          y2={(H / 7) * (i + 0.5)}
          stroke={p.grid}
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={`v${i}`}
          y1={0}
          y2={H}
          x1={(W / 12) * (i + 0.5)}
          x2={(W / 12) * (i + 0.5)}
          stroke={p.grid}
          strokeWidth={1}
          strokeDasharray="2 6"
        />
      ))}
      {article.kind === "opinion" ? (
        <Quote rand={rand} p={p} />
      ) : article.kind === "explainer" ? (
        <Bars rand={rand} p={p} />
      ) : (
        <Line rand={rand} p={p} />
      )}
      {label && (
        <text
          x={36}
          y={H - 36}
          fill={p.text}
          style={{
            fontFamily: "var(--font-red-hat-display)",
            fontWeight: 800,
            letterSpacing: "0.04em",
          }}
          fontSize={tag.length > 8 ? 44 : 64}
        >
          {tag}
        </text>
      )}
    </svg>
  );
}

type P = (typeof PALETTES)[number];

/** A bounded random walk, as points across the canvas. */
function walk(rand: () => number, n: number): [number, number][] {
  const pts: [number, number][] = [];
  let v = 0.45 + rand() * 0.2;
  const drift = (rand() - 0.5) * 0.012;
  for (let i = 0; i < n; i++) {
    v = Math.min(0.85, Math.max(0.15, v + drift + (rand() - 0.5) * 0.07));
    pts.push([(i / (n - 1)) * W, H * (1 - v) * 0.8 + 20]);
  }
  return pts;
}

function Line({ rand, p }: { rand: () => number; p: P }) {
  const n = 48;
  const pts = walk(rand, n);
  const d = pts
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join("");
  const [lx, ly] = pts[n - 1];
  return (
    <>
      <path d={`${d}L${W},${H}L0,${H}Z`} fill={p.ink} fillOpacity={0.12} />
      <path
        d={d}
        fill="none"
        stroke={p.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <circle cx={lx - 4} cy={ly} r={9} fill={p.ink} />
      <circle cx={lx - 4} cy={ly} r={20} fill={p.ink} fillOpacity={0.2} />
    </>
  );
}

function Bars({ rand, p }: { rand: () => number; p: P }) {
  const n = 9;
  const gap = 18;
  const bw = (W - 120 - gap * (n - 1)) / n;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const h = 60 + rand() * 230;
        return (
          <rect
            key={i}
            x={300 + i * (bw * 0.55 + gap * 0.6)}
            y={H - 110 - h}
            width={bw * 0.55}
            height={h}
            rx={4}
            fill={p.ink}
            fillOpacity={0.35 + (i / n) * 0.65}
          />
        );
      })}
    </>
  );
}

function Quote({ rand, p }: { rand: () => number; p: P }) {
  const r = 90 + rand() * 40;
  return (
    <>
      <circle
        cx={W - 200}
        cy={170}
        r={r + 80}
        fill={p.ink}
        fillOpacity={0.08}
      />
      <circle cx={W - 200} cy={170} r={r} fill={p.ink} fillOpacity={0.14} />
      <text
        x={W - 290}
        y={300}
        fill={p.ink}
        fontSize={300}
        style={{ fontFamily: "var(--font-red-hat-display)", fontWeight: 900 }}
      >
        &ldquo;
      </text>
    </>
  );
}
