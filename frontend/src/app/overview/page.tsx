"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import {
  trafficSeries,
  salesSeries,
  behaviors,
  demographics,
  areas,
} from "@/lib/mock";
import { fmt } from "@/lib/utils";
import { Users, TrendingUp, Timer, Car, Eye, MessageSquare } from "lucide-react";

const PIE_COLORS = [
  "var(--color-accent)",
  "var(--color-pink)",
  "var(--color-purple)",
  "var(--color-teal)",
  "var(--color-warning)",
];

export default function OverviewPage() {
  const totalBehavior = behaviors.reduce((a, b) => a + b.count, 0);

  return (
    <>
      <PageHeader
        eyebrow="OVERVIEW"
        title="商場總覽"
        desc="全店營運即時指標、當月表現與顧客結構。"
        action={
          <div className="flex items-center gap-2">
            <Badge tone="success">● 即時</Badge>
            <span className="text-xs text-muted">更新於 3 秒前</span>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat
            label="今日總人數"
            value={fmt(2180)}
            unit="人"
            delta={12.4}
            tone="accent"
            icon={<Users size={14} />}
            hint="vs 昨日"
          />
          <Stat
            label="當月平均人流"
            value={fmt(1820)}
            unit="人/日"
            delta={-3.1}
            tone="default"
            icon={<TrendingUp size={14} />}
            hint="vs 上月"
          />
          <Stat
            label="今日銷售額"
            value="$682K"
            delta={8.2}
            tone="success"
            icon={<Car size={14} />}
            hint="新台幣"
          />
          <Stat
            label="當月平均銷售"
            value="$512K"
            delta={5.6}
            tone="warning"
            icon={<Timer size={14} />}
            hint="日均"
          />
        </div>

        {/* 折線圖 */}
        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 lg:col-span-8">
            <CardHeader
              title="人流 vs 去年同期"
              desc="以小時顯示當日進店人次"
              action={
                <div className="flex gap-1 text-xs">
                  {["今日", "週", "月"].map((t, i) => (
                    <button
                      key={t}
                      className={
                        "px-2.5 py-1 rounded-md " +
                        (i === 0
                          ? "bg-accent text-white"
                          : "text-muted hover:bg-surface-2")
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              }
            />
            <CardBody>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trafficSeries}>
                    <defs>
                      <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2f68ff" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#2f68ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#eef0f5" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 11, fill: "#98a2b3" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#98a2b3" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e5e7ef",
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Area
                      type="monotone"
                      dataKey="人流"
                      stroke="#2f68ff"
                      strokeWidth={2}
                      fill="url(#g1)"
                    />
                    <Line
                      type="monotone"
                      dataKey="去年同期"
                      stroke="#98a2b3"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card className="col-span-12 lg:col-span-4">
            <CardHeader title="性別 · 年齡佔比" desc="當日進店顧客結構" />
            <CardBody>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={demographics.ageGender}
                    layout="vertical"
                    barSize={12}
                  >
                    <CartesianGrid stroke="#eef0f5" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#98a2b3" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="age"
                      type="category"
                      tick={{ fontSize: 11, fill: "#667085" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Bar dataKey="男性" stackId="a" fill="#2f68ff" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="女性" stackId="a" fill="#ee5da1" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>
                  <span className="inline-block w-2 h-2 rounded-full bg-accent mr-1" />
                  男性 58%
                </span>
                <span>
                  <span className="inline-block w-2 h-2 rounded-full bg-pink mr-1" />
                  女性 42%
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 銷售 + 行為 */}
        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 lg:col-span-7">
            <CardHeader title="銷售額 vs 去年同期" desc="最近 30 日日均" />
            <CardBody>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesSeries}>
                    <CartesianGrid stroke="#eef0f5" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#98a2b3" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#98a2b3" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      formatter={(v) => `$${fmt(Number(v))}`}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e5e7ef",
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Line
                      type="monotone"
                      dataKey="銷售額"
                      stroke="#12b76a"
                      strokeWidth={2.4}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="去年同期"
                      stroke="#98a2b3"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card className="col-span-12 lg:col-span-5">
            <CardHeader title="顧客行為佔比" desc="各行為人次 / 平均持續時間" />
            <CardBody>
              <ul className="space-y-3">
                {behaviors.map((b) => (
                  <li key={b.name}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge tone={b.tone}>{b.name}</Badge>
                        <span className="text-muted tabular-nums">
                          {fmt(b.count)} 人
                        </span>
                      </div>
                      <span className="text-muted">
                        {b.avg ? `${b.avg}s` : "—"}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent/80"
                        style={{
                          width: `${(b.count / totalBehavior) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        {/* Pies 1 */}
        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 md:col-span-4">
            <CardHeader
              title="同行人數佔比"
              desc="獨自前往 vs 結伴比例"
              action={<Eye size={14} className="text-muted-2" />}
            />
            <CardBody>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={demographics.companions}
                      dataKey="value"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {demographics.companions.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                {demographics.companions.map((c, i) => (
                  <li key={c.name} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: PIE_COLORS[i] }}
                      />
                      {c.name}
                    </span>
                    <span className="text-muted tabular-nums">{c.value}%</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card className="col-span-12 md:col-span-4">
            <CardHeader
              title="停留最久區域"
              desc="前 5 區域佔比 (平均停留秒數)"
              action={<MessageSquare size={14} className="text-muted-2" />}
            />
            <CardBody>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={areas}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {areas.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, _n, e) =>
                        `${fmt(Number(v))} 人 (${(e?.payload as { stay?: number } | undefined)?.stay ?? 0}s)`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="grid grid-cols-1 gap-1 text-xs">
                {areas.map((a, i) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: PIE_COLORS[i] }}
                      />
                      {a.name}
                    </span>
                    <span className="text-muted tabular-nums">
                      {a.stay}s · {fmt(a.count)} 人
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card className="col-span-12 md:col-span-4">
            <CardHeader title="高於平均停留時間" desc="問券填寫者行為比較" />
            <CardBody>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="30%"
                    outerRadius="95%"
                    data={[
                      { name: "高於平均", value: 68, fill: "#2f68ff" },
                      { name: "平均", value: 52, fill: "#7a5af8" },
                      { name: "低於平均", value: 34, fill: "#ee5da1" },
                    ]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar background dataKey="value" cornerRadius={6} />
                    <Tooltip />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-muted text-center mt-1">
                佔比以 <b>188</b> 名填券顧客為基準
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
