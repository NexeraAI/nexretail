"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/components/viz/ChartContainer";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import {
  ApiError,
  getStore,
  getStoreOverview,
  type Store,
  type StoreOverview,
} from "@/lib/api";
import { Users, TrendingUp, Timer } from "lucide-react";

const STORE_ID = 1;
const DATE_RANGES = ["今日", "本月", "自訂"] as const;
const PALETTE = ["#3b82f6", "#6366f1", "#8b5cf6", "#a78bfa", "#f59e0b", "#e2e8f0"];
const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

const BEHAVIOR_LABELS: Record<string, string> = {
  browse: "瀏覽 / 駐足",
  touch: "觸摸商品",
  talk: "商談諮詢",
  test_ride: "試乘 / 試坐",
  qr_scan: "掃 QR",
};

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export default function OverviewPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [data, setData] = useState<StoreOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getStore(STORE_ID), getStoreOverview(STORE_ID)])
      .then(([s, d]) => {
        setStore(s);
        setData(d);
      })
      .catch((e) => {
        console.error(e);
        setError(e instanceof ApiError ? e.message : "未預期錯誤");
      });
  }, []);

  if (error) {
    return (
      <div className="p-6 text-sm text-danger">
        無法載入 overview：{error}
      </div>
    );
  }
  if (!data || !store) {
    return <div className="p-6 text-sm text-muted">載入中…</div>;
  }

  const flow30 = data.flow_30d.map((p) => ({ d: p.date, 人流: p.visitors }));
  const flowTotal = data.flow_30d.reduce((a, b) => a + b.visitors, 0);
  const weekFlow = data.week_flow.map((w) => ({
    day: WEEKDAY_LABELS[w.weekday],
    value: w.visitors,
  }));
  const weekdayAvg = average(
    data.week_flow.filter((w) => w.weekday < 5).map((w) => w.visitors),
  );
  const weekendAvg = average(
    data.week_flow.filter((w) => w.weekday >= 5).map((w) => w.visitors),
  );
  const flowTotals = [
    { label: "近 30 天總人流", value: fmt(flowTotal), color: PALETTE[0] },
    { label: "週間日均", value: fmt(weekdayAvg), color: PALETTE[1] },
    { label: "週末日均", value: fmt(weekendAvg), color: PALETTE[2] },
  ];

  const ageGender = data.age_gender.map((r) => ({
    age: r.age_group,
    男性: r.male,
    女性: r.female,
  }));
  const topTypes = data.top_behaviors.map((b, i) => ({
    label: BEHAVIOR_LABELS[b.behavior_type] ?? b.behavior_type,
    pct: b.pct,
    color: PALETTE[i % PALETTE.length],
  }));
  const areaTime = data.area_time.map((a, i) => ({
    label: a.area_name,
    pct: a.pct,
    color: PALETTE[i % PALETTE.length],
  }));
  const funnel = data.funnel.map((f, i) => ({
    label: f.label,
    value: f.value,
    pct: f.pct,
    color: PALETTE[i % PALETTE.length],
  }));
  const companions = data.companions.map((c, i) => ({
    label: c.label,
    count: c.count,
    avg: `${Math.round(c.avg_stay_seconds / 60)}分`,
    color: PALETTE[i % PALETTE.length],
  }));

  const kpis = [
    {
      key: "total",
      label: "近 30 天總人流",
      value: fmt(data.kpi.total_visitors),
      tone: "accent" as const,
      icon: <Users size={14} />,
    },
    {
      key: "sales",
      label: "近 30 天銷售額",
      value: data.kpi.sales !== null ? fmt(data.kpi.sales) : "—",
      tone: "success" as const,
      icon: <TrendingUp size={14} />,
      hint: data.kpi.sales === null ? "尚無銷售資料" : undefined,
    },
    {
      key: "stay",
      label: "平均停留時間",
      value: (data.kpi.avg_stay_seconds / 60).toFixed(1),
      unit: "分",
      tone: "purple" as const,
      icon: <Timer size={14} />,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-[20px] font-bold text-foreground">商場總覽</div>
          <div className="text-[12px] text-muted-2 mt-1">
            {store.name} · {data.period}
          </div>
        </div>
        <div className="flex gap-2">
          {DATE_RANGES.map((t, i) => {
            const active = i === 1;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                className={
                  "px-3 py-1.5 rounded-md border text-xs transition " +
                  (active
                    ? "bg-accent text-white border-accent"
                    : "bg-surface text-muted border-border hover:bg-surface-2")
                }
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {kpis.map((k) => (
          <Stat
            key={k.key}
            label={k.label}
            value={k.value}
            unit={k.unit}
            tone={k.tone}
            icon={k.icon}
            hint={k.hint}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader title="每日人流趨勢" desc="近 30 天每日進店總人數" />
          <CardBody>
            <div className="h-40">
              <ChartContainer>
                <AreaChart data={flow30}>
                  <defs>
                    <linearGradient id="flowg" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#eef2f7" vertical={false} />
                  <XAxis
                    dataKey="d"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="人流"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#flowg)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
            <div className="flex gap-6 mt-3">
              {flowTotals.map((t) => (
                <div key={t.label}>
                  <div className="text-[10px] text-muted-2">{t.label}</div>
                  <div
                    className="text-sm font-bold"
                    style={{ color: t.color }}
                  >
                    {t.value}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="本週每日人流" />
          <CardBody>
            <div className="h-40">
              <ChartContainer>
                <BarChart data={weekFlow}>
                  <CartesianGrid stroke="#eef2f7" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader title="性別與年齡分佈" />
          <CardBody>
            <div className="flex gap-4 items-center mb-3">
              <div>
                <div className="text-[10px] text-muted-2">男性佔比</div>
                <div
                  className="text-xl font-bold"
                  style={{ color: "#3b82f6" }}
                >
                  {data.gender_split.male_pct}%
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <div className="text-[10px] text-muted-2">女性佔比</div>
                <div
                  className="text-xl font-bold"
                  style={{ color: "#f472b6" }}
                >
                  {data.gender_split.female_pct}%
                </div>
              </div>
            </div>
            <div className="h-36">
              <ChartContainer>
                <BarChart
                  data={ageGender}
                  layout="vertical"
                  barSize={10}
                  barGap={2}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="age"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="男性" fill="#3b82f6" radius={[2, 2, 2, 2]} />
                  <Bar dataKey="女性" fill="#f472b6" radius={[2, 2, 2, 2]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="顧客行為佔比" desc="前 5 種行為類型" />
          <CardBody className="flex gap-4 items-center">
            <div className="w-[110px] h-[110px] shrink-0">
              <ChartContainer>
                <PieChart>
                  <Pie
                    data={topTypes}
                    dataKey="pct"
                    innerRadius={30}
                    outerRadius={52}
                    paddingAngle={1}
                    stroke="none"
                  >
                    {topTypes.map((t) => (
                      <Cell key={t.label} fill={t.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
            <ul className="flex-1 space-y-1.5">
              {topTypes.map((t) => (
                <li
                  key={t.label}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-sm"
                      style={{ background: t.color }}
                    />
                    <span className="text-slate-600">{t.label}</span>
                  </span>
                  <span className="text-[12px] font-semibold text-foreground">
                    {t.pct}%
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="停留最久區域" />
          <CardBody className="flex gap-4 items-center">
            <div className="w-[110px] h-[110px] shrink-0">
              <ChartContainer>
                <PieChart>
                  <Pie
                    data={areaTime}
                    dataKey="pct"
                    innerRadius={30}
                    outerRadius={52}
                    paddingAngle={1}
                    stroke="none"
                  >
                    {areaTime.map((t) => (
                      <Cell key={t.label} fill={t.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
            <ul className="flex-1 space-y-1.5">
              {areaTime.map((t) => (
                <li
                  key={t.label}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-sm"
                      style={{ background: t.color }}
                    />
                    <span className="text-slate-600">{t.label}</span>
                  </span>
                  <span className="text-[12px] font-semibold text-foreground">
                    {t.pct}%
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="顧客行為漏斗" />
          <CardBody className="space-y-2.5">
            {funnel.map((row) => (
              <div key={row.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-[12px] text-slate-600">
                    {row.label}
                  </span>
                  <span className="text-[12px] font-semibold text-foreground">
                    {row.value.toLocaleString()}{" "}
                    <span className="text-muted-2 font-normal">
                      ({row.pct}%)
                    </span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${row.pct}%`,
                      background: row.color,
                      transition: "width 0.5s",
                    }}
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="同行人數與停留時間" />
          <CardBody>
            {companions.map((row, i) => (
              <div
                key={row.label}
                className={
                  "flex items-center gap-3 py-2.5 " +
                  (i < companions.length - 1
                    ? "border-b border-surface-2"
                    : "")
                }
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: row.color }}
                />
                <div className="flex-1">
                  <div className="text-[12px] text-slate-600">{row.label}</div>
                  <div className="text-[10px] text-muted-2">
                    {row.count} 人
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-bold text-foreground">
                    {row.avg}
                  </div>
                  <div className="text-[10px] text-muted-2">平均停留</div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function average(xs: number[]): number {
  if (xs.length === 0) return 0;
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}
