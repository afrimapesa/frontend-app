import Link from "next/link";

import { CoverArt } from "@/components/news/cover-art";
import type { ArticleCard } from "@/lib/api";
import { articleHref, sectionHref, timeAgo } from "@/lib/news";

/** "CURRENCIES · ANALYSIS": section links to its page; opinion is called out. */
export function Kicker({
  article,
  tone = "default",
}: {
  article: ArticleCard;
  tone?: "default" | "inverse";
}) {
  const muted = tone === "inverse" ? "text-paper/70" : "text-muted";
  return (
    <p
      className={`flex flex-wrap items-center gap-x-2 text-[0.7rem] font-bold tracking-[0.14em] uppercase ${muted}`}
    >
      <Link
        href={sectionHref(article.section.key)}
        className={`relative z-10 hover:underline ${tone === "inverse" ? "text-accent" : "text-accent-text"}`}
      >
        {article.section.label}
      </Link>
      {article.kind !== "news" && (
        <>
          <span aria-hidden>·</span>
          <span>{article.kind_label}</span>
        </>
      )}
    </p>
  );
}

export function Byline({
  article,
  asOf,
  tone = "default",
}: {
  article: ArticleCard;
  asOf: string;
  tone?: "default" | "inverse";
}) {
  return (
    <p
      className={`text-xs ${tone === "inverse" ? "text-paper/70" : "text-muted"}`}
    >
      {article.author && (
        <span className="font-medium">{article.author.name} · </span>
      )}
      <time dateTime={article.published_at}>
        {timeAgo(article.published_at, asOf)}
      </time>
      {" · "}
      {article.reading_minutes} min read
    </p>
  );
}

/** The headline link covers the whole card (stretched link); inner links sit above it. */
function Headline({
  article,
  className,
  split = false,
}: {
  article: ArticleCard;
  className: string;
  split?: boolean;
}) {
  return (
    <h3
      className={`font-display font-bold tracking-tight text-balance ${className}`}
    >
      <Link
        href={articleHref(article.slug)}
        className="after:absolute after:inset-0 hover:underline decoration-2 underline-offset-4"
      >
        {/* Split a span inside the link, so SplitText never empties the <a>. */}
        <span className="block" data-split={split || undefined}>
          {article.title}
        </span>
      </Link>
    </h3>
  );
}

