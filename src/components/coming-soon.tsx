import Link from "next/link";

/** Placeholder for sections on the roadmap but not built yet. */
export function ComingSoon({
  title,
  when,
  children,
}: {
  title: string;
  when: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col justify-center gap-6 px-4 py-20 sm:px-6 lg:px-10">
      <h1 className="max-w-[18ch] font-display text-[clamp(2.4rem,7vw,4.5rem)] leading-[1.05] font-semibold tracking-tight text-balance">
        {title}
      </h1>
      <div className="max-w-[60ch] text-lg text-muted">{children}</div>
      <p className="text-base">
        <span className="font-medium">{when}.</span>{" "}
        <Link
          href="/"
          className="underline decoration-accent decoration-2 underline-offset-4"
        >
          Compare money transfer costs
        </Link>{" "}
        in the meantime.
      </p>
    </main>
  );
}
