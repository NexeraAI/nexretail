"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Map,
  Flame,
  ShoppingBag,
  Users,
  DoorOpen,
  ClipboardList,
  FileText,
  PieChart,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  {
    group: "運營總覽",
    items: [
      { href: "/stores", label: "店舖總覽", icon: Store },
      { href: "/overview", label: "商場總覽", icon: PieChart },
    ],
  },
  {
    group: "展場分析",
    items: [
      { href: "/main", label: "主頁 / 3D 俯視", icon: LayoutDashboard },
      { href: "/area", label: "區域", icon: Map },
      { href: "/heatmap", label: "熱力圖", icon: Flame },
      { href: "/entrance", label: "出入口", icon: DoorOpen },
    ],
  },
  {
    group: "商品與顧客",
    items: [
      { href: "/product", label: "商品", icon: ShoppingBag },
      { href: "/customer", label: "顧客", icon: Users },
    ],
  },
  {
    group: "興趣評估",
    items: [
      { href: "/survey", label: "興趣評估", icon: ClipboardList },
      { href: "/survey-list", label: "問券列表", icon: FileText },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col">
      <div className="h-14 flex items-center gap-2 px-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent grid place-items-center">
          <Sparkles size={18} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Retail AI</div>
          <div className="text-[11px] text-muted">Nexretail Console</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV.map((group) => (
          <div key={group.group}>
            <div className="px-2 mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-2">
              {group.group}
            </div>
            <ul className="space-y-1">
              {group.items.map((it) => {
                const active =
                  pathname === it.href || pathname.startsWith(it.href + "/");
                const Icon = it.icon;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition",
                        active
                          ? "bg-accent text-white shadow-sm"
                          : "text-foreground hover:bg-surface-2"
                      )}
                    >
                      <Icon size={16} />
                      <span>{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-muted">
          <div className="font-medium text-foreground mb-0.5">系統狀態</div>
          32 相機線上 · 2 告警
        </div>
      </div>
    </aside>
  );
}
