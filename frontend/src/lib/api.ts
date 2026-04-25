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

// ───────────── store layout ─────────────

export type LayoutArea = {
  id: number;
  code: string;
  name: string;
  type: string;
  polygon: { rect?: [number, number, number, number]; points?: [number, number][] } | null;
  color: string | null;
  today_count: number;
  month_avg: number;
};

export type LayoutEntrance = {
  id: number;
  code: string;
  name: string;
  type: string;
  position_x: number;
  position_y: number;
  today_count: number;
  conversion_rate: number;
};

export type LayoutProduct = {
  id: number;
  sku: string;
  name: string;
  model: string | null;
  category: string | null;
  image_url: string | null;
  area_id: number | null;
  placement_x: number;
  placement_y: number;
  avg_view_seconds: number;
  interaction_count: number;
};

export type StoreLayout = {
  store: Store;
  areas: LayoutArea[];
  entrances: LayoutEntrance[];
  products: LayoutProduct[];
};

export const getStoreLayout = (storeId: number) =>
  get<StoreLayout>(`/stores/${storeId}/layout`);

// ───────────── visitors ─────────────

export type Page<T> = {
  data: T[];
  page: number;
  size: number;
  total: number;
  has_more: boolean;
};

export type VisitorSummary = {
  id: number;
  anon_id: string;
  gender: "M" | "F" | "U";
  age_group: string;
  entered_at: string;
  exited_at: string | null;
  stay_seconds: number;
  companion_count: number;
  status: "active" | "left";
  interested_flag: boolean;
  thumbnail_url: string | null;
};

export type EntranceRef = { id: number; code: string; name: string };

export type VisitorDetail = VisitorSummary & {
  full_body_url: string | null;
  entrance: EntranceRef | null;
};

export type VisitorPathPoint = { t: string; x: number; y: number };
export type VisitorPath = { session_id: number; points: VisitorPathPoint[] };

export type AreaDwell = { area_id: number; area_name: string; dwell_seconds: number };

export type BehaviorEvent = {
  id: number;
  behavior_type: string;
  area_id: number | null;
  product_id: number | null;
  started_at: string;
  duration_seconds: number;
};

export type VisitorListOpts = {
  date?: "today" | "month";
  status?: "active";
  size?: number;
};

export const listVisitors = (storeId: number, opts: VisitorListOpts = {}) => {
  const q = new URLSearchParams({ storeId: String(storeId) });
  if (opts.date) q.set("date", opts.date);
  if (opts.status) q.set("status", opts.status);
  if (opts.size) q.set("size", String(opts.size));
  return get<Page<VisitorSummary>>(`/visitors?${q.toString()}`);
};

export const getVisitor = (vid: number) => get<VisitorDetail>(`/visitors/${vid}`);

export const getVisitorPath = (vid: number) => get<VisitorPath>(`/visitors/${vid}/path`);

export const getVisitorAreaDwell = (vid: number) =>
  get<AreaDwell[]>(`/visitors/${vid}/area-dwell`);

export const getVisitorBehaviors = (vid: number) =>
  get<BehaviorEvent[]>(`/visitors/${vid}/behaviors`);
