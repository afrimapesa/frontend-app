import Link from "next/link";
import { Suspense } from "react";

import { AdSlot } from "@/components/news/ad-slot";
import { MarketsBand } from "@/components/news/markets-band";
import { NewsMotion } from "@/components/news/news-motion";
import {
  Byline,
  CardStory,
  Kicker,
  LatestRail,
  LeadStory,
  NumberedList,
  SampleNotice,
  SectionHeading,
  TextStory,
} from "@/components/news/stories";
import { api, type ArticleCard, type FrontPage } from "@/lib/api";
import { articleHref, longDate, sectionHref, SECTIONS } from "@/lib/news";

export const metadata = {
  title: "News & insights | AFRIMAPESA",
  description:
    "Currencies, money transfers, bonds and savings across Africa: analysis and explainers from AFRIMAPESA.",
};

const CONTAINER = "mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10";

export default function InsightsPage() {
  return (
    <main className="flex flex-col pt-6 sm:pt-8">
      <Suspense fallback={<FrontSkeleton />}>
        <Front />
      </Suspense>
    </main>
  );
}

async function Front() {
  const [front, movers] = await Promise.all([
    api.newsFront().catch(() => null),
    api.fxMovers("USD", 30).catch(() => null),
  ]);

  if (!front) {
    return (
      <p className={`${CONTAINER} py-20 text-muted`}>
        Can&apos;t load the news right now. Please try again in a moment.
      </p>
    );
  }
  if (!front.lead) {
    return (
      <div className={`${CONTAINER} pb-20`}>
        <Masthead asOf={front.as_of} />
        <p className="mt-8 text-lg text-muted">No stories published yet.</p>
      </div>
    );
  }

  const [second, third, ...moreTop] = front.top;
  const asOf = front.as_of;

  return (
    <NewsMotion className="flex flex-col gap-12 sm:gap-16">
      <div className={`${CONTAINER} flex flex-col gap-6`}>
        <Masthead asOf={asOf} />
        <SampleNotice show={front.sample} />
        <AdSlot placement="leaderboard" ad={front.ads.leaderboard} />

        {/* Top of the page: lead | two picture stories | latest rail */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-x-8 xl:gap-x-10">
          <div className="md:col-span-2 lg:col-span-6">
            <LeadStory article={front.lead} related={moreTop} asOf={asOf} />
          </div>
          <div className="flex flex-col gap-6 lg:col-span-3" data-rise>
            {second && <CardStory article={second} asOf={asOf} />}
            {third && (
              <div className="border-t border-line pt-6">
                <CardStory article={third} asOf={asOf} />
              </div>
            )}
          </div>
          <div className="lg:relative lg:col-span-3">
            <LatestRail
              articles={front.latest}
              asOf={asOf}
              className="max-h-[36rem] lg:absolute lg:inset-0 lg:max-h-none"
            />
          </div>
        </div>
      </div>

      {/* Markets band */}
      <section
        aria-labelledby="markets-heading"
        className={`${CONTAINER} flex flex-col gap-5`}
        data-reveal
      >
        <SectionHeading
          id="markets-heading"
          title="Markets"
          href={sectionHref("markets")}
        >
          African currencies against the US dollar
        </SectionHeading>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-9">
            {movers ? (
              <MarketsBand data={movers} />
            ) : (
              <p className="rounded-xl border border-line bg-surface p-6 text-muted">
                Currency data is unavailable right now.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-8 lg:col-span-3">
            <AdSlot placement="rail" ad={front.ads.rail} />
            {front.explainers.length > 0 && (
              <NumberedList title="Explained" articles={front.explainers} />
            )}
          </div>
        </div>
      </section>

      {/* Sections */}
      <div
        className={`${CONTAINER} grid gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-3`}
      >
        {front.sections.map((s) => (
          <SectionBlock key={s.key} section={s} asOf={asOf} />
        ))}
      </div>

      {front.commentary.length > 0 && (
        <Commentary articles={front.commentary} asOf={asOf} />
      )}
    </NewsMotion>
  );
}

function Masthead({ asOf }: { asOf: string }) {
  return (
    <header className="flex flex-col gap-4" data-rise>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b-2 border-ink pb-3">
        <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] leading-none font-extrabold tracking-tight">
          News &amp; insights
        </h1>
        <p className="text-sm text-muted">
          <time dateTime={asOf}>{longDate(asOf)}</time>
        </p>
      </div>
      <nav
        aria-label="Sections"
        className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]"
      >
        <ul className="flex items-center gap-2 whitespace-nowrap">
          <li className="mr-1 text-sm font-medium text-muted">Sections</li>
          {SECTIONS.map((s) => (
            <li key={s.key}>
              <Link
                href={sectionHref(s.key)}
                className="block rounded-md bg-surface px-3.5 py-2 text-sm font-semibold text-accent-text transition-colors hover:bg-ink hover:text-paper"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function SectionBlock({
  section,
  asOf,
}: {
  section: FrontPage["sections"][number];
  asOf: string;
}) {
  const [first, ...rest] = section.articles;
  return (
    <section
      aria-labelledby={`s-${section.key}`}
      className="flex flex-col gap-4"
      data-reveal
    >
      <SectionHeading
        id={`s-${section.key}`}
        title={section.label}
        href={sectionHref(section.key)}
      />
      <CardStory article={first} asOf={asOf} size="sm" standfirst />
      <div>
        {rest.map((a) => (
          <TextStory key={a.slug} article={a} asOf={asOf} />
        ))}
      </div>
    </section>
  );
}

function Commentary({
  articles,
  asOf,
}: {
  articles: ArticleCard[];
  asOf: string;
}) {
  return (
    <section
      aria-labelledby="commentary-heading"
      className="bg-ink py-12 text-paper sm:py-16"
    >
      <div className={`${CONTAINER} flex flex-col gap-8`}>
        <SectionHeading
          id="commentary-heading"
          title="Opinion & analysis"
          tone="inverse"
        >
          Commentary on African economies, currencies and rates
        </SectionHeading>
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {articles.map((a) => (
            <article
              key={a.slug}
              className="relative flex flex-col gap-3 border-t border-paper/20 pt-5"
              data-reveal
            >
              <span
                aria-hidden
                className="font-display text-6xl leading-[0.6] font-black text-accent"
              >
                &ldquo;
              </span>
              <Kicker article={a} tone="inverse" />
              <h3 className="font-display text-xl leading-snug font-bold text-balance">
                <Link
                  href={articleHref(a.slug)}
                  className="after:absolute after:inset-0 hover:underline"
                >
                  {a.title}
                </Link>
              </h3>
              <p className="text-sm text-paper/75">{a.standfirst}</p>
              <Byline article={a} asOf={asOf} tone="inverse" />
            </article>
          ))}
        </div>
        <p className="border-t border-paper/15 pt-6 text-xs text-paper/60">
          Editorial content is independent of advertising and of the providers
          we compare. Nothing here is investment advice.
        </p>
      </div>
    </section>
  );
}

function FrontSkeleton() {
  return (
    <div aria-busy className={`${CONTAINER} flex flex-col gap-6`}>
      <div className="h-14 w-2/3 animate-pulse rounded-lg bg-surface" />
      <div className="h-20 animate-pulse rounded-md bg-surface" />
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="h-[32rem] animate-pulse rounded-xl bg-surface lg:col-span-6" />
        <div className="h-[32rem] animate-pulse rounded-xl bg-surface lg:col-span-3" />
        <div className="h-[32rem] animate-pulse rounded-xl bg-surface lg:col-span-3" />
      </div>
    </div>
  );
}
