"use client";

import { usePathname } from "next/navigation";

const PAGE_LABELS: Record<string, string> = {
  "/overview": "商場總覽",
  "/main": "主頁",
  "/area": "區域",
  "/heatmap": "熱力圖",
  "/product": "商品",
  "/customer": "顧客",
  "/entrance": "出入口",
  "/survey": "興趣評估",
  "/stores": "店舖總覽",
  "/survey-list": "問券列表",
};

function currentLabel(pathname: string) {
  const entry = Object.entries(PAGE_LABELS).find(
    ([href]) => pathname === href || pathname.startsWith(href + "/")
  );
  return entry ? entry[1] : "Retail AI";
}

export function Topbar() {
  const pathname = usePathname();
  const label = currentLabel(pathname);

  return (
    <header className="h-[52px] shrink-0 bg-surface border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-2">Retail AI</span>
        <span className="text-xs text-border">/</span>
        <span className="text-xs font-semibold text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-[11px] text-muted-2">
          即時更新 · 2026-04-23 14:42
        </div>
        <div
          className="w-2 h-2 rounded-full bg-success"
          style={{ boxShadow: "0 0 6px rgba(16,185,129,0.5)" }}
        />
      </div>
    </header>
  );
}
