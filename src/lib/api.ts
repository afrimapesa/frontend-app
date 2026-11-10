// Typed client for the AfrimaPesa Django API (backend repo: ../backend app).

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
  ) {
    super(`API ${status} on ${path}`);
  }
}

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (!res.ok) throw new ApiError(res.status, path);
  return res.json() as Promise<T>;
}

export type Health = {
  status: "ok" | "degraded";
  checks: { database: boolean; cache: boolean };
};

export type Currency = {
  code: string;
  name: string;
  symbol: string;
  minor_units: number;
};

export type Country = {
  code: string;
  name: string;
  kind: "country" | "region";
  currency: string;
  is_sending: boolean;
  is_receiving: boolean;
  central_bank: string;
  central_bank_code: string;
};

export type Corridor = {
  code: string;
  send_country: string;
  send_currency: string;
  receive_country: string;
  receive_currency: string;
};

export type Provider = {
  slug: string;
  name: string;
  website: string;
  integration_method: string;
  update_interval: string;
  corridors: string[];
};

export type CompareResult = {
  rank: number;
  provider: { slug: string; name: string; website: string };
  fx_rate: string;
  transfer_fee: string;
  margin_cost: string;
  total_cost: string;
  total_cost_pct: string;
  net_payout: string;
  effective_rate: string;
  transfer_time_minutes: number | null;
  observed_at: string;
  is_stale: boolean;
};

export type CompareResponse = {
  as_of: string; // server time of the comparison; quote ages are measured from it
  corridor: string;
  send_currency: string;
  receive_currency: string;
  amount: string;
  mid_rate: string | null;
  mid_payout: string | null;
  mid_observed_at: string | null;
  providers_on_route: number;
  sample: boolean; // any figure is preview sample data
  results: CompareResult[];
};

export type FxHistory = {
  base: string;
  quote: string;
  days: number;
  derived: boolean; // computed as a cross rate through USD
  sample: boolean; // any point is preview sample data
  points: { date: string; rate: string }[];
};

export type SectionKey =
  "markets" | "currencies" | "remittance" | "bonds" | "banking" | "economy";

export type ArticleKind = "news" | "analysis" | "opinion" | "explainer";

export type ArticleCard = {
  slug: string;
  title: string;
  standfirst: string;
  kind: ArticleKind;
  kind_label: string;
  section: { key: SectionKey; label: string };
  countries: string[];
  currency: string | null;
  author: { slug: string; name: string; role: string } | null;
  cover_image_url: string;
  cover_credit: string;
  published_at: string;
  updated_at: string;
  reading_minutes: number;
  is_featured: boolean;
  sample: boolean; // placeholder content for the preview
};

export type Advert = {
  advertiser: string;
  placement: "leaderboard" | "rail" | "inline";
  image_url: string;
  click_url: string;
  alt_text: string;
};

export type FrontPage = {
  as_of: string;
  sample: boolean;
  lead: ArticleCard | null;
  top: ArticleCard[];
  latest: ArticleCard[];
  sections: { key: SectionKey; label: string; articles: ArticleCard[] }[];
  commentary: ArticleCard[];
  explainers: ArticleCard[];
  ads: Record<Advert["placement"], Advert | null>;
};

export type ArticlePage = {
  as_of: string;
  article: ArticleCard & { body: string };
  related: ArticleCard[];
};

export type ArticleList = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ArticleCard[];
};

export type FxMovers = {
  base: string;
  days: number;
  sample: boolean;
  movers: {
    currency: string;
    name: string;
    country: string;
    rate: string; // 1 base = rate currency
    change_1d: string | null; // fractional change in the rate
    change_period: string | null;
    sample: boolean;
    points: { date: string; rate: string }[];
  }[];
};

export const api = {
  health: () => get<Health>("/health/"),
  currencies: () => get<Currency[]>("/v1/reference/currencies/"),
  countries: (role?: "sending" | "receiving") =>
    get<Country[]>(`/v1/reference/countries/${role ? `?role=${role}` : ""}`),
  corridors: () => get<Corridor[]>("/v1/reference/corridors/"),
  providers: () => get<Provider[]>("/v1/reference/providers/"),
  compare: (
    send: string,
    receive: string,
    amount: string,
    signal?: AbortSignal,
  ) =>
    get<CompareResponse>(
      `/v1/remittance/compare/?send=${send}&receive=${receive}&amount=${amount}`,
      { signal },
    ),
  fxHistory: (
    base: string,
    quote: string,
    days: number,
    signal?: AbortSignal,
  ) =>
    get<FxHistory>(`/v1/fx/history/?base=${base}&quote=${quote}&days=${days}`, {
      signal,
    }),
  fxMovers: (base = "USD", days = 30) =>
    get<FxMovers>(`/v1/fx/movers/?base=${base}&days=${days}`),
  newsFront: () => get<FrontPage>("/v1/insights/front/"),
  article: (slug: string) =>
    get<ArticlePage>(`/v1/insights/articles/${encodeURIComponent(slug)}/`),
  articles: (params: { section?: string; kind?: string; page?: number }) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params))
      if (v !== undefined) q.set(k, String(v));
    return get<ArticleList>(`/v1/insights/articles/?${q}`);
  },
};
