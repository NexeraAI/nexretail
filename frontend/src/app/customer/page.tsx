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
import {
  ApiError,
  getStoreOverview,
  listVisitors,
  getVisitor,
  getVisitorBehaviors,
  getVisitorAreaDwell,
  type StoreOverview,
  type VisitorSummary,
  type VisitorDetail,
  type BehaviorEvent,
  type AreaDwell,
} from "@/lib/api";
import { fmt } from "@/lib/utils";
import { Users, Clock, X } from "lucide-react";

const STORE_ID = 1;
const PAGE_SIZE = 50;

const COLORS = [
  "var(--color-accent)",
  "var(--color-pink)",
  "var(--color-purple)",
  "var(--color-teal)",
  "var(--color-warning)",
];

const BEHAVIOR_LABELS: Record<string, string> = {
  browse: "瀏覽 / 駐足",
  touch: "觸摸商品",
  talk: "商談諮詢",
  test_ride: "試乘 / 試坐",
  qr_scan: "掃 QR",
  enter: "進店",
  dwell: "停留",
};

const BEHAVIOR_TONES = ["accent", "pink", "purple", "teal", "warning"] as const;

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "interested", label: "感興趣" },
  { key: "cold", label: "未打開" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

function genderShort(g: "M" | "F" | "U"): "m" | "f" {
  return g === "F" ? "f" : "m";
}
function genderLabel(g: "M" | "F" | "U"): string {
  return g === "F" ? "女" : g === "M" ? "男" : "—";
}
function nameOf(id: number) {
  return `訪客 #${id}`;
}
function tsHHMM(iso: string) {
  return iso.slice(11, 16);
}
function fmtStay(seconds: number) {
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

type DetailBundle = {
  visitor: VisitorDetail;
  behaviors: BehaviorEvent[];
  dwell: AreaDwell[];
};

export default function CustomerPage() {
  const [overview, setOverview] = useState<StoreOverview | null>(null);
  const [visitors, setVisitors] = useState<VisitorSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailBundle | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getStoreOverview(STORE_ID),
      listVisitors(STORE_ID, { date: "month", size: PAGE_SIZE }),
    ])
      .then(([ov, page]) => {
        if (cancelled) return;
        setOverview(ov);
        setVisitors(page.data);
        setTotal(page.total);
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
    if (selectedId == null) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    let cancelled = false;
    setDetail(null);
    setDetailError(null);
    Promise.all([
      getVisitor(selectedId),
      getVisitorBehaviors(selectedId),
      getVisitorAreaDwell(selectedId),
    ])
      .then(([visitor, behaviors, dwell]) => {
        if (cancelled) return;
        setDetail({ visitor, behaviors, dwell });
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        setDetailError(e instanceof ApiError ? e.message : "未預期錯誤");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  if (error) {
    return <div className="p-6 text-sm text-danger">無法載入顧客資料：{error}</div>;
  }
  if (!overview || !visitors) {
    return <div className="p-6 text-sm text-muted">載入中…</div>;
  }

  const ageGenderData = overview.age_gender.map((r) => ({
    age: r.age_group,
    男性: r.male,
    女性: r.female,
  }));

  const behaviorMax = overview.top_behaviors.reduce(
    (m, b) => Math.max(m, b.count),
    0,
  );
  const behaviorRows = overview.top_behaviors.map((b, i) => ({
    name: BEHAVIOR_LABELS[b.behavior_type] ?? b.behavior_type,
    count: b.count,
    tone: BEHAVIOR_TONES[i % BEHAVIOR_TONES.length],
  }));

  const companionTotal = overview.companions.reduce((s, c) => s + c.count, 0);
  const companionData = overview.companions.map((c) => ({
    name: c.label,
    value: companionTotal ? Math.round((c.count / companionTotal) * 100) : 0,
  }));

  const avgCompanion = visitors.length
    ? (
        visitors.reduce((s, v) => s + v.companion_count, 0) / visitors.length
      ).toFixed(1)
    : "—";

  const interestedSampleCount = visitors.filter((v) => v.interested_flag).length;
  const interestedPct = visitors.length
    ? Math.round((interestedSampleCount / visitors.length) * 100)
    : 0;

  const filteredVisitors = visitors.filter((v) => {
    if (filter === "interested") return v.interested_flag;
    if (filter === "cold") return !v.interested_flag;
    return true;
  });

  const dwellMax =
    detail && detail.dwell.length
      ? Math.max(...detail.dwell.map((d) => d.dwell_seconds), 1)
      : 1;

  return (
    <>
      <PageHeader
        eyebrow="CUSTOMER"
        title="顧客分析"
        desc="性別年齡、行為分布與個別顧客細節。"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat
            label="進店顧客"
            value={fmt(overview.kpi.total_visitors)}
            tone="accent"
            icon={<Users size={14} />}
          />
          <Stat
            label="平均停留"
            value={`${Math.round(overview.kpi.avg_stay_seconds / 60)}m`}
            tone="default"
            icon={<Clock size={14} />}
          />
          <Stat
            label="同行平均"
            value={avgCompanion}
            unit="人"
            tone="purple"
            hint="樣本"
          />
          <Stat
            label="感興趣比例"
            value={`${interestedPct}%`}
            tone="success"
            hint="樣本"
          />
        </div>

        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 lg:col-span-5">
            <CardHeader title="性別與年齡佔比" desc="最多 5 種類型顯示" />
            <CardBody>
              <div className="h-64">
                <ChartContainer width="100%" height="100%">
                  <BarChart data={ageGenderData}>
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
                    <Tooltip />
                    <Bar dataKey="男性" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="女性" stackId="a" fill="#ee5da1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardBody>
          </Card>

          <Card className="col-span-12 lg:col-span-4">
            <CardHeader
              title="顧客行為數量與佔比"
              desc="橫條圖 hover 顯示 % 與人數"
            />
            <CardBody>
              <ul className="space-y-3">
                {behaviorRows.map((b) => (
                  <li key={b.name}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span>{b.name}</span>
                      <span className="text-muted tabular-nums">
                        {fmt(b.count)} ({Math.round((b.count / behaviorMax) * 100)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(b.count / behaviorMax) * 100}%`,
                          background: `var(--color-${b.tone})`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card className="col-span-12 lg:col-span-3">
            <CardHeader title="同行人數佔比" desc="獨自 vs 結伴" />
            <CardBody>
              <div className="h-48">
                <ChartContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={companionData}
                      dataKey="value"
                      innerRadius={44}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {companionData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ChartContainer>
              </div>
              <ul className="space-y-1 text-xs">
                {companionData.map((c, i) => (
                  <li key={c.name} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      {c.name}
                    </span>
                    <span className="text-muted">{c.value}%</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="顧客列表"
            desc={`本月共 ${fmt(total)} 位 · 顯示前 ${fmt(visitors.length)} 位 · 點擊查看細節`}
            action={
              <div className="flex gap-1 text-xs">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={
                      "px-2.5 py-1 rounded-md " +
                      (filter === f.key
                        ? "bg-accent text-white"
                        : "text-muted hover:bg-surface-2")
                    }
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            }
          />
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-xs text-muted">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">頭像</th>
                  <th className="text-left font-medium px-3 py-2.5">時間戳</th>
                  <th className="text-left font-medium px-3 py-2.5">年齡 / 性別</th>
                  <th className="text-left font-medium px-3 py-2.5">攜伴</th>
                  <th className="text-left font-medium px-3 py-2.5">狀態</th>
                  <th className="text-right font-medium px-5 py-2.5">停留</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVisitors.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="hover:bg-surface-2/60 cursor-pointer"
                  >
                    <td className="px-5 py-2.5">
                      <Avatar
                        name={nameOf(c.id)}
                        gender={genderShort(c.gender)}
                        size={30}
                      />
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-xs text-muted">
                      {tsHHMM(c.entered_at)}
                    </td>
                    <td className="px-3 py-2.5">
                      {c.age_group} · {genderLabel(c.gender)}
                    </td>
                    <td className="px-3 py-2.5">{c.companion_count} 位</td>
                    <td className="px-3 py-2.5">
                      {c.interested_flag ? (
                        <Badge tone="success">感興趣</Badge>
                      ) : (
                        <Badge>未打開</Badge>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums">
                      {fmtStay(c.stay_seconds)}
                    </td>
                  </tr>
                ))}
                {filteredVisitors.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-6 text-center text-xs text-muted"
                    >
                      無符合條件的顧客
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>

      {/* Detail drawer */}
      {selectedId != null && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setSelectedId(null)}
        >
          <aside
            className="absolute right-0 top-0 h-full w-[420px] bg-surface border-l border-border shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="h-14 flex items-center justify-between px-5 border-b border-border">
              <div>
                <div className="text-sm font-semibold">顧客細節</div>
                <div className="text-xs text-muted">
                  {detail ? tsHHMM(detail.visitor.entered_at) : "—"}
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="p-1.5 rounded-md hover:bg-surface-2 text-muted"
              >
                <X size={16} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {detailError && (
                <div className="text-sm text-danger">
                  無法載入：{detailError}
                </div>
              )}
              {!detail && !detailError && (
                <div className="text-sm text-muted">載入中…</div>
              )}
              {detail && (
                <>
                  <div className="aspect-[3/4] rounded-lg bg-surface-2 grid place-items-center relative border border-border">
                    <Avatar
                      name={nameOf(detail.visitor.id)}
                      gender={genderShort(detail.visitor.gender)}
                      size={120}
                    />
                    <span className="absolute top-2 left-2">
                      <Badge tone="accent">全身擷取</Badge>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="編號" value={`#${detail.visitor.id}`} />
                    <Field label="性別" value={genderLabel(detail.visitor.gender)} />
                    <Field label="年齡層" value={detail.visitor.age_group} />
                    <Field
                      label="攜伴"
                      value={`${detail.visitor.companion_count} 位`}
                    />
                    <Field
                      label="停留時間"
                      value={fmtStay(detail.visitor.stay_seconds)}
                    />
                    <Field
                      label="興趣狀態"
                      value={detail.visitor.interested_flag ? "感興趣" : "觀望"}
                    />
                  </div>

                  <section>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                      行為時序
                    </h4>
                    {detail.behaviors.length === 0 ? (
                      <div className="text-xs text-muted">尚無行為紀錄</div>
                    ) : (
                      <ol className="relative border-l border-border ml-2 space-y-2.5">
                        {detail.behaviors.map((b, i) => (
                          <li key={b.id} className="pl-4 text-sm">
                            <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-accent ring-4 ring-accent/10" />
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {BEHAVIOR_LABELS[b.behavior_type] ?? b.behavior_type}
                              </span>
                              <span className="text-xs text-muted tabular-nums">
                                {tsHHMM(b.started_at)}
                              </span>
                            </div>
                            <div className="text-xs text-muted">
                              順序 #{i + 1} · 持續 {b.duration_seconds} 秒
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>

                  <section>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                      各區域停留時間
                    </h4>
                    <ul className="space-y-1.5">
                      {detail.dwell.map((a, i) => (
                        <li key={a.area_id}>
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span>{a.area_name}</span>
                            <span className="text-muted">{a.dwell_seconds}s</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(a.dwell_seconds / dwellMax) * 100}%`,
                                background: COLORS[i % COLORS.length],
                              }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/50 px-3 py-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
