"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Stat } from "@/components/ui/Stat";
import {
  TopView3D,
} from "@/components/viz/TopView3D";
import {
  customers,
  areaRects,
  productMarkers,
  customerPath,
  entranceMarkers,
  areas,
} from "@/lib/mock";
import { fmt } from "@/lib/utils";
import { Users, Clock, Footprints } from "lucide-react";

const COLORS = [
  "var(--color-accent)",
  "var(--color-pink)",
  "var(--color-purple)",
  "var(--color-teal)",
  "var(--color-warning)",
];

export default function MainPage() {
  const [selected, setSelected] = useState(customers[0].id);
  const active = customers.find((c) => c.id === selected)!;

  return (
    <>
      <PageHeader
        eyebrow="MAINPAGE"
        title="主頁 · 3D 俯視與顧客追蹤"
        desc="展場即時俯視圖、顧客動線、區域停留與行為序列。"
      />

      <div className="p-6 grid grid-cols-12 gap-6">
        {/* 左側 – 顧客列表 */}
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader
            title="顧客列表"
            desc={`店內 ${customers.slice(0, 10).length} / ${customers.length} 位`}
          />
          <CardBody className="px-2 pb-2 max-h-[720px] overflow-y-auto">
            <ul className="space-y-1">
              {customers.slice(0, 10).map((c) => {
                const act = c.id === selected;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelected(c.id)}
                      className={
                        "w-full flex items-center gap-3 px-2.5 py-2 rounded-md transition text-left " +
                        (act ? "bg-accent/5 ring-1 ring-accent/30" : "hover:bg-surface-2")
                      }
                    >
                      <Avatar name={c.name} gender={c.gender} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-muted">
                          {c.gender === "f" ? "女" : "男"} · {c.age} ·{" "}
                          {c.companions} 人同行
                        </div>
                      </div>
                      <span className="text-[11px] text-muted tabular-nums">
                        {Math.round(c.stay / 60)}m
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        {/* 中央 – 3D 俯視 + 顧客細節 */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <Card>
            <CardHeader
              title="展場 3D 俯視圖"
              desc="即時位置與追蹤軌跡"
              action={
                <div className="flex gap-1 text-xs">
                  {["區域", "商品", "動線"].map((t, i) => (
                    <button
                      key={t}
                      className={
                        "px-2.5 py-1 rounded-md " +
                        (i === 2
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
              <TopView3D
                areas={areaRects}
                products={productMarkers}
                path={customerPath}
                entrances={entranceMarkers}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent" /> 軌跡起點
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-danger" /> 目前位置
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-[3px] rounded-full bg-accent" /> 行走路徑
                </span>
                <span className="ml-auto">追蹤時間 28m 14s · 8 個行為點</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="顧客行為時序"
              desc="依時間戳列出行為、持續時間"
            />
            <CardBody className="px-5 pb-5">
              <ol className="relative border-l border-border ml-2 space-y-3">
                {active.behaviors.map((b, i) => (
                  <li key={i} className="pl-4">
                    <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-accent ring-4 ring-accent/10" />
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{b.b}</div>
                      <span className="text-xs text-muted tabular-nums">
                        {b.ts} · {b.dur}s
                      </span>
                    </div>
                    <div className="text-xs text-muted">
                      順序 #{i + 1} · 持續時間 {b.dur} 秒
                    </div>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>

        {/* 右側 – 顧客細節 */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <Card>
            <CardHeader title="顧客細節" desc={active.entered} />
            <CardBody>
              <div className="aspect-[3/4] rounded-lg bg-surface-2 border border-border grid place-items-center mb-3 overflow-hidden relative">
                <Avatar name={active.name} gender={active.gender} size={96} />
                <span className="absolute top-2 left-2">
                  <Badge tone="accent">● LIVE</Badge>
                </span>
                <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/60 text-white px-1.5 py-0.5 rounded">
                  CAM-03
                </span>
              </div>
              <ul className="text-sm space-y-1.5">
                <Row label="姓名">{active.name}</Row>
                <Row label="性別">{active.gender === "f" ? "女" : "男"}</Row>
                <Row label="年齡層">{active.age}</Row>
                <Row label="攜伴人數">{active.companions} 位</Row>
                <Row label="停留時間">
                  {Math.floor(active.stay / 60)} 分 {active.stay % 60} 秒
                </Row>
                <Row label="興趣評估">
                  {active.interested ? (
                    <Badge tone="success">感興趣</Badge>
                  ) : (
                    <Badge>觀望</Badge>
                  )}
                </Row>
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="區域停留佔比" desc="該顧客各區域時間" />
            <CardBody>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={areas}
                      dataKey="stay"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={68}
                      paddingAngle={2}
                    >
                      {areas.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-xs">
                {areas.map((a, i) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: COLORS[i] }}
                      />
                      {a.name}
                    </span>
                    <span className="text-muted tabular-nums">{a.stay}s</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Stat label="在店" value={fmt(10)} tone="accent" icon={<Users size={12} />} />
            <Stat label="平均停留" value="18m" tone="default" icon={<Clock size={12} />} />
            <Stat label="最長動線" value="32m" tone="success" icon={<Footprints size={12} />} />
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm">{children}</span>
    </li>
  );
}
