/**
 * Deterministic mock data for the Retail AI wireframe.
 * Values are generated from a seeded PRNG so SSR and client renders match.
 */

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260422);
const ri = (a: number, b: number) => Math.floor(rand() * (b - a + 1)) + a;
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

export type Gender = "m" | "f";
export type AgeBand = "18-24" | "25-34" | "35-44" | "45-54" | "55+";
export const AGE_BANDS: AgeBand[] = ["18-24", "25-34", "35-44", "45-54", "55+"];

// ───────────── 店舖 ─────────────
export const countries = [
  { code: "TW", name: "台灣", stores: 12 },
  { code: "JP", name: "日本", stores: 8 },
  { code: "SG", name: "新加坡", stores: 3 },
  { code: "HK", name: "香港", stores: 5 },
  { code: "TH", name: "泰國", stores: 4 },
];

export const stores = [
  {
    id: "tw-tp-flagship",
    country: "TW",
    name: "台北旗艦店",
    taxId: "24531278",
    phone: "(02) 2755-6677",
    manager: "陳柏均",
    traffic: 3420,
    sales: 1820000,
  },
  {
    id: "tw-tc-mega",
    country: "TW",
    name: "台中 MEGA 展間",
    taxId: "25118820",
    phone: "(04) 2368-1122",
    manager: "林怡君",
    traffic: 2140,
    sales: 1050000,
  },
  {
    id: "tw-ks-south",
    country: "TW",
    name: "高雄南方展間",
    taxId: "26902211",
    phone: "(07) 310-8899",
    manager: "黃俊皓",
    traffic: 1820,
    sales: 895000,
  },
  {
    id: "jp-tokyo-ginza",
    country: "JP",
    name: "東京銀座展間",
    taxId: "JP-013-557812",
    phone: "+81 3-6262-5500",
    manager: "Takeshi Ono",
    traffic: 2980,
    sales: 2350000,
  },
  {
    id: "hk-central",
    country: "HK",
    name: "香港中環旗艦",
    taxId: "HK-8812-22",
    phone: "+852 2877-3321",
    manager: "Kelvin Lau",
    traffic: 2210,
    sales: 1680000,
  },
];

// ───────────── 時間序列 ─────────────
export const trafficSeries = Array.from({ length: 24 }).map((_, h) => ({
  hour: `${String(h).padStart(2, "0")}:00`,
  人流: Math.round(40 + Math.sin((h - 6) / 3) * 80 + ri(0, 35) + (h > 18 || h < 9 ? -20 : 25)),
  去年同期: Math.round(30 + Math.sin((h - 6) / 3) * 60 + ri(0, 25) + (h > 18 || h < 9 ? -20 : 15)),
}));

export const salesSeries = Array.from({ length: 30 }).map((_, d) => ({
  date: `04/${String(d + 1).padStart(2, "0")}`,
  銷售額: ri(320, 880) * 1000,
  去年同期: ri(260, 720) * 1000,
}));

export const weeklyTraffic = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"].map(
  (d, i) => ({
    day: d,
    人流: ri(180, 520) + (i > 4 ? 150 : 0),
    平均: ri(280, 360),
  })
);

export const hourlyDensity = Array.from({ length: 7 * 12 }).map((_, i) => ({
  d: Math.floor(i / 12),
  h: (i % 12) + 8,
  value: Math.round(rand() * 100),
}));

// ───────────── 行為 / 區域 ─────────────
export const behaviors = [
  { name: "進店", count: 3420, avg: 0, tone: "accent" as const },
  { name: "駐足", count: 2610, avg: 42, tone: "teal" as const },
  { name: "觸摸商品", count: 1180, avg: 18, tone: "purple" as const },
  { name: "商談", count: 412, avg: 312, tone: "pink" as const },
  { name: "試乘 / 試坐", count: 236, avg: 205, tone: "warning" as const },
];

export const areas = [
  { id: "zone-a", name: "A 展車區", type: "展車", tone: "accent" as const, stay: 142, count: 980 },
  { id: "zone-b", name: "B 配件區", type: "配件", tone: "pink" as const, stay: 68, count: 620 },
  { id: "zone-c", name: "C 商談區", type: "商談", tone: "purple" as const, stay: 420, count: 312 },
  { id: "zone-d", name: "D 試乘準備", type: "試乘", tone: "warning" as const, stay: 198, count: 188 },
  { id: "zone-e", name: "E 接待區", type: "接待", tone: "teal" as const, stay: 35, count: 1850 },
];

export const areaRects = [
  { id: "zone-a", label: "A 展車區", x: 60, y: 60, w: 300, h: 180, tone: "accent" as const },
  { id: "zone-b", label: "B 配件區", x: 380, y: 60, w: 180, h: 120, tone: "pink" as const },
  { id: "zone-c", label: "C 商談區", x: 580, y: 60, w: 120, h: 180, tone: "purple" as const },
  { id: "zone-d", label: "D 試乘準備", x: 380, y: 200, w: 180, h: 120, tone: "warning" as const },
  { id: "zone-e", label: "E 接待區", x: 60, y: 260, w: 300, h: 120, tone: "teal" as const },
];

