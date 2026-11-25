import Link from "next/link";

import { AdSlot } from "@/components/news/ad-slot";
import { api } from "@/lib/api";
import { articleHref, timeAgo } from "@/lib/news";

/** Home page side column, under the rate trend: three top stories and a small ad banner.
 *  Server component; the page streams it in its own Suspense so it never holds up rankings. */
export async function HomeNews() {
  const front = await api.newsFront().catch(() => null);
  if (!front) return null;

  const stories = [front.lead, ...front.top, ...front.latest]
    .filter((a) => a !== null)
    .filter((a, i, all) => all.findIndex((b) => b.slug === a.slug) === i)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-5">
      {stories.length > 0 && (
        <section
          aria-labelledby="home-news-heading"
          className="rounded-xl border border-line bg-surface p-4"
        >
          <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-2">
            <h2
              id="home-news-heading"
              className="font-display text-base font-extrabold tracking-tight"
            >
              Top news
            </h2>
            <Link
              href="/insights"
              className="text-xs font-semibold text-accent-text hover:underline"
            >
              All news &amp; insights →
            </Link>
          </div>
          <ol>
            {stories.map((a) => (
              <li
                key={a.slug}
                className="border-b border-line py-2.5 last:border-0 last:pb-0"
              >
                <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted uppercase">
                  {a.section.label} ·{" "}
                  <time dateTime={a.published_at}>
                    {timeAgo(a.published_at, front.as_of)}
                  </time>
                </p>
                <Link
                  href={articleHref(a.slug)}
                  className="mt-0.5 block font-display text-sm leading-snug font-semibold hover:underline"
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ol>
          {front.sample && (
            <p className="mt-2 text-xs text-muted">
              Sample stories for the preview.
            </p>
          )}
        </section>
      )}
      <AdSlot placement="inline" ad={front.ads.inline} />
    </div>
  );
}
