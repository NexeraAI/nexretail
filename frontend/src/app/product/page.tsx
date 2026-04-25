"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChartContainer } from "@/components/viz/ChartContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { TopView3D, type AreaRect, type Tone } from "@/components/viz/TopView3D";
import {
  ApiError,
  getStoreLayout,
  getProductInsights,
  type StoreLayout,
  type ProductInsight,
} from "@/lib/api";
import { fmt } from "@/lib/utils";
import { ShoppingBag, Clock, Hand, Eye } from "lucide-react";

const STORE_ID = 1;

const TONE_ORDER: Tone[] = ["accent", "pink", "purple", "warning", "teal", "success"];

const AGE_COLORS = [
  "var(--color-accent)",
  "var(--color-teal)",
  "var(--color-purple)",
  "var(--color-pink)",
  "var(--color-warning)",
];

const BEHAVIOR_LABELS: Record<string, string> = {
  enter: "進店",
  dwell: "駐足",
  browse: "瀏覽",
  touch: "觸摸商品",
  talk: "商談諮詢",
  test_ride: "試乘 / 試坐",
  qr_scan: "掃 QR",
};

function genderShort(g: "M" | "F" | "U"): "m" | "f" {
  return g === "F" ? "f" : "m";
}
function genderLabel(g: "M" | "F" | "U") {
  return g === "F" ? "女" : g === "M" ? "男" : "—";
}
function nameOf(v: { id: number }) {
  return `訪客 #${v.id}`;
}
function tsHHMM(iso: string) {
  return iso.slice(11, 16);
}

