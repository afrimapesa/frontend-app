import { siFacebook, siInstagram, siTiktok } from "simple-icons";

import { BRAND, SOCIAL_LINKS } from "@/lib/site";

const ICONS = {
  TikTok: siTiktok,
  Instagram: siInstagram,
  Facebook: siFacebook,
};

export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex items-center gap-1 ${className}`}>
      {SOCIAL_LINKS.map(({ network, url }) => {
        const icon = (
          <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
            <path d={ICONS[network].path} />
          </svg>
        );
        return (
          <li key={network}>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${BRAND} on ${network}`}
                className="grid size-9 place-items-center rounded-full transition-colors hover:bg-ink/8"
              >
                {icon}
              </a>
            ) : (
              <span
                role="img"
                aria-label={`${BRAND} on ${network} (link coming soon)`}
                title={`${network} link coming soon`}
                className="grid size-9 cursor-default place-items-center rounded-full opacity-60"
              >
                {icon}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
