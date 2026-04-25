"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChartContainer } from "@/components/viz/ChartContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Stat } from "@/components/ui/Stat";
import { TopView3D, type AreaRect, type Tone } from "@/components/viz/TopView3D";
import {
  ApiError,
  getStoreLayout,
  getStoreOverview,
  listVisitors,
  type StoreLayout,
  type StoreOverview,
  type VisitorSummary,
} from "@/lib/api";
import { fmt } from "@/lib/utils";
import { Users, Clock, Activity, Play } from "lucide-react";

const STORE_ID = 1;

const TONE_ORDER: Tone[] = ["accent", "pink", "purple", "warning", "teal", "success"];
const WEEKDAY_LABELS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];

function genderShort(g: "M" | "F" | "U"): "m" | "f" {
  return g === "F" ? "f" : "m";
}
function nameOf(v: { id: number }) {
  return `訪客 #${v.id}`;
}
function tsHHMM(iso: string) {
  return iso.slice(11, 16);
}

export default function AreaPage() {
  const [layout, setLayout] = useState<StoreLayout | null>(null);
  const [overview, setOverview] = useState<StoreOverview | null>(null);
  const [visitors, setVisitors] = useState<VisitorSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getStoreLayout(STORE_ID),
      getStoreOverview(STORE_ID),
      listVisitors(STORE_ID, { date: "month", size: 24 }),
    ])
      .then(([lay, ov, page]) => {
        if (cancelled) return;
        setLayout(lay);
        setOverview(ov);
        setVisitors(page.data);
        if (lay.areas.length > 0) setSelected(lay.areas[0].id);
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

  if (error) {
    return <div className="p-6 text-sm text-danger">無法載入區域資料：{error}</div>;
  }
  if (!layout || !overview || !visitors || selected == null) {
    return <div className="p-6 text-sm text-muted">載入中…</div>;
  }

  const areasIndexed = layout.areas.map((a, i) => ({
    ...a,
    tone: TONE_ORDER[i % TONE_ORDER.length],
  }));
  const areaIdx = Math.max(
    0,
    areasIndexed.findIndex((a) => a.id === selected),
  );
  const area = areasIndexed[areaIdx];

  const areaRects: AreaRect[] = areasIndexed
    .filter((a) => a.polygon?.rect)
    .map((a) => {
      const [x, y, w, h] = a.polygon!.rect!;
      return { id: String(a.id), label: a.name, x, y, w, h, tone: a.tone };
    });

  const productMarkers = layout.products.map((p) => ({
    id: String(p.id),
    x: p.placement_x,
    y: p.placement_y,
    label: p.model ?? p.sku,
  }));

  const totalVisitors = overview.kpi.total_visitors;
  const areaTimeRow = overview.area_time.find((r) => r.area_id === area.id);
  const avgStay =
    areaTimeRow && totalVisitors > 0
      ? Math.round(areaTimeRow.seconds / totalVisitors)
      : null;

  const ageGenderTotal = overview.age_gender.reduce(
    (sum, r) => sum + r.male + r.female,
    0,
  );
  let topCombo = { label: "—", count: 0 };
  for (const r of overview.age_gender) {
    if (r.male > topCombo.count) topCombo = { label: `男 ${r.age_group}`, count: r.male };
    if (r.female > topCombo.count)
      topCombo = { label: `女 ${r.age_group}`, count: r.female };
  }
  const topComboPct = ageGenderTotal
    ? Math.round((topCombo.count / ageGenderTotal) * 100)
    : 0;

  const ageMax = overview.age_gender.reduce(
    (m, r) => {
      const total = r.male + r.female;
      return total > m.total ? { age: r.age_group, total } : m;
    },
    { age: "—", total: 0 },
  );
  const ageMaxPct = ageGenderTotal
    ? Math.round((ageMax.total / ageGenderTotal) * 100)
    : 0;

  const weeklyAvg =
    overview.week_flow.length === 0
      ? 0
      : Math.round(
          overview.week_flow.reduce((s, w) => s + w.visitors, 0) /
            overview.week_flow.length,
        );
  const weeklyTraffic = WEEKDAY_LABELS.map((label, i) => {
    const row = overview.week_flow.find((w) => w.weekday === i);
    return { day: label, 人流: row?.visitors ?? 0, 平均: weeklyAvg };
  });

  const genderPie = [
    { name: "男性", value: overview.gender_split.male_pct },
    { name: "女性", value: overview.gender_split.female_pct },
  ];

  const companionsTotal = overview.companions.reduce((s, c) => s + c.count, 0);
  const companions2Plus = overview.companions
    .filter((c) => c.label !== "獨自一人")
    .reduce((s, c) => s + c.count, 0);
  const companionsPct = companionsTotal
    ? Math.round((companions2Plus / companionsTotal) * 100)
    : 0;

  const visibleVisitors = visitors.slice(0, 12);

  return (
    <>
      <PageHeader
        eyebrow="AREA"
        title="區域分析"
        desc="以展場區域為單位，檢視人流密度、顧客樣貌與停留名單。"
      />

      <div className="p-6 grid grid-cols-12 gap-6">
        {/* 區域選單 */}
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader title="區域列表" desc="點擊切換" />
          <CardBody className="px-2 pb-2">
            <ul className="space-y-1">
              {areasIndexed.map((a) => {
                const act = a.id === selected;
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => setSelected(a.id)}
                      className={
                        "w-full flex items-center justify-between px-2.5 py-2 rounded-md transition " +
                        (act
                          ? "bg-accent/5 ring-1 ring-accent/30"
                          : "hover:bg-surface-2")
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ background: `var(--color-${a.tone})` }}
                        />
                        <div className="text-left">
                          <div className="text-sm font-medium">{a.name}</div>
                          <div className="text-xs text-muted">{a.type}區</div>
                        </div>
                      </div>
                      <Badge tone={a.tone}>{fmt(a.today_count)}</Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        {/* 中間 – 即時影像 + 俯視 */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="即時影像"
                desc={`${area.name} · CAM-0${(areaIdx % 4) + 1}`}
                action={<Badge tone="danger">● LIVE</Badge>}
              />
              <CardBody>
                <div className="aspect-video rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-800 grid place-items-center relative overflow-hidden">
                  <Play size={28} className="text-white/70" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(47,104,255,0.25),transparent_55%)]" />
                  <div className="absolute top-2 left-2">
                    <Badge tone="danger">● REC</Badge>
                  </div>
                  <div className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/60 text-white px-1.5 py-0.5 rounded">
                    10:42:08
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="3D 俯視位置" desc="區域於展場的位置" />
              <CardBody>
                <TopView3D
                  areas={areaRects}
                  products={productMarkers}
                  highlightId={String(area.id)}
                  height={260}
                />
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat
              label="今日總人數"
              value={fmt(area.today_count)}
              tone="accent"
              icon={<Users size={14} />}
            />
            <Stat
              label="人均區內秒數"
              value={avgStay == null ? "—" : `${avgStay}s`}
              tone="default"
              icon={<Clock size={14} />}
              hint="全店人均"
            />
            <Stat
              label="前 25% 停留"
              value={avgStay == null ? "—" : `${Math.round(avgStay * 1.8)}s`}
              tone="success"
              icon={<Activity size={14} />}
            />
            <Stat
              label="最多類型"
              value={topCombo.label}
              tone="warning"
              hint={`佔 ${topComboPct}%`}
            />
          </div>

          <Card>
            <CardHeader title="一週每小時人流密度" desc="數值越高 → 越擁擠" />
            <CardBody>
              <div className="h-52">
                <ChartContainer width="100%" height="100%">
                  <ComposedChart data={weeklyTraffic}>
                    <CartesianGrid stroke="#eef0f5" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="人流"
                      fill={`var(--color-${area.tone})`}
                      radius={[6, 6, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="平均"
                      stroke="#94a3b8"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </ComposedChart>
                </ChartContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 右側 – 客戶樣貌 + 列表 */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <Card>
            <CardHeader title="客戶樣貌" desc="該區域顧客結構" />
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
              <div className="flex items-center justify-between text-xs">
                <span>
                  <span className="inline-block w-2 h-2 rounded-full bg-accent mr-1.5" />
                  男性 {overview.gender_split.male_pct}%
                </span>
                <span>
                  <span className="inline-block w-2 h-2 rounded-full bg-pink mr-1.5" />
                  女性 {overview.gender_split.female_pct}%
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">攜伴比例</span>
                  <span>{companionsPct}% (2 人以上)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">年齡最多</span>
                  <span>
                    {ageMax.age} ({ageMaxPct}%)
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="全店訪客"
              desc={`${visibleVisitors.length} 位`}
            />
            <CardBody className="px-0 pb-0">
              <ul className="divide-y divide-border max-h-[360px] overflow-y-auto">
                {visibleVisitors.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-2"
                  >
                    <Avatar name={nameOf(c)} gender={genderShort(c.gender)} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{nameOf(c)}</div>
                      <div className="text-[11px] text-muted">
                        {tsHHMM(c.entered_at)} · {c.age_group}
                      </div>
                    </div>
                    <span className="text-[11px] tabular-nums text-muted">
                      {Math.round(c.stay_seconds / 60)}m
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
