"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/overview", label: "商場總覽", sub: "Overview", icon: "▦" },
  { href: "/main", label: "主頁", sub: "Main Page", icon: "⌂" },
  { href: "/area", label: "區域", sub: "Area", icon: "◫" },
  { href: "/heatmap", label: "熱力圖", sub: "Heatmap", icon: "◉" },
  { href: "/product", label: "商品", sub: "Product", icon: "◻" },
  { href: "/customer", label: "顧客", sub: "Customer", icon: "◎" },
  { href: "/entrance", label: "出入口", sub: "Entrance", icon: "⊏" },
  { href: "/survey", label: "興趣評估", sub: "Survey", icon: "◈" },
];

const STORES = [
  "台北信義旗艦店",
  "台中中港店",
  "高雄漢神店",
  "台北內湖店",
];

export function Sidebar() {
  const pathname = usePathname();
  const [storeOpen, setStoreOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(STORES[0]);

  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col h-screen sticky top-0 text-white/60"
      style={{
        background: "linear-gradient(180deg, #0f1723 0%, #111927 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-[18px] pt-5 pb-4 border-b border-white/[0.06]">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
          <rect x="2" y="2" width="10" height="10" rx="2" fill="#3b82f6" />
          <rect x="16" y="2" width="10" height="10" rx="2" fill="#3b82f6" opacity="0.6" />
          <rect x="2" y="16" width="10" height="10" rx="2" fill="#3b82f6" opacity="0.6" />
          <rect x="16" y="16" width="10" height="10" rx="2" fill="#3b82f6" opacity="0.3" />
        </svg>
        <div>
          <div className="text-[15px] font-bold text-white tracking-[0.02em] leading-tight">
            Retail AI
          </div>
          <div className="text-[9px] text-white/35 tracking-[0.08em] uppercase">
            Analytics Platform
          </div>
        </div>
      </div>

      {/* Store selector */}
      <div className="px-3.5 pt-3.5 pb-2.5">
        <div className="text-[9px] text-white/30 tracking-[0.1em] uppercase mb-1.5">
          目前店舖
        </div>
        <button
          type="button"
          onClick={() => setStoreOpen((v) => !v)}
          className="w-full flex items-center rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[12px] text-white/75 hover:bg-white/[0.08] transition"
        >
          <span className="mr-1.5 text-[11px] opacity-60">🏪</span>
          <span className="flex-1 text-left truncate">{selectedStore}</span>
          <span className="text-[9px] opacity-50">{storeOpen ? "▲" : "▼"}</span>
        </button>
        {storeOpen && (
          <div className="mt-1 rounded-lg border border-white/10 bg-[#1a2535] overflow-hidden">
            {STORES.map((s) => {
              const active = s === selectedStore;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSelectedStore(s);
                    setStoreOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[11px] transition",
                    active
                      ? "text-[#60a5fa] bg-[rgba(59,130,246,0.2)]"
                      : "text-white/70 hover:bg-white/[0.05]"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2.5">
        <div className="text-[9px] text-white/30 tracking-[0.1em] uppercase mb-1.5 pl-2">
          功能選單
        </div>
        <ul className="space-y-0.5">
          {NAV.map((it) => {
            const active =
              pathname === it.href || pathname.startsWith(it.href + "/");
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg py-2 pr-2.5 transition",
                    active
                      ? "text-white"
                      : "text-white/55 hover:text-white/80 hover:bg-white/[0.03]"
                  )}
                  style={{
                    paddingLeft: active ? 7 : 10,
                    borderLeft: active
                      ? "3px solid #3b82f6"
                      : "3px solid transparent",
                    background: active
                      ? "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.1))"
                      : undefined,
                  }}
                >
                  <span
                    className="w-5 text-center text-[14px] shrink-0"
                    aria-hidden
                  >
                    {it.icon}
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span
                      className={cn(
                        "text-[13px]",
                        active ? "font-semibold" : "font-normal"
                      )}
                    >
                      {it.label}
                    </span>
                    <span className="text-[10px] text-white/45 tracking-[0.05em]">
                      {it.sub}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3.5 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full grid place-items-center text-[13px] font-bold text-white shrink-0"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            }}
          >
            管
          </div>
          <div className="leading-tight">
            <div className="text-[12px] text-white/80">管理員</div>
            <div className="text-[10px] text-white/40">admin@nexretail.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
