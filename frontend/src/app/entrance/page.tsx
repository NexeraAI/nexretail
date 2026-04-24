"use client";

import { useState } from "react";
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
import { TopView3D } from "@/components/viz/TopView3D";
import {
  entrances,
  entranceSeries,
  areaRects,
  entranceMarkers,
} from "@/lib/mock";
import { fmt } from "@/lib/utils";
import { DoorOpen, TrendingUp, Users } from "lucide-react";

export default function EntrancePage() {
  const [mode, setMode] = useState<"all" | string>("all");
  const [selected, setSelected] = useState(entrances[0].id);
  const current = entrances.find((e) => e.id === selected)!;

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
              onClick={() => setMode(selected)}
              className={
                "px-2.5 py-1 rounded-md " +
                (mode !== "all"
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
              {entrances.map((e) => {
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
                          <div className="text-sm font-medium">{e.name}</div>
                          <div className="text-xs text-muted">
                            今日 {fmt(e.today)} 人
                          </div>
                        </div>
                      </div>
                      <Badge tone={act ? "accent" : "default"}>
                        {Math.round(e.conv * 100)}%
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
                <div className="text-xs text-muted mb-1">入口總數 (週單位)</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">4,880</span>
                  <span className="text-xs text-success">+8.1%</span>
                </div>
                <ul className="mt-2 space-y-0.5 text-[11px] text-muted">
                  <li className="flex justify-between">
                    <span>每週週間平均</span>
                    <span>620</span>
                  </li>
                  <li className="flex justify-between">
                    <span>每週週末平均</span>
                    <span>1,130</span>
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
                highlightId={current.id}
                height={280}
              />
            </CardBody>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat
              label={`${current.name} 今日人流`}
              value={fmt(current.today)}
              tone="accent"
              icon={<Users size={14} />}
            />
            <Stat
              label="週間平均"
              value={fmt(current.weekdayAvg)}
              tone="default"
            />
            <Stat
              label="週末平均"
              value={fmt(current.weekendAvg)}
              tone="warning"
            />
            <Stat
              label="轉換率"
              value={`${Math.round(current.conv * 100)}%`}
              tone="success"
              delta={4.2}
              icon={<TrendingUp size={14} />}
            />
          </div>

          <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-12 lg:col-span-7">
              <CardHeader
                title={mode === "all" ? "每日各入口人流" : `${current.name} — 男女人流`}
                desc="折線圖比較入口使用量"
              />
              <CardBody>
                <div className="h-64">
                  <ChartContainer width="100%" height="100%">
                    <LineChart data={entranceSeries.slice(-14)}>
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
                      <Line
                        type="monotone"
                        dataKey="E1"
                        stroke="#3b82f6"
                        strokeWidth={2.2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="E2"
                        stroke="#12b76a"
                        strokeWidth={2.2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="E3"
                        stroke="#ee5da1"
                        strokeWidth={2.2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              </CardBody>
            </Card>

            <Card className="col-span-12 lg:col-span-5">
              <CardHeader
                title="轉換率 · 展間 & 商談區"
                desc="進店後實際進入下一階段比例"
              />
              <CardBody>
                <div className="h-64">
                  <ChartContainer width="100%" height="100%">
                    <BarChart
                      data={entrances.map((e) => ({
                        name: e.id.toUpperCase(),
                        週間: Math.round(e.weekdayConv * 100),
                        週末: Math.round(e.weekendConv * 100),
                      }))}
                    >
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
                      {Math.round(current.conv * 100)}%
                    </span>
                  </span>
                  <Badge tone="success">
                    週末 vs 週間 +
                    {Math.round((current.weekendConv - current.weekdayConv) * 100)}
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
