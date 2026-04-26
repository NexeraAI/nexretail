"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartContainer } from "@/components/viz/ChartContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { TopView3D, type AreaRect, type Tone } from "@/components/viz/TopView3D";
import {
  ApiError,
  getStoreEntranceInsights,
  getStoreLayout,
  type EntranceInsights,
  type EntranceMetrics,
  type StoreLayout,
} from "@/lib/api";
import { fmt } from "@/lib/utils";
import { DoorOpen, TrendingUp, Users } from "lucide-react";

const STORE_ID = 1;

const TONE_ORDER: Tone[] = ["accent", "pink", "purple", "warning", "teal", "success"];
const LINE_COLORS = ["#3b82f6", "#12b76a", "#ee5da1", "#7a5af8", "#f79009"];

export default function EntrancePage() {
  const [layout, setLayout] = useState<StoreLayout | null>(null);
  const [insights, setInsights] = useState<EntranceInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"all" | "single">("all");
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getStoreLayout(STORE_ID), getStoreEntranceInsights(STORE_ID)])
      .then(([lay, ins]) => {
        if (cancelled) return;
        setLayout(lay);
        setInsights(ins);
        if (ins.entrances.length > 0) setSelected(ins.entrances[0].id);
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
    return <div className="p-6 text-sm text-danger">無法載入出入口資料：{error}</div>;
  }
  if (!layout || !insights || selected == null) {
    return <div className="p-6 text-sm text-muted">載入中…</div>;
  }

  const current: EntranceMetrics =
    insights.entrances.find((e) => e.id === selected) ?? insights.entrances[0];

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
  const entranceMarkers = insights.entrances.map((e) => ({
    x: e.position_x,
    y: e.position_y,
    label: e.code,
  }));

  // 折線圖：取最近 14 天，rechart row 用 entrance code 為 dataKey
  const lineData = insights.daily_series.slice(-14).map((p) => ({
    date: p.date,
    ...p.counts,
  }));

  // 「入口總數」卡片：30 天總和、週間/週末日均
  const totals = insights.entrances.reduce(
    (acc, e) => ({
      weekday: acc.weekday + e.weekday_avg,
      weekend: acc.weekend + e.weekend_avg,
    }),
    { weekday: 0, weekend: 0 },
  );
  // 30 天視窗內固定權重（22 weekday + 8 weekend，保留簡單估算）
  const monthTotal = totals.weekday * 22 + totals.weekend * 8;

  const avgConv =
    insights.entrances.reduce((s, e) => s + e.conversion_rate, 0) /
    Math.max(1, insights.entrances.length);

  const conversionBars = insights.entrances.map((e) => ({
    name: e.code,
    週間: Math.round(e.weekday_conv * 100),
    週末: Math.round(e.weekend_conv * 100),
  }));

  return (
    <>
      <PageHeader
        eyebrow="ENTRANCE"
        title="出入口分析"
        desc="各出入口人流、轉換率與時段分布。"
        action={
          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setMode("all")}
              className={
                "px-2.5 py-1 rounded-md " +
                (mode === "all"
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-surface-2")
              }
            >
              全總覽
            </button>
            <button
              onClick={() => setMode("single")}
              className={
                "px-2.5 py-1 rounded-md " +
                (mode === "single"
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-surface-2")
              }
            >
              單一出口
            </button>
          </div>
        }
      />

      <div className="p-6 grid grid-cols-12 gap-6">
        {/* 出入口列表 */}
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader title="出入口列表" desc="點擊切換詳細" />
          <CardBody className="px-2 pb-2">
            <ul className="space-y-1">
              {insights.entrances.map((e) => {
                const act = e.id === selected;
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => setSelected(e.id)}
                      className={
                        "w-full flex items-center justify-between px-2.5 py-2 rounded-md transition " +
                        (act
                          ? "bg-accent/5 ring-1 ring-accent/30"
                          : "hover:bg-surface-2")
                      }
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-success/10 text-success grid place-items-center">
                          <DoorOpen size={14} />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium">
                            {e.code} — {e.name}
                          </div>
                          <div className="text-xs text-muted">
                            今日 {fmt(e.today_count)} 人
                          </div>
                        </div>
                      </div>
                      <Badge tone={act ? "accent" : "default"}>
                        {Math.round(e.conversion_rate * 100)}%
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardBody>

          <div className="px-5 pb-5">
            <Card className="bg-surface-2 border-dashed">
              <CardBody className="py-3">
                <div className="text-xs text-muted mb-1">入口總數 (近 30 天估)</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{fmt(monthTotal)}</span>
                </div>
                <ul className="mt-2 space-y-0.5 text-[11px] text-muted">
                  <li className="flex justify-between">
                    <span>每日週間平均</span>
                    <span>{fmt(totals.weekday)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>每日週末平均</span>
                    <span>{fmt(totals.weekend)}</span>
                  </li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </Card>

        {/* 平面圖 + 指標 */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <Card>
            <CardHeader
              title="平面圖 · 出入口俯視"
              desc="綠色標籤為出入口，點擊左側列表聚焦"
            />
            <CardBody>
              <TopView3D
                areas={areaRects}
                entrances={entranceMarkers}
                highlightId={String(current.id)}
                height={280}
              />
            </CardBody>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat
              label={`${current.code} 今日人流`}
              value={fmt(current.today_count)}
              tone="accent"
              icon={<Users size={14} />}
            />
            <Stat
              label="週間平均"
              value={fmt(current.weekday_avg)}
              tone="default"
            />
            <Stat
              label="週末平均"
              value={fmt(current.weekend_avg)}
              tone="warning"
            />
            <Stat
              label="轉換率"
              value={`${Math.round(current.conversion_rate * 100)}%`}
              tone="success"
              icon={<TrendingUp size={14} />}
            />
          </div>

          <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-12 lg:col-span-7">
              <CardHeader
                title={
                  mode === "all"
                    ? "近 14 天 · 各入口人流"
                    : `${current.code} — 近 14 天人流`
                }
                desc="折線圖比較入口使用量"
              />
              <CardBody>
                <div className="h-64">
                  <ChartContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                      <CartesianGrid stroke="#eef0f5" vertical={false} />
                      <XAxis
                        dataKey="date"
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
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11 }}
                      />
                      {insights.entrances.map((e, i) =>
                        mode === "single" && e.id !== current.id ? null : (
                          <Line
                            key={e.code}
                            type="monotone"
                            dataKey={e.code}
                            stroke={LINE_COLORS[i % LINE_COLORS.length]}
                            strokeWidth={2.2}
                            dot={false}
                          />
                        ),
                      )}
                    </LineChart>
                  </ChartContainer>
                </div>
              </CardBody>
            </Card>

            <Card className="col-span-12 lg:col-span-5">
              <CardHeader
                title="轉換率 · 週間 vs 週末"
                desc="每口進店後完成 funnel 行為比例"
              />
              <CardBody>
                <div className="h-64">
                  <ChartContainer width="100%" height="100%">
                    <BarChart data={conversionBars}>
                      <CartesianGrid stroke="#eef0f5" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11 }}
                      />
                      <Bar dataKey="週間" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="週末" fill="#7a5af8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>
                    平均轉換率{" "}
                    <span className="text-foreground font-medium">
                      {Math.round(avgConv * 100)}%
                    </span>
                  </span>
                  <Badge tone="success">
                    {current.code} 週末 vs 週間{" "}
                    {current.weekend_conv >= current.weekday_conv ? "+" : ""}
                    {Math.round(
                      (current.weekend_conv - current.weekday_conv) * 100,
                    )}
                    %
                  </Badge>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
