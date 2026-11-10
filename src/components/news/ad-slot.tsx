import type { Advert } from "@/lib/api";

const SIZES = {
  leaderboard: {
    w: 970,
    h: 90,
    label: "970 × 90",
    cls: "aspect-[970/90] min-h-[64px]",
  },
  inline: {
    w: 728,
    h: 90,
    label: "728 × 90",
    cls: "aspect-[728/90] min-h-[64px]",
  },
  rail: { w: 300, h: 250, label: "300 × 250", cls: "aspect-[300/250]" },
} as const;

/** A labelled advertising slot. Shows the booked advert, or a quiet "space available" panel.
 *  Adverts are always marked as such and never placed inside comparison results. */
export function AdSlot({
  placement,
  ad,
  className = "",
}: {
  placement: Advert["placement"];
  ad: Advert | null;
  className?: string;
}) {
  const size = SIZES[placement];
  return (
    <aside
      aria-label="Advertisement"
      className={`mx-auto flex w-full flex-col gap-1.5 ${className}`}
      style={{ maxWidth: size.w }}
    >
      <p className="text-center text-[0.65rem] font-semibold tracking-[0.18em] text-muted uppercase">
        Advertisement
      </p>
      {ad ? (
        <a
          href={ad.click_url}
          target="_blank"
          rel="sponsored noopener"
          className={`block overflow-hidden rounded-md bg-surface ${size.cls}`}
        >
          {/* Advertiser creatives come from their own hosts. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.image_url}
            alt={ad.alt_text}
            width={size.w}
            height={size.h}
            className="h-full w-full object-cover"
          />
        </a>
      ) : (
        <div
          className={`flex items-center justify-center gap-x-4 gap-y-1 rounded-md border border-dashed border-line bg-surface/60 px-4 text-center ${size.cls} ${
            placement === "rail" ? "flex-col" : "flex-wrap"
          }`}
        >
          <span className="font-display text-sm font-semibold text-ink">
            Advertise with AFRIMAPESA
          </span>
          <span className="text-xs text-muted">
            Reach Africa&apos;s diaspora · {size.label}
          </span>
        </div>
      )}
    </aside>
  );
}
