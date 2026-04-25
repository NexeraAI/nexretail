"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { ChartContainer } from "@/components/viz/ChartContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Stat } from "@/components/ui/Stat";
import { TopView3D, type AreaRect, type Tone } from "@/components/viz/TopView3D";
import {
  ApiError,
  getStoreLayout,
  listVisitors,
  getVisitor,
  getVisitorPath,
  getVisitorAreaDwell,
  getVisitorBehaviors,
  type StoreLayout,
  type VisitorSummary,
  type VisitorDetail,
  type VisitorPath,
  type AreaDwell,
  type BehaviorEvent,
} from "@/lib/api";
import { fmt } from "@/lib/utils";
import { Users, Clock, Footprints } from "lucide-react";

const STORE_ID = 1;

const TONE_ORDER: Tone[] = ["accent", "pink", "purple", "warning", "teal", "success"];
const PIE_COLORS = [
  "var(--color-accent)",
  "var(--color-pink)",
  "var(--color-purple)",
  "var(--color-teal)",
  "var(--color-warning)",
];
const BEHAVIOR_LABELS: Record<string, string> = {
  enter: "進店",
  dwell: "駐足",
  browse: "駐足 / 瀏覽",
  touch: "觸摸商品",
  talk: "商談諮詢",
  test_ride: "試乘 / 試坐",
  qr_scan: "掃 QR",
};