/** CNBC-style lead: dark panel, art fading into it, headline in white, related links below. */
export function LeadStory({
  article,
  related,
  asOf,
}: {
  article: ArticleCard;
  related: ArticleCard[];
  asOf: string;
}) {
  return (
    <article
      className="flex flex-col overflow-hidden rounded-xl bg-ink text-paper"
      data-rise
    >
      <div className="relative">
        <div className="relative aspect-[16/9] overflow-hidden">
          <CoverArt article={article} label={false} />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink via-ink/60 to-transparent"
          />
        </div>
        <div className="relative -mt-24 flex flex-col gap-3 px-5 pb-5 sm:-mt-32 sm:px-8 sm:pb-7">
          <Kicker article={article} tone="inverse" />
          <Headline
            article={article}
            split
            className="text-[clamp(1.6rem,3.2vw,2.6rem)] leading-[1.08]"
          />
          <p className="max-w-[60ch] text-paper/80 sm:text-lg">
            {article.standfirst}
          </p>
          <Byline article={article} asOf={asOf} tone="inverse" />
        </div>
      </div>
      {related.length > 0 && (
        <ul className="mx-5 border-t border-paper/15 sm:mx-8">
          {related.map((a) => (
            <li
              key={a.slug}
              className="border-b border-paper/15 py-3 last:border-0"
            >
              <Link
                href={articleHref(a.slug)}
                className="font-display font-semibold hover:underline"
              >
                {a.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/** Picture card: art on top, headline below. */
export function CardStory({
  article,
  asOf,
  size = "md",
  standfirst = false,
}: {
  article: ArticleCard;
  asOf: string;
  size?: "md" | "sm";
  standfirst?: boolean;
}) {
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="aspect-[16/9] overflow-hidden rounded-lg">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]">
          <CoverArt article={article} label={size === "md"} />
        </div>
      </div>
      <Kicker article={article} />
      <Headline
        article={article}
        className={
          size === "md" ? "text-xl leading-snug" : "text-base leading-snug"
        }
      />
      {standfirst && <p className="text-sm text-muted">{article.standfirst}</p>}
      <Byline article={article} asOf={asOf} />
    </article>
  );
}

/** Headline-only row, for lists under a section's top story. */
export function TextStory({
  article,
  asOf,
}: {
  article: ArticleCard;
  asOf: string;
}) {
  return (
    <article className="relative flex flex-col gap-1 border-t border-line py-3">
      <Headline article={article} className="text-base leading-snug" />
      <p className="text-xs text-muted">
        <time dateTime={article.published_at}>
          {timeAgo(article.published_at, asOf)}
        </time>
        {article.kind !== "news" && ` · ${article.kind_label}`}
      </p>
    </article>
  );
}

/** "Latest" rail: newest first, time on top in small caps, scrolls within its column. */
export function LatestRail({
  articles,
  asOf,
  className = "",
}: {
  articles: ArticleCard[];
  asOf: string;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="latest-heading"
      className={`flex min-h-0 flex-col ${className}`}
      data-rise
    >
      <div className="border-t-2 border-line">
        <div className="-mt-0.5 h-0.5 w-20 bg-accent" />
      </div>
      <h2
        id="latest-heading"
        className="mt-3 mb-1 flex items-center gap-2 font-display text-xl font-extrabold tracking-tight uppercase"
      >
        Latest
        <span aria-hidden className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-accent" />
        </span>
      </h2>
      <ol
        data-stagger
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 [scrollbar-width:thin]"
      >
        {articles.map((a) => (
          <li key={a.slug} className="relative border-b border-line py-3 pl-4">
            <span
              aria-hidden
              className="absolute top-[1.15rem] left-0 size-1.5 rounded-full bg-accent"
            />
            <p className="text-[0.68rem] font-bold tracking-[0.14em] text-muted uppercase">
              <time dateTime={a.published_at}>
                {timeAgo(a.published_at, asOf)}
              </time>
            </p>
            <Link
              href={articleHref(a.slug)}
              className="mt-0.5 block font-display font-semibold leading-snug hover:underline"
            >
              {a.title}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Numbered list, Bloomberg "most read" style. */
export function NumberedList({
  title,
  articles,
}: {
  title: string;
  articles: ArticleCard[];
}) {
  return (
    <section aria-label={title} className="flex flex-col">
      <h2 className="border-b-2 border-ink pb-2 font-display text-lg font-extrabold tracking-tight">
        {title}
      </h2>
      <ol>
        {articles.map((a, i) => (
          <li
            key={a.slug}
            className="flex gap-4 border-b border-line py-3 last:border-0"
          >
            <span
              aria-hidden
              className="tabular w-6 shrink-0 font-display text-2xl leading-none font-extrabold text-accent"
            >
              {i + 1}
            </span>
            <Link
              href={articleHref(a.slug)}
              className="font-display font-semibold leading-snug hover:underline"
            >
              {a.title}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function SampleNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p
      className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-muted"
      data-rise
    >
      <span className="font-semibold text-ink">Preview:</span> these are sample
      articles written to show the layout. Editors publish real stories from the
      admin.
    </p>
  );
}

export function SectionHeading({
  id,
  title,
  href,
  children,
  tone = "default",
  as: Tag = "h2",
}: {
  id: string;
  title: string;
  href?: string;
  children?: React.ReactNode;
  tone?: "default" | "inverse";
  as?: "h1" | "h2";
}) {
  const inverse = tone === "inverse";
  return (
    <div
      className={`flex items-end justify-between gap-4 border-b-2 pb-2 ${inverse ? "border-paper" : "border-ink"}`}
    >
      <div>
        <Tag
          id={id}
          className="font-display text-2xl font-extrabold tracking-tight"
        >
          {title}
        </Tag>
        {children && (
          <p className={`text-sm ${inverse ? "text-paper/70" : "text-muted"}`}>
            {children}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className={`shrink-0 text-sm font-semibold hover:underline ${inverse ? "text-accent" : "text-accent-text"}`}
        >
          More<span className="sr-only"> {title}</span> →
        </Link>
      )}
    </div>
  );
}
