// Typed client for the AfrimaPesa Django API (backend repo: ../backend app).

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export type Currency = { code: string; name: string; symbol: string; minor_units: number };

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

export const api = {
  health: () => get<Health>("/health/"),
  currencies: () => get<Currency[]>("/v1/reference/currencies/"),
  countries: (role?: "sending" | "receiving") =>
    get<Country[]>(`/v1/reference/countries/${role ? `?role=${role}` : ""}`),
  corridors: () => get<Corridor[]>("/v1/reference/corridors/"),
  providers: () => get<Provider[]>("/v1/reference/providers/"),
};
