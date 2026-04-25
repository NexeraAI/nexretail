/**
 * Backend API client — typed wrappers over fetch().
 *
 * Base URL comes from NEXT_PUBLIC_API_BASE; defaults to http://localhost:8000/api/v1.
 * Backend wraps all errors as { error: { code, message, traceId, details } }; we
 * surface that as a thrown ApiError on non-2xx responses.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const err = body?.error ?? {};
    throw new ApiError(res.status, err.code ?? "http_error", err.message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ───────────── stores / countries ─────────────

export type Country = { code: string; name: string; store_count: number };

export type Store = {
  id: number;
  country_code: string;
  name: string;
  address: string | null;
  tax_id: string | null;
  phone: string | null;
  timezone: string;
  manager_name: string | null;
  month_traffic: number;
};

export const getCountries = () => get<Country[]>("/stores/countries");

export const getStores = (country?: string) =>
  get<Store[]>(country ? `/stores?country=${encodeURIComponent(country)}` : "/stores");

export const getStore = (storeId: number) => get<Store>(`/stores/${storeId}`);

// ───────────── overview ─────────────

export type OverviewKpi = {
  total_visitors: number;
  avg_stay_seconds: number;
  sales: number | null;
};
export type FlowPoint = { date: string; visitors: number };
export type WeekFlow = { weekday: number; visitors: number };
export type AgeGenderRow = { age_group: string; male: number; female: number };
export type GenderSplit = { male_pct: number; female_pct: number };
export type BehaviorTypeRow = {
  behavior_type: string;
  count: number;
  pct: number;
};
export type AreaTimeRow = {
  area_id: number;
  area_name: string;
  seconds: number;
  pct: number;
};
export type FunnelRow = { label: string; value: number; pct: number };
export type CompanionRow = {
  label: string;
  count: number;
  avg_stay_seconds: number;
};

export type StoreOverview = {
  period: string;
  kpi: OverviewKpi;
  flow_30d: FlowPoint[];
  week_flow: WeekFlow[];
  age_gender: AgeGenderRow[];
  gender_split: GenderSplit;
  top_behaviors: BehaviorTypeRow[];
  area_time: AreaTimeRow[];
  funnel: FunnelRow[];
  companions: CompanionRow[];
};

export const getStoreOverview = (storeId: number) =>
  get<StoreOverview>(`/stores/${storeId}/overview`);
