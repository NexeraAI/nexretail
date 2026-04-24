"use client";

import { useState } from "react";
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
  customers,
  demographics,
  behaviors,
  areas,
} from "@/lib/mock";
import { fmt } from "@/lib/utils";
import { Users, Clock, X } from "lucide-react";

const COLORS = [
  "var(--color-accent)",
  "var(--color-pink)",
  "var(--color-purple)",
  "var(--color-teal)",
  "var(--color-warning)",
];

export default function CustomerPage() {
  const [detail, setDetail] = useState<string | null>(null);
  const active = detail ? customers.find((c) => c.id === detail) : null;

  const companionData = demographics.companions.map((c) => ({
    name: c.name,
    value: c.value,
  }));

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
            value={fmt(2180)}
            tone="accent"
            icon={<Users size={14} />}
          />
          <Stat label="平均停留" value="24m" tone="default" icon={<Clock size={14} />} />
          <Stat label="同行平均" value="1.8" unit="人" tone="purple" />
          <Stat label="感興趣比例" value="31%" delta={4.2} tone="success" />
        </div>

        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 lg:col-span-5">
            <CardHeader title="性別與年齡佔比" desc="最多 5 種類型顯示" />
            <CardBody>
              <div className="h-64">
                <ChartContainer width="100%" height="100%">
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
                {behaviors.map((b) => {
                  const max = Math.max(...behaviors.map((x) => x.count));
                  return (
                    <li key={b.name}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span>{b.name}</span>
                        <span className="text-muted tabular-nums">
                          {fmt(b.count)} ({Math.round((b.count / max) * 100)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(b.count / max) * 100}%`,
                            background: `var(--color-${b.tone})`,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
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
                        <Cell key={i} fill={COLORS[i]} />
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
                        style={{ background: COLORS[i] }}
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
            desc={`${fmt(customers.length)} 位 · 點擊查看細節`}
            action={
              <div className="flex gap-1 text-xs">
                {["全部", "感興趣", "已填券", "未打開"].map((t, i) => (
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
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setDetail(c.id)}
                    className="hover:bg-surface-2/60 cursor-pointer"
                  >
                    <td className="px-5 py-2.5">
                      <Avatar name={c.name} gender={c.gender} size={30} />
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-xs text-muted">
                      {c.entered}
                    </td>
                    <td className="px-3 py-2.5">
                      {c.age} · {c.gender === "f" ? "女" : "男"}
                    </td>
                    <td className="px-3 py-2.5">{c.companions} 位</td>
                    <td className="px-3 py-2.5 space-x-1">
                      {c.interested && <Badge tone="success">感興趣</Badge>}
                      {c.survey && <Badge tone="accent">已填券</Badge>}
                      {!c.interested && !c.survey && <Badge>未打開</Badge>}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums">
                      {Math.floor(c.stay / 60)}m {c.stay % 60}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>

      {/* Detail drawer */}
      {active && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setDetail(null)}
        >
          <aside
            className="absolute right-0 top-0 h-full w-[420px] bg-surface border-l border-border shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="h-14 flex items-center justify-between px-5 border-b border-border">
              <div>
                <div className="text-sm font-semibold">顧客細節</div>
                <div className="text-xs text-muted">{active.entered}</div>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="p-1.5 rounded-md hover:bg-surface-2 text-muted"
              >
                <X size={16} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="aspect-[3/4] rounded-lg bg-surface-2 grid place-items-center relative border border-border">
                <Avatar name={active.name} gender={active.gender} size={120} />
                <span className="absolute top-2 left-2">
                  <Badge tone="accent">全身擷取</Badge>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="姓名" value={active.name} />
                <Field
                  label="性別"
                  value={active.gender === "f" ? "女" : "男"}
                />
                <Field label="年齡層" value={active.age} />
                <Field label="攜伴" value={`${active.companions} 位`} />
                <Field
                  label="停留時間"
                  value={`${Math.floor(active.stay / 60)}m ${active.stay % 60}s`}
                />
                <Field
                  label="興趣狀態"
                  value={active.interested ? "感興趣" : "觀望"}
                />
              </div>

              <section>
                <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  行為時序
                </h4>
                <ol className="relative border-l border-border ml-2 space-y-2.5">
                  {active.behaviors.map((b, i) => (
                    <li key={i} className="pl-4 text-sm">
                      <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-accent ring-4 ring-accent/10" />
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{b.b}</span>
                        <span className="text-xs text-muted tabular-nums">
                          {b.ts}
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        順序 #{i + 1} · 持續 {b.dur} 秒
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section>
                <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  各區域停留時間
                </h4>
                <ul className="space-y-1.5">
                  {areas.map((a, i) => (
                    <li key={a.id}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span>{a.name}</span>
                        <span className="text-muted">{a.stay}s</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(a.stay / 450) * 100}%`,
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
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
