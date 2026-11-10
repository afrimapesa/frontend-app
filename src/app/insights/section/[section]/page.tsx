import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdSlot } from "@/components/news/ad-slot";
import { NewsMotion } from "@/components/news/news-motion";
import {
  CardStory,
  SampleNotice,
  SectionHeading,
} from "@/components/news/stories";
import { api } from "@/lib/api";
import { SECTIONS, sectionHref, sectionLabel } from "@/lib/news";

const CONTAINER = "mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10";

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.key }));
}

export async function generateMetadata({
  params,
}: PageProps<"/insights/section/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: `${sectionLabel(section) ?? "News"} | AFRIMAPESA` };
}

export default function SectionRoute({
  params,
  searchParams,
}: PageProps<"/insights/section/[section]">) {
  return (
    <main className="flex flex-col pt-6 pb-20 sm:pt-8">
      <Suspense fallback={<div aria-busy className={`${CONTAINER} h-96`} />}>
        <SectionPage params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ section }, query] = await Promise.all([params, searchParams]);
  const label = sectionLabel(section);
  if (!label) notFound();
  const page = Math.max(1, Number(query.page) || 1);

  const [list, front] = await Promise.all([
    api.articles({ section, page }).catch(() => null),
    api.newsFront().catch(() => null),
  ]);
  const asOf = front?.as_of ?? new Date(0).toISOString();

  return (
    <NewsMotion className={`${CONTAINER} flex flex-col gap-8`}>
      <nav
        aria-label="Sections"
        className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]"
        data-rise
      >
        <ul className="flex items-center gap-2 whitespace-nowrap">
          <li>
            <Link
              href="/insights"
              className="block rounded-md px-3.5 py-2 text-sm font-semibold text-muted hover:text-ink"
            >
              All news
            </Link>
          </li>
          {SECTIONS.map((s) => (
            <li key={s.key}>
              <Link
                href={sectionHref(s.key)}
                aria-current={s.key === section ? "page" : undefined}
                className="block rounded-md bg-surface px-3.5 py-2 text-sm font-semibold text-accent-text transition-colors hover:bg-ink hover:text-paper aria-[current=page]:bg-ink aria-[current=page]:text-paper"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div data-rise>
        <SectionHeading id="section-heading" title={label} as="h1" />
      </div>
      <SampleNotice show={Boolean(list?.results.some((a) => a.sample))} />
      <AdSlot placement="leaderboard" ad={front?.ads.leaderboard ?? null} />

      {!list ? (
        <p className="text-muted">Can&apos;t load these stories right now.</p>
      ) : list.results.length === 0 ? (
        <p className="text-lg text-muted">No stories in {label} yet.</p>
      ) : (
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {list.results.map((a, i) => (
            <div
              key={a.slug}
              data-reveal
              className={i === 0 ? "sm:col-span-2" : undefined}
            >
              <CardStory
                article={a}
                asOf={asOf}
                size={i === 0 ? "md" : "sm"}
                standfirst
              />
            </div>
          ))}
        </div>
      )}

      {list && (list.previous || list.next) && (
        <nav
          aria-label="Pages"
          className="flex justify-between border-t border-line pt-6 text-sm font-semibold"
        >
          {list.previous ? (
            <Link
              href={`${sectionHref(section)}?page=${page - 1}`}
              className="hover:underline"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          {list.next && (
            <Link
              href={`${sectionHref(section)}?page=${page + 1}`}
              className="hover:underline"
            >
              Older →
            </Link>
          )}
        </nav>
      )}
    </NewsMotion>
  );
}
