"use client";

import { Bell, Calendar, ChevronDown, Search, UserCircle2 } from "lucide-react";

export function Topbar() {
  return (
    <header className="h-14 shrink-0 bg-surface border-b border-border flex items-center gap-4 px-6">
      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-2">
          <Store16 />
          台北旗艦店
          <ChevronDown size={14} className="text-muted" />
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-2">
          <Calendar size={14} className="text-muted" />
          2026/04/15 – 2026/04/22
          <ChevronDown size={14} className="text-muted" />
        </button>
      </div>
      <div className="flex-1" />
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-2"
        />
        <input
          placeholder="搜尋顧客、商品、區域..."
          className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-border bg-surface-2 w-64 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40"
        />
      </div>
      <button className="relative p-2 rounded-md hover:bg-surface-2 text-muted">
        <Bell size={16} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-danger" />
      </button>
      <button className="flex items-center gap-2 p-1.5 rounded-md hover:bg-surface-2">
        <UserCircle2 size={22} className="text-muted" />
        <div className="text-xs leading-tight text-left">
          <div className="font-medium">Herry Chen</div>
          <div className="text-muted">Store Manager</div>
        </div>
      </button>
    </header>
  );
}

function Store16() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted"
    >
      <path d="m2 7 1-4h18l1 4" />
      <path d="M4 10v10h16V10" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}