function genderShort(g: "M" | "F" | "U"): "m" | "f" {
  return g === "F" ? "f" : "m";
}
function genderLabel(g: "M" | "F" | "U") {
  return g === "F" ? "女" : g === "M" ? "男" : "—";
}
function nameOf(v: { id: number }) {
  return `訪客 #${v.id}`;
}
function tsHHMM(iso: string) {
  return iso.slice(11, 16);
}
function fmtEntered(iso: string) {
  return iso.slice(0, 16).replace("T", " ").replace(/-/g, "/");
}
function trackDuration(p: VisitorPath | null): string {
  if (!p || p.points.length < 2) return "—";
  const start = new Date(p.points[0].t).getTime();
  const end = new Date(p.points[p.points.length - 1].t).getTime();
  const sec = Math.max(0, Math.round((end - start) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function MainPage() {
  const [layout, setLayout] = useState<StoreLayout | null>(null);
  const [visitors, setVisitors] = useState<VisitorSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<VisitorDetail | null>(null);
  const [path, setPath] = useState<VisitorPath | null>(null);
  const [areaDwell, setAreaDwell] = useState<AreaDwell[] | null>(null);
  const [behaviors, setBehaviors] = useState<BehaviorEvent[] | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getStoreLayout(STORE_ID),
      listVisitors(STORE_ID, { date: "month", size: 24 }),
    ])
      .then(([lay, page]) => {
        if (cancelled) return;
        setLayout(lay);
        setVisitors(page.data);
        if (page.data.length > 0) setSelected(page.data[0].id);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        setError(e instanceof ApiError ? e.message : "未預期錯誤");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selected == null) return;
    let cancelled = false;
    setDetail(null);
    setPath(null);
    setAreaDwell(null);
    setBehaviors(null);
    setDetailError(null);
    Promise.all([
      getVisitor(selected),
      getVisitorPath(selected),
      getVisitorAreaDwell(selected),
      getVisitorBehaviors(selected),
    ])
      .then(([d, p, a, b]) => {
        if (cancelled) return;
        setDetail(d);
        setPath(p);
        setAreaDwell(a);
        setBehaviors(b);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        setDetailError(e instanceof ApiError ? e.message : "載入訪客資料失敗");
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  if (error) {
    return <div className="p-6 text-sm text-danger">無法載入主頁：{error}</div>;
  }
  if (!layout || !visitors) {
    return <div className="p-6 text-sm text-muted">載入中…</div>;
  }

  const areaRects: AreaRect[] = layout.areas
    .filter((a) => a.polygon?.rect)
    .map((a, i) => {
      const [x, y, w, h] = a.polygon!.rect!;
      return {
        id: String(a.id),
        label: a.name,
        x,
        y,
        w,
        h,
        tone: TONE_ORDER[i % TONE_ORDER.length],
      };
    });

  const productMarkers = layout.products.map((p) => ({
    id: String(p.id),
    x: p.placement_x,
    y: p.placement_y,
    label: p.model ?? p.sku,
  }));

  const entranceMarkers = layout.entrances.map((e) => ({
    x: e.position_x,
    y: e.position_y,
    label: e.code,
  }));

  const pathXY = path?.points.map((p) => ({ x: p.x, y: p.y })) ?? [];
  const dwell = areaDwell ?? [];
  const visible = visitors.slice(0, 10);
  const activeInStore = visitors.filter((v) => v.status === "active").length;
  const avgStay =
    visitors.length === 0
      ? 0
      : Math.round(visitors.reduce((a, v) => a + v.stay_seconds, 0) / visitors.length);
  const longestStay = visitors.reduce((m, v) => Math.max(m, v.stay_seconds), 0);

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
            desc={`店內 ${activeInStore} / ${visitors.length} 位`}
          />
          <CardBody className="px-2 pb-2 max-h-[720px] overflow-y-auto">
            <ul className="space-y-1">
              {visible.map((c) => {
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
                      <Avatar name={nameOf(c)} gender={genderShort(c.gender)} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{nameOf(c)}</div>
                        <div className="text-[11px] text-muted">
                          {genderLabel(c.gender)} · {c.age_group} · {c.companion_count} 人同行
                        </div>
                      </div>
                      <span className="text-[11px] text-muted tabular-nums">
                        {Math.round(c.stay_seconds / 60)}m
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
                path={pathXY}
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
                <span className="ml-auto">
                  追蹤時間 {trackDuration(path)} · {behaviors?.length ?? 0} 個行為點
                </span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="顧客行為時序"
              desc="依時間戳列出行為、持續時間"
            />
            <CardBody className="px-5 pb-5">
              {behaviors && behaviors.length > 0 ? (
                <ol className="relative border-l border-border ml-2 space-y-3">
                  {behaviors.map((b, i) => (
                    <li key={b.id} className="pl-4">
                      <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-accent ring-4 ring-accent/10" />
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          {BEHAVIOR_LABELS[b.behavior_type] ?? b.behavior_type}
                        </div>
                        <span className="text-xs text-muted tabular-nums">
                          {tsHHMM(b.started_at)} · {b.duration_seconds}s
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        順序 #{i + 1} · 持續時間 {b.duration_seconds} 秒
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-sm text-muted">尚無行為紀錄</div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* 右側 – 顧客細節 */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <Card>
            <CardHeader
              title="顧客細節"
              desc={
                detailError
                  ? `載入失敗：${detailError}`
                  : detail
                    ? fmtEntered(detail.entered_at)
                    : "—"
              }
            />
            <CardBody>
              <div className="aspect-[3/4] rounded-lg bg-surface-2 border border-border grid place-items-center mb-3 overflow-hidden relative">
                <Avatar
                  name={detail ? nameOf(detail) : ""}
                  gender={detail ? genderShort(detail.gender) : "m"}
                  size={96}
                />
                <span className="absolute top-2 left-2">
                  <Badge tone="accent">● LIVE</Badge>
                </span>
                <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/60 text-white px-1.5 py-0.5 rounded">
                  CAM-03
                </span>
              </div>
              <ul className="text-sm space-y-1.5">
                <Row label="名稱">{detail ? nameOf(detail) : "—"}</Row>
                <Row label="性別">{detail ? genderLabel(detail.gender) : "—"}</Row>
                <Row label="年齡層">{detail?.age_group ?? "—"}</Row>
                <Row label="攜伴人數">
                  {detail ? `${detail.companion_count} 位` : "—"}
                </Row>
                <Row label="停留時間">
                  {detail
                    ? `${Math.floor(detail.stay_seconds / 60)} 分 ${detail.stay_seconds % 60} 秒`
                    : "—"}
                </Row>
                <Row label="進場入口">
                  {detail?.entrance ? `${detail.entrance.code} · ${detail.entrance.name}` : "—"}
                </Row>
                <Row label="興趣評估">
                  {detail ? (
                    detail.interested_flag ? (
                      <Badge tone="success">感興趣</Badge>
                    ) : (
                      <Badge>觀望</Badge>
                    )
                  ) : (
                    "—"
                  )}
                </Row>
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="區域停留佔比" desc="該顧客各區域時間" />
            <CardBody>
              <div className="h-40">
                <ChartContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dwell}
                      dataKey="dwell_seconds"
                      nameKey="area_name"
                      innerRadius={40}
                      outerRadius={68}
                      paddingAngle={2}
                    >
                      {dwell.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ChartContainer>
              </div>
              <ul className="mt-2 space-y-1 text-xs">
                {dwell.map((a, i) => (
                  <li key={a.area_id} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      {a.area_name}
                    </span>
                    <span className="text-muted tabular-nums">{a.dwell_seconds}s</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Stat label="在店" value={fmt(activeInStore)} tone="accent" icon={<Users size={12} />} />
            <Stat
              label="平均停留"
              value={`${Math.round(avgStay / 60)}m`}
              tone="default"
              icon={<Clock size={12} />}
            />
            <Stat
              label="最長停留"
              value={`${Math.round(longestStay / 60)}m`}
              tone="success"
              icon={<Footprints size={12} />}
            />
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
