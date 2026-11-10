import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, Suspense } from "react";

import { AdSlot } from "@/components/news/ad-slot";
import { CoverArt } from "@/components/news/cover-art";
import { NewsMotion } from "@/components/news/news-motion";
import {
  CardStory,
  Kicker,
  LatestRail,
  SampleNotice,
  SectionHeading,
} from "@/components/news/stories";
import { api, ApiError } from "@/lib/api";
import { dateTime, parseBody, sectionHref } from "@/lib/news";

const CONTAINER = "mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10";
const INLINE_AD_AFTER = 2; // paragraphs

export async function generateMetadata({
  params,
}: PageProps<"/insights/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await api.article(slug).catch(() => null);
  if (!page) return { title: "News & insights | AFRIMAPESA" };
  return {
    title: `${page.article.title} | AFRIMAPESA`,
    description: page.article.standfirst,
  };
}

export default function ArticleRoute({
  params,
}: PageProps<"/insights/[slug]">) {
  return (
    <main className="flex flex-col pt-6 pb-20 sm:pt-8">
      <Suspense fallback={<ArticleSkeleton />}>
        <Article params={params} />
      </Suspense>
    </main>
  );
}

async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, front] = await Promise.all([
    api.article(slug).catch((e: unknown) => {
      if (e instanceof ApiError && e.status === 404) notFound();
      return null;
    }),
    api.newsFront().catch(() => null),
  ]);

  if (!page) {
    return (
      <p className={`${CONTAINER} py-20 text-muted`}>
        Can&apos;t load this article right now. Please try again in a moment.
      </p>
    );
  }

  const { article, related, as_of: asOf } = page;
  const blocks = parseBody(article.body);
  // The inline advert goes after this block: the INLINE_AD_AFTER-th paragraph.
  const adAfter = blocks
    .map((b, i) => (b.type === "p" ? i : -1))
    .filter((i) => i >= 0)[INLINE_AD_AFTER - 1];
  const latest = (front?.latest ?? [])
    .filter((a) => a.slug !== article.slug)
    .slice(0, 8);
  const edited =
    Date.parse(article.updated_at) - Date.parse(article.published_at) >
    3_600_000;

  return (
    <NewsMotion className={`${CONTAINER} flex flex-col gap-10`}>
      <nav aria-label="Breadcrumb" className="text-sm text-muted" data-rise>
        <Link href="/insights" className="hover:text-ink hover:underline">
          News &amp; insights
        </Link>
        <span aria-hidden> / </span>
        <Link
          href={sectionHref(article.section.key)}
          className="hover:text-ink hover:underline"
        >
          {article.section.label}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
        <article className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <header className="flex flex-col gap-4">
            <div data-rise>
              <Kicker article={article} />
            </div>
            <h1 className="font-display text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.06] font-extrabold tracking-tight text-balance">
              <span className="block" data-split>
                {article.title}
              </span>
            </h1>
            <p className="max-w-[62ch] text-lg text-muted sm:text-xl" data-rise>
              {article.standfirst}
            </p>
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-line py-3 text-sm"
              data-rise
            >
              {article.author && (
                <p>
                  <span className="font-semibold">{article.author.name}</span>
                  {article.author.role && (
                    <span className="text-muted"> · {article.author.role}</span>
                  )}
                </p>
              )}
              <p className="text-muted">
                <time dateTime={article.published_at}>
                  {dateTime(article.published_at)}
                </time>
                {edited && (
                  <>
                    {" · Updated "}
                    <time dateTime={article.updated_at}>
                      {dateTime(article.updated_at)}
                    </time>
                  </>
                )}
              </p>
              <p className="text-muted">{article.reading_minutes} min read</p>
            </div>
          </header>

          <SampleNotice show={article.sample} />

          <figure className="flex flex-col gap-2" data-rise>
            <div className="aspect-[16/9] overflow-hidden rounded-xl">
              <CoverArt article={article} />
            </div>
            {article.cover_credit && (
              <figcaption className="text-xs text-muted">
                {article.cover_credit}
              </figcaption>
            )}
          </figure>

          <div className="flex max-w-[68ch] flex-col gap-5 text-[1.075rem] leading-[1.75]">
            {blocks.map((b, i) => {
              if (b.type === "h2") {
                return (
                  <h2
                    key={i}
                    className="mt-4 font-display text-2xl font-bold tracking-tight"
                  >
                    {b.text}
                  </h2>
                );
              }
              return (
                <Fragment key={i}>
                  <p>{b.text}</p>
                  {i === adAfter && (
                    <AdSlot
                      placement="inline"
                      ad={front?.ads.inline ?? null}
                      className="my-4"
                    />
                  )}
                </Fragment>
              );
            })}
          </div>

          <p className="max-w-[68ch] border-t border-line pt-5 text-xs text-muted">
            For information only, not financial or investment advice.
            AFRIMAPESA&apos;s rankings are set by what arrives and are never
            influenced by advertising.
          </p>
        </article>

        <aside className="flex flex-col gap-10 lg:col-span-4">
          <AdSlot placement="rail" ad={front?.ads.rail ?? null} />
          {latest.length > 0 && (
            <div className="lg:sticky lg:top-6">
              <LatestRail articles={latest} asOf={asOf} />
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section
          aria-labelledby="related-heading"
          className="flex flex-col gap-6"
          data-reveal
        >
          <SectionHeading
            id="related-heading"
            title={`More in ${article.section.label}`}
            href={sectionHref(article.section.key)}
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((a) => (
              <CardStory key={a.slug} article={a} asOf={asOf} size="sm" />
            ))}
          </div>
        </section>
      )}
    </NewsMotion>
  );
}

function ArticleSkeleton() {
  return (
    <div aria-busy className={`${CONTAINER} grid gap-10 lg:grid-cols-12`}>
      <div className="flex flex-col gap-4 lg:col-span-8">
        <div className="h-4 w-40 animate-pulse rounded bg-surface" />
        <div className="h-28 animate-pulse rounded-lg bg-surface" />
        <div className="aspect-[16/9] animate-pulse rounded-xl bg-surface" />
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-surface lg:col-span-4" />
    </div>
  );
}