export const productMarkers = [
  { id: "p1", productId: "bmw-m3", x: 130, y: 130, label: "M3" },
  { id: "p2", productId: "bmw-i7", x: 230, y: 160, label: "i7" },
  { id: "p3", productId: "bmw-x5", x: 310, y: 120, label: "X5" },
  { id: "p4", productId: "bmw-ac", x: 440, y: 110, label: "AC" },
  { id: "p5", productId: "bmw-cs", x: 620, y: 140, label: "CS" },
];

export const entranceMarkers = [
  { x: 40, y: 420 - 40, label: "E1" },
  { x: 720 - 40, y: 420 - 40, label: "E2" },
  { x: 360, y: 20, label: "E3" },
];

export const customerPath = [
  { x: 40, y: 380 },
  { x: 120, y: 320 },
  { x: 180, y: 260 },
  { x: 230, y: 160 },
  { x: 310, y: 120 },
  { x: 420, y: 140 },
  { x: 520, y: 200 },
  { x: 610, y: 180 },
  { x: 640, y: 120 },
];

// ───────────── 顧客 ─────────────
const FIRST = ["柏均", "怡君", "俊皓", "詩涵", "宏達", "佳穎", "冠廷", "雅筑", "建志", "思妤"];
const LAST = ["陳", "林", "黃", "張", "李", "王", "吳", "周", "許", "蔡"];

export const customers = Array.from({ length: 24 }).map((_, i) => {
  const gender = rand() > 0.5 ? "f" : ("m" as Gender);
  const age = pick(AGE_BANDS);
  const companions = ri(0, 3);
  const stay = ri(85, 1800);
  const name = `${pick(LAST)}${pick(FIRST)}`;
  return {
    id: `cust-${1000 + i}`,
    name,
    gender,
    age,
    companions,
    stay,
    entered: `2026/04/22 ${String(9 + Math.floor(i / 4)).padStart(2, "0")}:${String(
      (i * 7) % 60
    ).padStart(2, "0")}`,
    interested: rand() > 0.65,
    behaviors: ["進店", "駐足", "觸摸商品", "商談", "試乘"]
      .slice(0, ri(3, 5))
      .map((b, k) => ({
        b,
        dur: ri(8, 220),
        ts: `${String(9 + k).padStart(2, "0")}:${String((i * 11 + k * 4) % 60).padStart(
          2,
          "0"
        )}`,
      })),
  };
});

// ───────────── 商品 ─────────────
export const products = [
  {
    id: "bmw-m3",
    name: "BMW M3 Competition",
    model: "G80",
    avgView: 82,
    topAge: "35-44",
    maleRatio: 0.78,
    touches: 420,
    dwell: 164,
  },
  {
    id: "bmw-i7",
    name: "BMW i7 xDrive60",
    model: "G70",
    avgView: 96,
    topAge: "45-54",
    maleRatio: 0.61,
    touches: 310,
    dwell: 198,
  },
  {
    id: "bmw-x5",
    name: "BMW X5 xDrive40i",
    model: "G05",
    avgView: 74,
    topAge: "35-44",
    maleRatio: 0.55,
    touches: 280,
    dwell: 142,
  },
  {
    id: "bmw-ac",
    name: "BMW M4 Accessories",
    model: "Acc",
    avgView: 28,
    topAge: "25-34",
    maleRatio: 0.82,
    touches: 520,
    dwell: 48,
  },
  {
    id: "bmw-cs",
    name: "BMW M4 CS",
    model: "G82",
    avgView: 118,
    topAge: "35-44",
    maleRatio: 0.88,
    touches: 220,
    dwell: 232,
  },
];

// ───────────── 出入口 ─────────────
export const entrances = [
  {
    id: "e1",
    name: "E1 — 大門正入口",
    today: 1820,
    weekdayAvg: 1310,
    weekendAvg: 1820,
    conv: 0.21,
    weekdayConv: 0.18,
    weekendConv: 0.26,
  },
  {
    id: "e2",
    name: "E2 — 停車場直達",
    today: 950,
    weekdayAvg: 720,
    weekendAvg: 1120,
    conv: 0.32,
    weekdayConv: 0.29,
    weekendConv: 0.38,
  },
  {
    id: "e3",
    name: "E3 — 後門商談",
    today: 240,
    weekdayAvg: 200,
    weekendAvg: 180,
    conv: 0.62,
    weekdayConv: 0.55,
    weekendConv: 0.68,
  },
];

export const entranceSeries = Array.from({ length: 30 }).map((_, d) => ({
  date: `04/${String(d + 1).padStart(2, "0")}`,
  E1: ri(400, 900),
  E2: ri(250, 600),
  E3: ri(80, 200),
}));

