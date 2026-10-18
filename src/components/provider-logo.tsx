import Image from "next/image";
import { siWesternunion } from "simple-icons";

// Each provider's own site/app icon, stored locally in public/providers/ so visitors'
// browsers never call third-party sites. Western Union uses its vector mark instead
// (its published icon is only 48px).
const LOGOS: Record<string, string> = {
  wise: "/providers/wise.png",
  remitly: "/providers/remitly.png",
  worldremit: "/providers/worldremit.png",
  moneygram: "/providers/moneygram.svg",
  lemfi: "/providers/lemfi.png",
  sendwave: "/providers/sendwave.png",
  nala: "/providers/nala.png",
  "chipper-cash": "/providers/chipper-cash.png",
  flutterwave: "/providers/flutterwave.png",
  opay: "/providers/opay.png",
  revolut: "/providers/revolut.png",
  "taptap-send": "/providers/taptap-send.png",
  ofx: "/providers/ofx.png",
  xe: "/providers/xe.png",
};

export function ProviderLogo({
  slug,
  name,
  size = 40,
  className = "",
}: {
  slug: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const tile = `grid shrink-0 place-items-center overflow-hidden rounded-[22%] border border-line bg-white ${className}`;
  const style = { width: size, height: size };

  if (slug === "western-union") {
    return (
      <span
        className={tile}
        style={{ ...style, background: `#${siWesternunion.hex}` }}
      >
        <svg
          viewBox="0 0 24 24"
          role="img"
          aria-label={`${name} logo`}
          className="w-3/5 fill-black"
        >
          <path d={siWesternunion.path} />
        </svg>
      </span>
    );
  }

  const src = LOGOS[slug];
  if (!src) {
    // Unknown provider: a monogram rather than a broken image.
    return (
      <span
        role="img"
        aria-label={`${name} logo`}
        className={`${tile} font-display text-sm font-bold text-ink`}
        style={style}
      >
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <span className={tile} style={style}>
      <Image
        src={src}
        alt={`${name} logo`}
        width={size}
        height={size}
        unoptimized={src.endsWith(".svg")}
        className="size-full object-contain"
      />
    </span>
  );
}
