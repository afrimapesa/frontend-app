import type { Metadata } from "next";
import { FxTicker } from "@/components/fx-ticker";
import { SiteNav } from "@/components/site-nav";

// Fonts are self-hosted (bundled from npm), so builds never depend on Google Fonts.
import "@fontsource-variable/red-hat-display";
import "@fontsource-variable/red-hat-text";

import "./globals.css";

export const metadata: Metadata = {
  title: "AFRIMAPESA",
  description: "Cross-border financial comparison and intelligence for Africa.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      {/* Browser extensions (e.g. ColorZilla) add attributes to <body> before hydration. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only z-50 rounded bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <SiteNav />
        <FxTicker />
        <div id="main" className="flex flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
