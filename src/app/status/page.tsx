import { Suspense } from "react";

import { api } from "@/lib/api";

// Temporary dev status page: proves the frontend can reach the Django API.
// Replaced by the remittance comparison page in T13.

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">AfrimaPesa</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Cross-border financial comparison for Africa — frontend dev build.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Backend</h2>
        <Suspense
          fallback={<p className="mt-2 text-zinc-500">Checking API…</p>}
        >
          <BackendStatus />
        </Suspense>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Remittance corridors</h2>
        <Suspense
          fallback={<p className="mt-2 text-zinc-500">Loading corridors…</p>}
        >
          <CorridorGrid />
        </Suspense>
      </section>
    </main>
  );
}

async function BackendStatus() {
  const health = await api.health().catch(() => null);
  if (!health) {
    return (
      <p className="mt-2 text-sm text-red-600">
        Can&apos;t reach the API. Is the Django server running on port 8000?
      </p>
    );
  }
  return (
    <ul className="mt-2 flex gap-4 text-sm">
      <StatusPill label="API" ok />
      <StatusPill label="Database" ok={health.checks.database} />
      <StatusPill label="Cache" ok={health.checks.cache} />
    </ul>
  );
}

function StatusPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`size-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`}
      />
      {label}
    </li>
  );
}

async function CorridorGrid() {
  const data = await Promise.all([
    api.corridors(),
    api.countries("receiving"),
  ]).catch(() => null);
  if (!data) {
    return (
      <p className="mt-2 text-sm text-red-600">Couldn&apos;t load corridors.</p>
    );
  }
  const [corridors, receiving] = data;
  const names = Object.fromEntries(receiving.map((c) => [c.code, c.name]));
  return (
    <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
      {corridors.map((c) => (
        <li
          key={c.code}
          className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
        >
          <span className="font-mono">{c.send_currency}</span> →{" "}
          <span className="font-mono">{c.receive_currency}</span>
          <span className="block text-xs text-zinc-500">
            {names[c.receive_country]}
          </span>
        </li>
      ))}
    </ul>
  );
}