// ───────────── 性別 / 年齡 ─────────────
export const demographics = {
  gender: [
    { name: "男性", value: 58, color: "var(--color-accent)" },
    { name: "女性", value: 42, color: "var(--color-pink)" },
  ],
  ageGender: [
    { age: "18-24", 男性: 180, 女性: 220 },
    { age: "25-34", 男性: 520, 女性: 380 },
    { age: "35-44", 男性: 640, 女性: 420 },
    { age: "45-54", 男性: 410, 女性: 260 },
    { age: "55+", 男性: 220, 女性: 170 },
  ],
  companions: [
    { name: "1 人", value: 48 },
    { name: "2 人", value: 28 },
    { name: "3 人", value: 14 },
    { name: "4 人以上", value: 10 },
  ],
};

// ───────────── Heatmap 點位 ─────────────
export const heatmapPoints = [
  { x: 180, y: 160, intensity: 1.0 },
  { x: 260, y: 180, intensity: 0.9 },
  { x: 340, y: 140, intensity: 0.7 },
  { x: 420, y: 200, intensity: 0.6 },
  { x: 510, y: 220, intensity: 0.8 },
  { x: 600, y: 180, intensity: 0.5 },
  { x: 130, y: 280, intensity: 0.55 },
  { x: 280, y: 310, intensity: 0.45 },
  { x: 420, y: 320, intensity: 0.7 },
];

export const behaviorHeatmap = [
  { x: 220, y: 150, intensity: 0.9 },
  { x: 330, y: 150, intensity: 0.8 },
  { x: 450, y: 120, intensity: 1.0 },
  { x: 560, y: 200, intensity: 0.55 },
  { x: 620, y: 120, intensity: 0.6 },
  { x: 160, y: 300, intensity: 0.4 },
];

// ───────────── 商場總覽 wireframe ─────────────
export const overviewSummary = {
  period: "2026年4月",
  kpis: [
    {
      key: "total",
      label: "今日總人數",
      value: "1,247",
      delta: 5.7,
      hint: "當月平均 1,180",
      tone: "accent" as const,
    },
    {
      key: "sales",
      label: "今日銷售額",
      value: "$86.4萬",
      delta: 6.4,
      hint: "當月平均 $81.2萬",
      tone: "success" as const,
    },
    {
      key: "stay",
      label: "平均停留時間",
      value: "18.3",
      unit: "分",
      delta: 2.1,
      hint: "當月平均 17.9 分",
      tone: "purple" as const,
    },
  ],
  flow30: [
    320, 410, 380, 520, 490, 610, 580, 720, 680, 750, 820, 790, 850, 910,
    880, 920, 980, 1020, 960, 1050, 1100, 1080, 1150, 1200, 1180, 1220,
    1300, 1250, 1320, 1400,
  ].map((v, i) => ({ d: `04/${String(i + 1).padStart(2, "0")}`, 人流: v })),
  flowTotals: [
    { label: "總人流", value: "36,840", color: "#3b82f6" },
    { label: "週間均", value: "1,082", color: "#6366f1" },
    { label: "週末均", value: "1,418", color: "#8b5cf6" },
  ],
  weekFlow: [
    { day: "一", value: 312 },
    { day: "二", value: 278 },
    { day: "三", value: 345 },
    { day: "四", value: 401 },
    { day: "五", value: 523 },
    { day: "六", value: 687 },
    { day: "日", value: 598 },
  ],
  ageGender: [
    { age: "<18", 男性: 12, 女性: 8 },
    { age: "18-24", 男性: 45, 女性: 38 },
    { age: "25-34", 男性: 89, 女性: 72 },
    { age: "35-44", 男性: 76, 女性: 68 },
    { age: "45-54", 男性: 54, 女性: 61 },
    { age: "55+", 男性: 32, 女性: 28 },
  ],
  genderSplit: { male: 52, female: 48 },
  topTypes: [
    { label: "瀏覽商品", pct: 42, color: "#3b82f6" },
    { label: "觸摸商品", pct: 26, color: "#6366f1" },
    { label: "商談諮詢", pct: 20, color: "#8b5cf6" },
    { label: "其他", pct: 12, color: "#a78bfa" },
  ],
  areaTime: [
    { label: "展示區A", pct: 31, color: "#3b82f6" },
    { label: "展示區B", pct: 22, color: "#6366f1" },
    { label: "商談區", pct: 20, color: "#8b5cf6" },
    { label: "入口大廳", pct: 15, color: "#f59e0b" },
    { label: "其他", pct: 12, color: "#e2e8f0" },
  ],
  funnel: [
    { label: "進店總人流", value: 1247, pct: 100, color: "#3b82f6" },
    { label: "賞車行為人數", value: 842, pct: 67.5, color: "#6366f1" },
    { label: "觸摸商品人數", value: 523, pct: 41.9, color: "#8b5cf6" },
    { label: "商談/試乘人數", value: 201, pct: 16.1, color: "#a78bfa" },
  ],
  companions: [
    { label: "獨自一人", count: 412, avg: "12.4分", color: "#3b82f6" },
    { label: "2人同行", count: 389, avg: "21.8分", color: "#6366f1" },
    { label: "3人同行", count: 267, avg: "26.3分", color: "#8b5cf6" },
    { label: "4人以上", count: 179, avg: "31.7分", color: "#f59e0b" },
  ],
};
