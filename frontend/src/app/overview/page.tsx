"use client";

import {
  ResponsiveContainer,
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
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Users, TrendingUp, Timer, ClipboardList } from "lucide-react";

const DATE_RANGES = ["今日", "本月", "自訂"] as const;

const flow30 = [
  320, 410, 380, 520, 490, 610, 580, 720, 680, 750,
  820, 790, 850, 910, 880, 920, 980, 1020, 960, 1050,
  1100, 1080, 1150, 1200, 1180, 1220, 1300, 1250, 1320, 1400,
].map((v, i) => ({ d: `04/${String(i + 1).padStart(2, "0")}`, 人流: v }));

const weekFlow = [
  { day: "一", value: 312 },
  { day: "二", value: 278 },
  { day: "三", value: 345 },
  { day: "四", value: 401 },
  { day: "五", value: 523 },
  { day: "六", value: 687 },
  { day: "日", value: 598 },
];

const ageGender = [
  { age: "<18", 男性: 12, 女性: 8 },
  { age: "18-24", 男性: 45, 女性: 38 },
  { age: "25-34", 男性: 89, 女性: 72 },
  { age: "35-44", 男性: 76, 女性: 68 },
  { age: "45-54", 男性: 54, 女性: 61 },
  { age: "55+", 男性: 32, 女性: 28 },
];

const topTypes = [
  { label: "瀏覽商品", pct: 38, color: "#3b82f6" },
  { label: "觸摸商品", pct: 24, color: "#6366f1" },
  { label: "商談諮詢", pct: 18, color: "#8b5cf6" },
  { label: "填寫問卷", pct: 12, color: "#a78bfa" },
  { label: "其他", pct: 8, color: "#c4b5fd" },
];

const areaTime = [
  { label: "展示區A", pct: 31, color: "#3b82f6" },
  { label: "展示區B", pct: 22, color: "#6366f1" },
  { label: "商談區", pct: 20, color: "#8b5cf6" },
  { label: "入口大廳", pct: 15, color: "#f59e0b" },
  { label: "其他", pct: 12, color: "#e2e8f0" },
];

const funnel = [
  { label: "進店總人流", value: 1247, pct: 100, color: "#3b82f6" },
  { label: "賞車行為人數", value: 842, pct: 67.5, color: "#6366f1" },
  { label: "觸摸商品人數", value: 523, pct: 41.9, color: "#8b5cf6" },
  { label: "商談/試乘人數", value: 201, pct: 16.1, color: "#a78bfa" },
  { label: "填寫問卷人數", value: 312, pct: 25.0, color: "#f59e0b" },
];

const companions = [
  { label: "獨自一人", count: 412, avg: "12.4分", color: "#3b82f6" },
  { label: "2人同行", count: 389, avg: "21.8分", color: "#6366f1" },
  { label: "3人同行", count: 267, avg: "26.3分", color: "#8b5cf6" },
  { label: "4人以上", count: 179, avg: "31.7分", color: "#f59e0b" },
];

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4 px-5 pt-4">
      <div>
        <div className="text-[16px] font-bold text-foreground leading-tight">
          {title}
        </div>
        {subtitle && (
          <div className="text-[12px] text-muted-2 mt-0.5">{subtitle}</div>
        )}
      </div>
      {action}
    </div>
  );
}

