"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { surveys, areas } from "@/lib/mock";
import { X, Phone, Mail, Search, FileDown, Video, QrCode } from "lucide-react";

export default function SurveyListPage() {
  const [open, setOpen] = useState<string | null>(null);
  const active = open ? surveys.find((s) => s.id === open) : null;

  return (
    <>
      <PageHeader
        eyebrow="SURVEY LIST"
        title="問券列表"
        desc="個別問卷顧客一覽，連結線下影像行為與線上答案。"
        action={
          <div className="flex gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-2"
              />
              <input
                placeholder="姓名 / 手機"
                className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-border bg-surface-2 w-52 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40"
              />
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-2">
              <FileDown size={14} /> 匯出
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        <Card>
          <CardHeader
            title="問券記錄"
            desc={`共 ${surveys.length} 筆 · 點擊列查看細節`}
          />
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-xs text-muted">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">姓名</th>
                  <th className="text-left font-medium px-3 py-2.5">手機號碼</th>
                  <th className="text-left font-medium px-3 py-2.5">電子信箱</th>
                  <th className="text-left font-medium px-3 py-2.5">同行人數</th>
                  <th className="text-left font-medium px-3 py-2.5">購車需求</th>
                  <th className="text-left font-medium px-3 py-2.5">服務人員</th>
                  <th className="text-left font-medium px-3 py-2.5">對應影像</th>
                  <th className="text-right font-medium px-5 py-2.5">建立日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {surveys.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-surface-2/60 cursor-pointer"
                    onClick={() => setOpen(s.id)}
                  >
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={s.name} size={28} />
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {s.phone}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted">
                      {s.email}
                    </td>
                    <td className="px-3 py-2.5">{s.companions} 位</td>
                    <td className="px-3 py-2.5">
                      <Badge
                        tone={
                          s.need === "換車"
                            ? "success"
                            : s.need === "試乘後決定"
                            ? "warning"
                            : "default"
                        }
                      >
                        {s.need}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">{s.staff}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {s.videoId}
                    </td>
                    <td className="px-5 py-2.5 text-right text-xs text-muted tabular-nums">
                      {s.created}
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
          onClick={() => setOpen(null)}
        >
          <aside
            className="absolute right-0 top-0 h-full w-[560px] bg-surface border-l border-border shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="h-14 flex items-center justify-between px-5 border-b border-border">
              <div>
                <div className="text-sm font-semibold">
                  {active.name} · 問券細節
                </div>
                <div className="text-xs text-muted">
                  建立 {active.created} · {active.videoId}
                </div>
              </div>
              <button
                onClick={() => setOpen(null)}
                className="p-1.5 rounded-md hover:bg-surface-2 text-muted"
              >
                <X size={16} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* 線下影像行為 */}
              <section>
                <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  線下影像行為
                </h4>
                <div className="aspect-video rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-800 grid place-items-center relative overflow-hidden">
                  <Video size={28} className="text-white/70" />
                  <div className="absolute top-2 left-2">
                    <Badge tone="accent">{active.videoId}</Badge>
                  </div>
                  <div className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/60 text-white px-1.5 py-0.5 rounded">
                    28m 14s
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <Kv label="影像 ID" value={active.videoId} />
                  <Kv label="日期" value={active.created} />
                  <Kv label="同行人數" value={`${active.companions} 位`} />
                  <Kv label="年齡層" value="35-44" />
                  <Kv label="性別" value="男" />
                  <Kv label="店員交談" value="12m 4s" />
                </div>
              </section>

              {/* 各區停留 */}
              <section>
                <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  各區停留時間
                </h4>
                <ul className="space-y-1.5">
                  {areas.map((a) => (
                    <li key={a.id}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span>{a.name}</span>
                        <span className="text-muted tabular-nums">
                          {a.stay}s
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${(a.stay / 450) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* QRCode 掃描 */}
              <section>
                <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  掃描 QR CODE 各時間
                </h4>
                <ul className="rounded-lg border border-border divide-y divide-border">
                  {[
                    { t: "10:14:22", v: "M3 — 規格頁" },
                    { t: "10:18:40", v: "i7 — 規格頁" },
                    { t: "10:32:08", v: "M4 CS — 試駕預約" },
                  ].map((e) => (
                    <li
                      key={e.t}
                      className="flex items-center gap-3 px-3 py-2 text-sm"
                    >
                      <QrCode size={14} className="text-muted" />
                      <span className="font-mono text-xs text-muted">{e.t}</span>
                      <span>{e.v}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 線上問券欄位 */}
              <section>
                <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  線上問券欄位
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Kv label="姓名" value={active.name} />
                  <Kv label="手機">
                    <span className="inline-flex items-center gap-1">
                      <Phone size={10} /> {active.phone}
                    </span>
                  </Kv>
                  <Kv label="信箱">
                    <span className="inline-flex items-center gap-1">
                      <Mail size={10} /> {active.email}
                    </span>
                  </Kv>
                  <Kv label="今日同行人數" value={`${active.companions} 位`} />
                  <Kv label="購車需求">
                    <Badge tone="success">{active.need}</Badge>
                  </Kv>
                  <Kv label="服務人員" value={active.staff} />
                </div>
                <div className="mt-2">
                  <div className="text-xs text-muted mb-1">感興趣項目</div>
                  <div className="flex flex-wrap gap-1.5">
                    {active.interested.map((it) => (
                      <Badge key={it} tone="accent">
                        {it}
                      </Badge>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function Kv({
  label,
  value,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-2/40 px-2.5 py-1.5">
      <div className="text-[10px] text-muted uppercase tracking-wider">
        {label}
      </div>
      <div className="text-sm font-medium">{value ?? children}</div>
    </div>
  );
}
