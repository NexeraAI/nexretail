"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
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
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Stat } from "@/components/ui/Stat";
import { TopView3D } from "@/components/viz/TopView3D";
import {
  areas,
  areaRects,
  productMarkers,
  customers,
  weeklyTraffic,
  demographics,
} from "@/lib/mock";
import { fmt } from "@/lib/utils";
import { Users, Clock, Activity, Play } from "lucide-react";

export default function AreaPage() {
  const [selected, setSelected] = useState(areas[0].id);
  const area = areas.find((a) => a.id === selected)!;

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
              {areas.map((a) => {
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
                          style={{
                            background: `var(--color-${a.tone})`,
                          }}
                        />
                        <div className="text-left">
                          <div className="text-sm font-medium">{a.name}</div>
                          <div className="text-xs text-muted">{a.type}區</div>
                        </div>
                      </div>
                      <Badge tone={a.tone}>{fmt(a.count)}</Badge>
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
                desc={`${area.name} · CAM-0${(areas.findIndex((a) => a.id === area.id) % 4) + 1}`}
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
                  highlightId={area.id}
                  height={260}
                />
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat
              label="今日總人數"
              value={fmt(area.count)}
              tone="accent"
              icon={<Users size={14} />}
            />
            <Stat
              label="平均停留"
              value={`${area.stay}s`}
              tone="default"
              icon={<Clock size={14} />}
            />
            <Stat
              label="前 25% 停留"
              value={`${Math.round(area.stay * 1.8)}s`}
              tone="success"
              icon={<Activity size={14} />}
            />
            <Stat
              label="最多類型"
              value="男 35-44"
              tone="warning"
              hint="佔 28%"
            />
          </div>

          <Card>
            <CardHeader
              title="一週每小時人流密度"
              desc="數值越高 → 越擁擠"
            />
            <CardBody>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
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
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={demographics.gender}
                      dataKey="value"
                      innerRadius={40}
                      outerRadius={64}
                      paddingAngle={2}
                    >
                      {demographics.gender.map((g, i) => (
                        <Cell
                          key={i}
                          fill={i === 0 ? "#3b82f6" : "#ee5da1"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>
                  <span className="inline-block w-2 h-2 rounded-full bg-accent mr-1.5" />
                  男性 58%
                </span>
                <span>
                  <span className="inline-block w-2 h-2 rounded-full bg-pink mr-1.5" />
                  女性 42%
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">攜伴比例</span>
                  <span>62% (2 人以上)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">年齡最多</span>
                  <span>35-44 (32%)</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="停留顧客"
              desc={`${customers.length} 位 · 本區`}
            />
            <CardBody className="px-0 pb-0">
              <ul className="divide-y divide-border max-h-[360px] overflow-y-auto">
                {customers.slice(0, 12).map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-2"
                  >
                    <Avatar name={c.name} gender={c.gender} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{c.name}</div>
                      <div className="text-[11px] text-muted">
                        {c.entered.slice(-5)} · {c.age}
                      </div>
                    </div>
                    <span className="text-[11px] tabular-nums text-muted">
                      {Math.round(c.stay / 60)}m
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