export default function OverviewPage() {
  return (
    <div className="p-6">
      {/* Title + date range */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-[20px] font-bold text-foreground">商場總覽</div>
          <div className="text-[12px] text-muted-2 mt-1">
            台北信義旗艦店 · 2026年4月
          </div>
        </div>
        <div className="flex gap-2">
          {DATE_RANGES.map((t, i) => (
            <button
              key={t}
              className={
                "px-3 py-1.5 rounded-md border text-xs transition " +
                (i === 1
                  ? "bg-accent text-white border-accent"
                  : "bg-surface text-muted border-border hover:bg-surface-2")
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Stat
          label="今日總人數"
          value="1,247"
          delta={5.7}
          tone="accent"
          icon={<Users size={14} />}
          hint="當月平均 1,180"
        />
        <Stat
          label="今日銷售額"
          value="$86.4萬"
          delta={6.4}
          tone="success"
          icon={<TrendingUp size={14} />}
          hint="當月平均 $81.2萬"
        />
        <Stat
          label="平均停留時間"
          value="18.3"
          unit="分"
          delta={2.1}
          tone="purple"
          icon={<Timer size={14} />}
          hint="高於平均 542 人"
        />
        <Stat
          label="問卷填寫人數"
          value="312"
          delta={-3.2}
          tone="warning"
          icon={<ClipboardList size={14} />}
          hint="佔總人流 25.0%"
        />
      </div>

      {/* Row 1: daily flow + weekly flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <SectionHeader title="每日人流趨勢" subtitle="本月每日進店總人數" />
          <div className="px-5 pb-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
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
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-3">
              {[
                ["總人流", "36,840", "#3b82f6"],
                ["週間均", "1,082", "#6366f1"],
                ["週末均", "1,418", "#8b5cf6"],
              ].map(([l, v, c]) => (
                <div key={l}>
                  <div className="text-[10px] text-muted-2">{l}</div>
                  <div
                    className="text-sm font-bold"
                    style={{ color: c as string }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="本週每日人流" />
          <div className="px-5 pb-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
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
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: gender-age + behavior donut + area donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card>
          <SectionHeader title="性別與年齡分佈" />
          <div className="px-5 pb-4">
            <div className="flex gap-4 items-center mb-3">
              <div>
                <div className="text-[10px] text-muted-2">男性佔比</div>
                <div
                  className="text-xl font-bold"
                  style={{ color: "#3b82f6" }}
                >
                  52%
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <div className="text-[10px] text-muted-2">女性佔比</div>
                <div
                  className="text-xl font-bold"
                  style={{ color: "#f472b6" }}
                >
                  48%
                </div>
              </div>
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
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
                  <Bar
                    dataKey="男性"
                    fill="#3b82f6"
                    radius={[2, 2, 2, 2]}
                  />
                  <Bar
                    dataKey="女性"
                    fill="#f472b6"
                    radius={[2, 2, 2, 2]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="顧客行為佔比" subtitle="前 5 種行為類型" />
          <div className="px-5 pb-4 flex gap-4 items-center">
            <div className="w-[110px] h-[110px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
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
              </ResponsiveContainer>
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
                    <span className="text-[#475569]">{t.label}</span>
                  </span>
                  <span className="text-[12px] font-semibold text-foreground">
                    {t.pct}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <SectionHeader title="停留最久區域" />
          <div className="px-5 pb-4 flex gap-4 items-center">
            <div className="w-[110px] h-[110px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
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
              </ResponsiveContainer>
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
                    <span className="text-[#475569]">{t.label}</span>
                  </span>
                  <span className="text-[12px] font-semibold text-foreground">
                    {t.pct}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Row 3: funnel + companion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionHeader title="顧客行為漏斗" />
          <div className="px-5 pb-4 space-y-2.5">
            {funnel.map((row) => (
              <div key={row.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-[12px] text-[#475569]">
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
          </div>
        </Card>

        <Card>
          <SectionHeader title="同行人數與停留時間" />
          <div className="px-5 pb-4">
            {companions.map((row, i) => (
              <div
                key={row.label}
                className={
                  "flex items-center gap-3 py-2.5 " +
                  (i < companions.length - 1
                    ? "border-b border-[#f8fafc]"
                    : "")
                }
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: row.color }}
                />
                <div className="flex-1">
                  <div className="text-[12px] text-[#475569]">{row.label}</div>
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
          </div>
        </Card>
      </div>
    </div>
  );
}
