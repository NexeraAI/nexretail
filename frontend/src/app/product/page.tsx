"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
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
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { TopView3D } from "@/components/viz/TopView3D";
import {
  products,
  areaRects,
  productMarkers,
  demographics,
  customers,
} from "@/lib/mock";
import { fmt } from "@/lib/utils";
import { ShoppingBag, Clock, Hand, Eye } from "lucide-react";

const AGE_COLORS = [
  "var(--color-accent)",
  "var(--color-teal)",
  "var(--color-purple)",
  "var(--color-pink)",
  "var(--color-warning)",
];

export default function ProductPage() {
  const [selected, setSelected] = useState(products[0].id);
  const product = products.find((p) => p.id === selected)!;

  const viewByAge = [
    { age: "18-24", sec: 42 },
    { age: "25-34", sec: 78 },
    { age: "35-44", sec: product.avgView + 12 },
    { age: "45-54", sec: 62 },
    { age: "55+", sec: 34 },
  ];

  const interactionMix = [
    { name: "觸摸商品", value: 42 },
    { name: "拍照", value: 18 },
    { name: "開門試坐", value: 22 },
    { name: "詢問規格", value: 18 },
  ];

  return (
    <>
      <PageHeader
        eyebrow="PRODUCT"
        title="商品分析"
        desc="檢視各商品觀看秒數、互動行為與顧客樣貌。"
      />

      <div className="p-6 grid grid-cols-12 gap-6">
        {/* 商品列表 */}
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader title="商品列表" desc={`${products.length} 件展示商品`} />
          <CardBody className="px-2 pb-2">
            <ul className="space-y-1">
              {products.map((p) => {
                const act = p.id === selected;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => setSelected(p.id)}
                      className={
                        "w-full flex items-center gap-3 px-2.5 py-2 rounded-md transition " +
                        (act
                          ? "bg-accent/5 ring-1 ring-accent/30"
                          : "hover:bg-surface-2")
                      }
                    >
                      <div className="w-10 h-10 rounded-md bg-surface-2 grid place-items-center">
                        <ShoppingBag size={16} className="text-muted" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-muted">
                          {p.model} · 觀看 {p.avgView}s
                        </div>
                      </div>
                      <Badge tone={act ? "accent" : "default"}>
                        {p.topAge}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        {/* 主要 */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat
              label="互動總人數"
              value={fmt(product.touches)}
              tone="accent"
              icon={<Hand size={14} />}
            />
            <Stat
              label="平均觀看"
              value={`${product.avgView}s`}
              tone="default"
              icon={<Eye size={14} />}
            />
            <Stat
              label="商品區停留"
              value={`${product.dwell}s`}
              tone="warning"
              icon={<Clock size={14} />}
            />
            <Stat
              label="前 25% 停留"
              value={`${Math.round(product.dwell * 1.7)}s`}
              tone="success"
              hint="重度關注顧客"
            />
          </div>

          <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-12 lg:col-span-7">
              <CardHeader
                title="商品俯視位置"
                desc="展場中商品擺放"
              />
              <CardBody>
                <TopView3D
                  areas={areaRects}
                  products={productMarkers.map((p) => ({
                    ...p,
                    label: p.id === selected.slice(0, 2) ? `● ${p.label}` : p.label,
                  }))}
                  height={260}
                />
              </CardBody>
            </Card>

            <Card className="col-span-12 lg:col-span-5">
              <CardHeader title="商品照片" desc={product.name} />
              <CardBody>
                <div className="aspect-video rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 border border-border grid place-items-center relative overflow-hidden">
                  <svg viewBox="0 0 320 180" className="w-full h-full">
                    <defs>
                      <linearGradient id="car" x1="0" x2="1">
                        <stop offset="0%" stopColor="#1c2030" />
                        <stop offset="100%" stopColor="#2f68ff" />
                      </linearGradient>
                    </defs>
                    <rect
                      x={40}
                      y={80}
                      width={240}
                      height={50}
                      rx={24}
                      fill="url(#car)"
                    />
                    <rect
                      x={80}
                      y={60}
                      width={160}
                      height={40}
                      rx={18}
                      fill="url(#car)"
                    />
                    <circle cx={90} cy={130} r={14} fill="#101828" />
                    <circle cx={230} cy={130} r={14} fill="#101828" />
                    <circle cx={90} cy={130} r={6} fill="#ffffff" />
                    <circle cx={230} cy={130} r={6} fill="#ffffff" />
                  </svg>
                  <div className="absolute top-2 left-2">
                    <Badge tone="accent">{product.model}</Badge>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs">觀看最久年齡層</span>
                    <Badge tone="purple">{product.topAge}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs">男性觀看比例</span>
                    <span className="text-sm tabular-nums">
                      {Math.round(product.maleRatio * 100)}%
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-12 lg:col-span-5">
              <CardHeader
                title="各年齡層平均觀看秒數"
                desc="找出最投入的目標客群"
              />
              <CardBody>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={viewByAge}>
                      <CartesianGrid stroke="#eef0f5" vertical={false} />
                      <XAxis
                        dataKey="age"
                        tick={{ fontSize: 11, fill: "#98a2b3" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#98a2b3" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}s`}
                      />
                      <Tooltip formatter={(v) => `${v} 秒`} />
                      <Bar dataKey="sec" radius={[6, 6, 0, 0]}>
                        {viewByAge.map((_, i) => (
                          <Cell key={i} fill={AGE_COLORS[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card className="col-span-12 lg:col-span-4">
              <CardHeader title="互動動作佔比" desc="顧客與商品互動類型" />
              <CardBody>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={interactionMix}
                        dataKey="value"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {interactionMix.map((_, i) => (
                          <Cell key={i} fill={AGE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="grid grid-cols-2 gap-y-1 gap-x-3 text-xs">
                  {interactionMix.map((i, k) => (
                    <li
                      key={i.name}
                      className="flex items-center justify-between"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: AGE_COLORS[k] }}
                        />
                        {i.name}
                      </span>
                      <span className="text-muted">{i.value}%</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            <Card className="col-span-12 lg:col-span-3">
              <CardHeader title="性別年齡佔比" desc="觀看該商品顧客" />
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
                        {demographics.gender.map((_, i) => (
                          <Cell
                            key={i}
                            fill={i === 0 ? "#2f68ff" : "#ee5da1"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-1 text-xs">
                  {demographics.ageGender.map((a) => (
                    <li key={a.age} className="flex items-center justify-between">
                      <span className="text-muted">{a.age}</span>
                      <span className="tabular-nums">
                        男 {a.男性} · 女 {a.女性}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>

          {/* 停留列表 */}
          <Card>
            <CardHeader
              title="商品區停留顧客"
              desc={`最近 24 小時 · ${customers.length} 位`}
              action={<Badge tone="accent">Top 停留</Badge>}
            />
            <CardBody className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-xs text-muted">
                  <tr>
                    <th className="text-left font-medium px-5 py-2.5">頭像</th>
                    <th className="text-left font-medium px-3 py-2.5">時間戳</th>
                    <th className="text-left font-medium px-3 py-2.5">年齡層</th>
                    <th className="text-left font-medium px-3 py-2.5">性別</th>
                    <th className="text-right font-medium px-5 py-2.5">停留時間</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.slice(0, 8).map((c) => (
                    <tr key={c.id} className="hover:bg-surface-2/60">
                      <td className="px-5 py-2.5">
                        <Avatar name={c.name} gender={c.gender} size={28} />
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-xs text-muted">
                        {c.entered}
                      </td>
                      <td className="px-3 py-2.5">{c.age}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={c.gender === "f" ? "pink" : "accent"}>
                          {c.gender === "f" ? "女" : "男"}
                        </Badge>
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
      </div>
    </>
  );
}
