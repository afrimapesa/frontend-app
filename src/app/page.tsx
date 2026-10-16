import { Suspense } from "react";

import { RemittanceCompare } from "@/components/remittance-compare";
import { api } from "@/lib/api";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[90rem] flex-col gap-10 px-4 pt-10 pb-20 sm:px-6 sm:pt-14 lg:px-10">
      <Suspense fallback={<CompareSkeleton />}>
        <CompareWithData />
      </Suspense>
    </main>
  );
}

async function CompareWithData() {
  const data = await Promise.all([
    api.countries("sending"),
    api.countries("receiving"),
    api.providers(),
  ]).catch(() => null);

  if (!data) {
    return (
      <p className="rounded-lg bg-surface p-6 text-muted">
        Can&apos;t load countries and providers. Check that the API is running
        on port 8000, then reload.
      </p>
    );
  }
  const [sending, receiving, providers] = data;
  return (
    <RemittanceCompare
      sending={sending}
      receiving={receiving}
      providers={providers}
    />
  );
}

function CompareSkeleton() {
  return (
    <div
      aria-busy
      className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 xl:gap-20"
    >
      <div className="flex flex-col gap-8">
        <div className="h-[clamp(4.5rem,12vw,8.5rem)] w-4/5 animate-pulse rounded-lg bg-surface" />
        <div className="h-64 animate-pulse rounded-[1.25rem] bg-surface" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
