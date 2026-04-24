"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Heatmap } from "@/components/viz/Heatmap";
import { heatmapPoints, behaviorHeatmap } from "@/lib/mock";
import { Calendar, Cpu, UsersRound, ToggleRight } from "lucide-react";

const DEVICES = [
  { id: "cam-01", label: "CAM-01 · 大門" },
  { id: "cam-02", label: "CAM-02 · A 展車" },
  { id: "cam-03", label: "CAM-03 · B 配件" },
  { id: "cam-04", label: "CAM-04 · C 商談" },
];

export default function HeatmapPage() {
  const [device, setDevice] = useState(DEVICES[0].id);
  const [gender, setGender] = useState<"all" | "m" | "f">("all");
  const [age, setAge] = useState<"all" | "18-24" | "25-34" | "35-44" | "45-54" | "55+">(
    "all"
  );
  const [split, setSplit] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="HEATMAP"
        title="熱力圖 · 路徑與行為密度"
        desc="跨相機、年齡、性別過濾，觀察顧客熱點分布。"
      />

      <div className="p-6 grid grid-cols-12 gap-6">
        {/* 過濾器 */}
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader title="過濾器" desc="調整以重新渲染" />
          <CardBody className="space-y-5">
            <Filter label="設備" icon={<Cpu size={12} />}>
              <div className="grid grid-cols-1 gap-1">
                {DEVICES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDevice(d.id)}
                    className={
                      "px-3 py-1.5 text-xs rounded-md text-left " +
                      (device === d.id
                        ? "bg-accent text-white"
                        : "bg-surface-2 hover:bg-border")
                    }
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </Filter>
            <Filter label="性別" icon={<UsersRound size={12} />}>
              <div className="grid grid-cols-3 gap-1">
                {[
                  ["all", "全部"],
                  ["m", "男性"],
                  ["f", "女性"],
                ].map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setGender(k as "all" | "m" | "f")}
                    className={
                      "px-2 py-1.5 text-xs rounded-md " +
                      (gender === k
                        ? "bg-accent text-white"
                        : "bg-surface-2 hover:bg-border")
                    }
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Filter>
            <Filter label="年齡層">
              <div className="grid grid-cols-3 gap-1">
                {[
                  ["all", "全部"],
                  ["18-24", "18-24"],
                  ["25-34", "25-34"],
                  ["35-44", "35-44"],
                  ["45-54", "45-54"],
                  ["55+", "55+"],
                ].map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() =>
                      setAge(k as "all" | "18-24" | "25-34" | "35-44" | "45-54" | "55+")
                    }
                    className={
                      "px-2 py-1.5 text-xs rounded-md " +
                      (age === k
                        ? "bg-accent text-white"
                        : "bg-surface-2 hover:bg-border")
                    }
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Filter>
            <Filter label="顯示" icon={<ToggleRight size={12} />}>
              <label className="flex items-center justify-between text-sm cursor-pointer">
                <span>分割畫面</span>
                <input
                  type="checkbox"
                  checked={split}
                  onChange={(e) => setSplit(e.target.checked)}
                  className="accent-accent"
                />
              </label>
            </Filter>
            <Filter label="日期範圍" icon={<Calendar size={12} />}>
              <DateRange />
            </Filter>
          </CardBody>
        </Card>

        {/* 熱力圖顯示 */}
        <div className={"col-span-12 lg:col-span-9 " + (split ? "grid grid-cols-1 gap-6" : "space-y-6")}>
          <Card>
            <CardHeader
              title="路徑熱力圖"
              desc={`${DEVICES.find((d) => d.id === device)?.label}`}
              action={<Badge tone="warning">● 即時熱點</Badge>}
            />
            <CardBody>
              <Heatmap points={heatmapPoints} mode="path" />
              <Legend />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="行為熱力圖"
              desc="疊加觸摸、商談、試乘行為密度"
              action={<Badge tone="accent">行為密度</Badge>}
            />
            <CardBody>
              <Heatmap points={behaviorHeatmap} mode="behavior" />
              <Legend tone="accent" />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Filter({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted mb-2">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function DateRange() {
  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between text-muted">
        <span>2026/04/15</span>
        <span>2026/04/22</span>
      </div>
      <div className="relative h-1.5 bg-surface-2 rounded-full">
        <div className="absolute inset-y-0 left-[20%] right-[15%] bg-accent rounded-full" />
        <span className="absolute top-1/2 -translate-y-1/2 left-[20%] -translate-x-1/2 w-3 h-3 bg-accent rounded-full ring-2 ring-white" />
        <span className="absolute top-1/2 -translate-y-1/2 left-[85%] -translate-x-1/2 w-3 h-3 bg-accent rounded-full ring-2 ring-white" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Badge>最近 7 日</Badge>
        <button className="text-accent hover:underline text-xs">自訂</button>
      </div>
    </div>
  );
}

function Legend({ tone = "warning" as "warning" | "accent" }: { tone?: "warning" | "accent" }) {
  const a = tone === "warning" ? "#f79009" : "#3b82f6";
  return (
    <div className="mt-3 flex items-center gap-3 text-xs text-muted">
      <div
        className="h-2.5 flex-1 rounded-full"
        style={{
          background: `linear-gradient(90deg, #11131a 0%, ${a}55 40%, ${a} 100%)`,
        }}
      />
      <span>低</span>
      <span>中</span>
      <span>高</span>
    </div>
  );
}
