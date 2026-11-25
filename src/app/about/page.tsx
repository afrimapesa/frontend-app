import { AboutHero } from "@/components/about/about-hero";
import { ServicesGrid } from "@/components/about/services-grid";
import { WhyWeExist } from "@/components/about/why-we-exist";
import { NewsMotion } from "@/components/news/news-motion";
import { SocialLinks } from "@/components/social-links";
import { BRAND, PARTNERS } from "@/lib/site";

export const metadata = {
  title: `About | ${BRAND}`,
  description:
    "AFRIMAPESA compares money transfer costs, bank rates and government bond yields across Nigeria, Ghana, Kenya, Tanzania, Egypt and South Africa.",
};

const CONTAINER = "mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10";

const PARTNER_KINDS = [
  {
    title: "Money transfer providers",
    body: "Share quotes through an official feed so customers see accurate, up-to-date prices.",
  },
  {
    title: "Banks",
    body: "Publish your savings and lending rates directly, with the date they were set.",
  },
  {
    title: "Data providers",
    body: "Exchange rate, inflation and market data feeds that underpin our comparisons.",
  },
  {
    title: "Advertisers",
    body: "Reach Africa's diaspora and investors with clearly labelled placements.",
  },
];

export default function AboutPage() {
  return (
    <main className="flex flex-col gap-16 pb-20 sm:gap-24">
      <AboutHero />

      <NewsMotion className={CONTAINER}>
        <WhyWeExist />
      </NewsMotion>

      <section
        aria-labelledby="services-heading"
        className={`${CONTAINER} flex flex-col gap-10`}
      >
        <SectionHead
          kicker="Our services"
          id="services-heading"
          title="Six ways to see the full picture"
          lead="Two are live today. The rest roll out over the coming months, starting with bank rates and government bonds."
        />
        <ServicesGrid />
      </section>

      <NewsMotion className={`${CONTAINER}`}>
        <section
          id="partners"
          aria-labelledby="partners-heading"
          className="flex scroll-mt-24 flex-col gap-10"
        >
          <div data-reveal>
            <SectionHead
              kicker="Partners"
              id="partners-heading"
              title={
                PARTNERS.length > 0
                  ? "Working with us"
                  : "We're looking for our first partners"
              }
              lead="Partnerships help us show more accurate, more complete data. They never change how providers are ranked."
            />
          </div>

          {PARTNERS.length > 0 ? (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {PARTNERS.map((p) => (
                <li key={p.name} data-reveal>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full flex-col items-center gap-3 rounded-3xl border border-line bg-surface p-6 text-center transition-colors hover:border-ink"
                  >
                    {/* Partner logos are static files in public/partners/. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.logo}
                      alt=""
                      className="h-10 w-auto object-contain"
                    />
                    <span className="text-sm font-semibold">{p.name}</span>
                    <span className="text-xs text-muted">{p.kind}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PARTNER_KINDS.map((k) => (
                <li
                  key={k.title}
                  data-reveal
                  className="flex flex-col gap-1.5 rounded-2xl border border-dashed border-line p-5"
                >
                  <h3 className="font-display font-bold">{k.title}</h3>
                  <p className="text-sm text-muted">{k.body}</p>
                </li>
              ))}
            </ul>
          )}

          <div
            data-reveal
            className="spin-border flex flex-col items-start gap-5 rounded-2xl p-5 sm:p-7 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-[clamp(1.2rem,2vw,1.5rem)] leading-tight font-bold tracking-tight">
                Let&apos;s make African finance transparent, together.
              </h3>
              <p className="text-muted">
                Interested in working with {BRAND}? Send us a message on our
                social channels.
              </p>
            </div>
            <SocialLinks className="shrink-0 [&_a]:size-10 [&_a]:ring-1 [&_a]:ring-line" />
          </div>
        </section>
      </NewsMotion>
    </main>
  );
}

function SectionHead({
  kicker,
  id,
  title,
  lead,
}: {
  kicker: string;
  id: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="flex max-w-[48rem] flex-col gap-3">
      <p className="text-xs font-bold tracking-[0.2em] text-accent-text uppercase">
        {kicker}
      </p>
      <h2
        id={id}
        className="font-display text-[clamp(1.7rem,3.4vw,2.6rem)] leading-[1.08] font-bold tracking-tight text-balance"
      >
        {title}
      </h2>
      {lead && <p className="max-w-[56ch] text-muted">{lead}</p>}
    </div>
  );
}
