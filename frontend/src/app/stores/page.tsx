"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { ApiError, getCountries, getStores, type Country, type Store } from "@/lib/api";
import { fmt } from "@/lib/utils";
import { Search, ChevronRight, Phone, User2 } from "lucide-react";

export default function StoresPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [country, setCountry] = useState<string>("");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCountries(), getStores()])
      .then(([cs, ss]) => {
        setCountries(cs);
        setStores(ss);
        if (cs.length > 0) setCountry(cs[0].code);
      })
      .catch((e) => {
        console.error(e);
        setError(e instanceof ApiError ? e.message : "未預期錯誤");
      });
  }, []);

  const filtered = stores
    .filter((s) => s.country_code === country)
    .filter(
      (s) =>
        !q ||
        s.name.includes(q) ||
        (s.tax_id ?? "").includes(q) ||
        (s.manager_name ?? "").includes(q),
    );

  const activeCountryName =
    countries.find((c) => c.code === country)?.name ?? "—";

  return (
    <>
      <PageHeader
        eyebrow="STORE BROWSER"
        title="店舖總覽"
        desc="跨區域門市一覽，切換國家追蹤密度與銷售健康度。"
      />
      <div className="p-6 grid grid-cols-12 gap-6">
        {/* 國家列表 */}
        <Card className="col-span-12 lg:col-span-4">
          <CardHeader title="國家" desc="點選查看該國所有店鋪" />
          <CardBody className="pt-1">
            {error && (
              <div className="px-3 py-3 text-xs text-danger">無法載入：{error}</div>
            )}
            {!error && countries.length === 0 && (
              <div className="px-3 py-3 text-xs text-muted">載入中…</div>
            )}
            <ul className="divide-y divide-border">
              {countries.map((c) => {
                const active = c.code === country;
                return (
                  <li key={c.code}>
                    <button
                      onClick={() => setCountry(c.code)}
                      className={
                        "w-full flex items-center justify-between px-3 py-3 rounded-md transition " +
                        (active ? "bg-accent/5" : "hover:bg-surface-2")
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={
                            "w-9 h-9 rounded-md grid place-items-center font-mono text-xs font-semibold " +
                            (active
                              ? "bg-accent text-white"
                              : "bg-surface-2 text-muted")
                          }
                        >
                          {c.code}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-xs text-muted">
                            {c.store_count} 間店鋪
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className={active ? "text-accent" : "text-muted-2"}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        {/* 商店列表 */}
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader
            title="商店列表"
            desc={`${activeCountryName} — 共 ${filtered.length} 間店鋪`}
            action={
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-2"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="搜尋店名 / 統編 / 店長"
                  className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-border bg-surface-2 w-60 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40"
                />
              </div>
            }
          />
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-muted text-xs">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">店名</th>
                  <th className="text-left font-medium px-3 py-2.5">統編 / 電話</th>
                  <th className="text-left font-medium px-3 py-2.5">店長</th>
                  <th className="text-right font-medium px-5 py-2.5">本月人流</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-2/60 cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted">#{s.id}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-mono text-xs">{s.tax_id ?? "—"}</div>
                      <div className="text-xs text-muted flex items-center gap-1">
                        <Phone size={10} /> {s.phone ?? "—"}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <User2 size={12} className="text-muted-2" />
                        {s.manager_name ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {fmt(s.month_traffic)}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !error && countries.length > 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-muted">
                      無資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