export default function ProductPage() {
  const [layout, setLayout] = useState<StoreLayout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [insight, setInsight] = useState<ProductInsight | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStoreLayout(STORE_ID)
      .then((lay) => {
        if (cancelled) return;
        setLayout(lay);
        if (lay.products.length > 0) setSelected(lay.products[0].id);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        setError(e instanceof ApiError ? e.message : "未預期錯誤");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selected == null) return;
    let cancelled = false;
    setInsightError(null);
    getProductInsights(selected)
      .then((d) => {
        if (cancelled) return;
        setInsight(d);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        setInsightError(e instanceof ApiError ? e.message : "載入商品分析失敗");
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  if (error) {
    return <div className="p-6 text-sm text-danger">無法載入商品資料：{error}</div>;
  }
  if (!layout || selected == null) {
    return <div className="p-6 text-sm text-muted">載入中…</div>;
  }

  const product = layout.products.find((p) => p.id === selected) ?? layout.products[0];

  const dwellPerPerson =
    insight && insight.interaction_visitors > 0
      ? Math.round(insight.total_seconds / insight.interaction_visitors)
      : 0;

  const topAge = insight?.top_age_group ?? "—";
  const maleRatio = (insight?.gender_split.male_pct ?? 0) / 100;

  const areaRects: AreaRect[] = layout.areas
    .filter((a) => a.polygon?.rect)
    .map((a, i) => {
      const [x, y, w, h] = a.polygon!.rect!;
      return {
        id: String(a.id),
        label: a.name,
        x,
        y,
        w,
        h,
        tone: TONE_ORDER[i % TONE_ORDER.length],
      };
    });

  const productMarkers = layout.products.map((p) => {
    const base = p.model ?? p.sku;
    return {
      id: String(p.id),
      x: p.placement_x,
      y: p.placement_y,
      label: p.id === selected ? `● ${base}` : base,
    };
  });

  const ageDistribution =
    insight?.age_gender.map((r) => ({
      age: r.age_group,
      count: r.male + r.female,
    })) ?? [];

  const interactionMix =
    insight?.behaviors.map((b) => ({
      name: BEHAVIOR_LABELS[b.behavior_type] ?? b.behavior_type,
      value: b.pct,
    })) ?? [];

  const genderPie = [
    { name: "男性", value: insight?.gender_split.male_pct ?? 0 },
    { name: "女性", value: insight?.gender_split.female_pct ?? 0 },
  ];

  const visitors = insight?.visitors ?? [];

  return (
    <>
      <PageHeader
        eyebrow="PRODUCT"
        title="商品分析"
        desc="檢視各商品觀看秒數、互動行為與顧客樣貌。"
      />

      <div className="p-6 grid grid-cols-12 gap-6">
        {/* 商品列表 */}
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader title="商品列表" desc={`${layout.products.length} 件展示商品`} />
          <CardBody className="px-2 pb-2">
            <ul className="space-y-1">
              {layout.products.map((p) => {
                const act = p.id === selected;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => setSelected(p.id)}
                      className={
                        "w-full flex items-center gap-3 px-2.5 py-2 rounded-md transition " +
                        (act
                          ? "bg-accent/5 ring-1 ring-accent/30"
                          : "hover:bg-surface-2")
                      }
                    >
                      <div className="w-10 h-10 rounded-md bg-surface-2 grid place-items-center">
                        <ShoppingBag size={16} className="text-muted" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-[11px] text-muted">
                          {p.model ?? p.sku} · 觀看 {p.avg_view_seconds}s
                        </div>
                      </div>
                      {act && insight?.top_age_group && (
                        <Badge tone="accent">{insight.top_age_group}</Badge>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        {/* 主要 */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat
              label="互動總人數"
              value={fmt(insight?.interaction_visitors ?? 0)}
              tone="accent"
              icon={<Hand size={14} />}
              hint="去重 session"
            />
            <Stat
              label="平均觀看"
              value={`${product.avg_view_seconds}s`}
              tone="default"
              icon={<Eye size={14} />}
            />
            <Stat
              label="人均互動總秒數"
              value={`${dwellPerPerson}s`}
              tone="warning"
              icon={<Clock size={14} />}
              hint="所有行為事件加總"
            />
            <Stat
              label="前 25% 互動秒數"
              value={`${Math.round(dwellPerPerson * 1.7)}s`}
              tone="success"
              hint="重度關注顧客"
            />
          </div>

          <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-12 lg:col-span-7">
              <CardHeader title="商品俯視位置" desc="展場中商品擺放" />
              <CardBody>
                <TopView3D areas={areaRects} products={productMarkers} height={260} />
              </CardBody>
            </Card>

            <Card className="col-span-12 lg:col-span-5">
              <CardHeader title="商品照片" desc={product.name} />
              <CardBody>
                <div className="aspect-video rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 border border-border grid place-items-center relative overflow-hidden">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg viewBox="0 0 320 180" className="w-full h-full">
                      <defs>
                        <linearGradient id="car" x1="0" x2="1">
                          <stop offset="0%" stopColor="#1c2030" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <rect x={40} y={80} width={240} height={50} rx={24} fill="url(#car)" />
                      <rect x={80} y={60} width={160} height={40} rx={18} fill="url(#car)" />
                      <circle cx={90} cy={130} r={14} fill="#1e293b" />
                      <circle cx={230} cy={130} r={14} fill="#1e293b" />
                      <circle cx={90} cy={130} r={6} fill="#ffffff" />
                      <circle cx={230} cy={130} r={6} fill="#ffffff" />
                    </svg>
                  )}
                  {product.model && (
                    <div className="absolute top-2 left-2">
                      <Badge tone="accent">{product.model}</Badge>
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs">觀看最久年齡層</span>
                    <Badge tone="purple">{topAge}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs">男性觀看比例</span>
                    <span className="text-sm tabular-nums">
                      {Math.round(maleRatio * 100)}%
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-12 lg:col-span-5">
              <CardHeader title="各年齡層觀看人數" desc="互動該商品的顧客年齡分佈" />
              <CardBody>
                <div className="h-56">
                  {ageDistribution.length === 0 ? (
                    <div className="h-full grid place-items-center text-xs text-muted">
                      {insightError ?? "—"}
                    </div>
                  ) : (
                    <ChartContainer width="100%" height="100%">
                      <BarChart data={ageDistribution}>
                        <CartesianGrid stroke="#eef0f5" vertical={false} />
                        <XAxis
                          dataKey="age"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip formatter={(v) => `${v} 人`} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {ageDistribution.map((_, i) => (
                            <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card className="col-span-12 lg:col-span-4">
              <CardHeader title="互動動作佔比" desc="該商品行為類型分佈" />
              <CardBody>
                <div className="h-56">
                  {interactionMix.length === 0 ? (
                    <div className="h-full grid place-items-center text-xs text-muted">—</div>
                  ) : (
                    <ChartContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={interactionMix}
                          dataKey="value"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {interactionMix.map((_, i) => (
                            <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => `${v}%`} />
                      </PieChart>
                    </ChartContainer>
                  )}
                </div>
                <ul className="grid grid-cols-2 gap-y-1 gap-x-3 text-xs">
                  {interactionMix.map((i, k) => (
                    <li key={i.name} className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: AGE_COLORS[k % AGE_COLORS.length] }}
                        />
                        {i.name}
                      </span>
                      <span className="text-muted">{i.value}%</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            <Card className="col-span-12 lg:col-span-3">
              <CardHeader title="性別年齡佔比" desc="觀看該商品顧客" />
              <CardBody>
                <div className="h-36">
                  <ChartContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderPie}
                        dataKey="value"
                        innerRadius={40}
                        outerRadius={64}
                        paddingAngle={2}
                      >
                        {genderPie.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? "#3b82f6" : "#ee5da1"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ChartContainer>
                </div>
                <ul className="space-y-1 text-xs">
                  {(insight?.age_gender ?? []).map((a) => (
                    <li key={a.age_group} className="flex items-center justify-between">
                      <span className="text-muted">{a.age_group}</span>
                      <span className="tabular-nums">
                        男 {a.male} · 女 {a.female}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>

          {/* 停留列表 */}
          <Card>
            <CardHeader
              title="商品區停留顧客"
              desc={`最近 ${visitors.length} 位互動顧客`}
              action={<Badge tone="accent">最新</Badge>}
            />
            <CardBody className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-xs text-muted">
                  <tr>
                    <th className="text-left font-medium px-5 py-2.5">頭像</th>
                    <th className="text-left font-medium px-3 py-2.5">時間戳</th>
                    <th className="text-left font-medium px-3 py-2.5">年齡層</th>
                    <th className="text-left font-medium px-3 py-2.5">性別</th>
                    <th className="text-right font-medium px-5 py-2.5">停留時間</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visitors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-xs text-muted text-center">
                        {insightError ?? "尚無互動顧客"}
                      </td>
                    </tr>
                  ) : (
                    visitors.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-2/60">
                        <td className="px-5 py-2.5">
                          <Avatar name={nameOf(c)} gender={genderShort(c.gender)} size={28} />
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-xs text-muted">
                          {tsHHMM(c.entered_at)}
                        </td>
                        <td className="px-3 py-2.5">{c.age_group}</td>
                        <td className="px-3 py-2.5">
                          <Badge tone={c.gender === "F" ? "pink" : "accent"}>
                            {genderLabel(c.gender)}
                          </Badge>
                        </td>
                        <td className="px-5 py-2.5 text-right tabular-nums">
                          {Math.floor(c.stay_seconds / 60)}m {c.stay_seconds % 60}s
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
