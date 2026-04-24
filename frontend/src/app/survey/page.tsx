"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { surveySummary, demographics } from "@/lib/mock";
import { fmt, pct } from "@/lib/utils";
import { ClipboardCheck, Target, HeartHandshake, UserCheck } from "lucide-react";

const COLORS = [
  "var(--color-accent)",
  "var(--color-teal)",
  "var(--color-purple)",
  "var(--color-pink)",
  "var(--color-warning)",
];

export default function SurveyPage() {
  const total = 418;
  const s = surveySummary;

  return (
    <>
      <PageHeader
        eyebrow="SURVEY"
        title="興趣評估 · 線下問券"
        desc="交叉比對影像行為分析與線下問券結果，找出高意向群體。"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat
            label="問卷填寫人數"
            value={fmt(s.total)}
            hint={pct(s.total, total) + " 佔進店"}
            tone="accent"
            icon={<ClipboardCheck size={14} />}
          />
          <Stat
            label="感興趣人數"
            value={fmt(s.interested)}
            hint={pct(s.interested, s.total) + " 填券中"}
            tone="success"
            icon={<HeartHandshake size={14} />}
          />
          <Stat
            label="感興趣且有賞車"
            value={fmt(s.interestedWithView)}
            hint={pct(s.interestedWithView, s.interested)}
            tone="warning"
            icon={<Target size={14} />}
          />
          <Stat
            label="成交潛客"
            value={fmt(58)}
            hint="需再次商談"
            tone="default"
            icon={<UserCheck size={14} />}
          />
        </div>

        {/* 產品偏好 + 性別佔比 */}
        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 lg:col-span-7">
            <CardHeader
              title="產品偏好"
              desc="填券者勾選感興趣的商品，可同時選多項"
            />
            <CardBody>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={s.preferences}
                    layout="vertical"
                    barSize={16}
                  >
                    <CartesianGrid stroke="#eef0f5" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      width={72}
                    />
                    <Tooltip
                      formatter={(v) =>
                        `${v} 人 (${pct(Number(v), s.total)})`
                      }
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {s.preferences.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card className="col-span-12 lg:col-span-5">
            <CardHeader
              title="填券 / 感興趣 · 男女年齡佔比"
              desc="將高意向族群與進店者比較"
            />
            <CardBody>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demographics.ageGender}>
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
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                    <Bar
                      dataKey="男性"
                      stackId="a"
                      fill="#3b82f6"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="女性"
                      stackId="a"
                      fill="#ee5da1"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <MiniPie label="男性佔比" value={58} color="#3b82f6" />
                <MiniPie label="女性佔比" value={42} color="#ee5da1" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 行為佔比 */}
        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 lg:col-span-7">
            <CardHeader
              title="感興趣 vs 一般填券 行為佔比"
              desc="確認高意向者在各商品的互動密度"
            />
            <CardBody>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={s.behaviorPct}>
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
                    <Bar
                      dataKey="filled"
                      name="一般填券"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="interested"
                      name="感興趣族群"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card className="col-span-12 lg:col-span-5">
            <CardHeader
              title="行為平均時間"
              desc="秒 — 比較感興趣者與整體"
            />
            <CardBody>
              <ul className="space-y-3">
                {s.behaviorDur.map((b) => {
                  const max = Math.max(
                    ...s.behaviorDur.map((x) => Math.max(x.interested, x.all))
                  );
                  return (
                    <li key={b.name}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="font-medium">{b.name}</span>
                        <span className="text-muted">
                          {b.interested}s · {b.all}s
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${(b.interested / max) * 100}%` }}
                          />
                        </div>
                        <Badge tone="accent">感興趣</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-muted-2"
                            style={{ width: `${(b.all / max) * 100}%` }}
                          />
                        </div>
                        <Badge>整體</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function MiniPie({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const data = [
    { v: value, c: color },
    { v: 100 - value, c: "#e2e8f0" },
  ];
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
      <div className="w-12 h-12 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="v"
              innerRadius={14}
              outerRadius={22}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.c} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <div className="text-xs text-muted">{label}</div>
        <div className="text-base font-semibold">{value}%</div>
      </div>
    </div>
  );
}
