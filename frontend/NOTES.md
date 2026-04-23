# Retail AI · 開發筆記

基於 `[系統] Retail AI.pptx` (2024-10-31 wireframe) 產出的前端原型。
此文件記錄從 PPT → code 過程中的決策、非顯而易見的結構、以及後續接手的注意事項。

---

## 1. PPT → 頁面對應表

PPT 共 19 張 slide，去除封面/分節頁後歸納為 **10 個功能頁**：

| 路由 | 對應 slide | 中文名稱 | 主要 component |
|---|---|---|---|
| `/stores` | 3, 4 | 店舖總覽 | 國家列表 + 店鋪表格 |
| `/overview` | 6 | 商場總覽 | KPI + 人流/銷售折線 + 行為/區域/同行佔比 |
| `/main` | 5 | 主頁 | 顧客列表 + `TopView3D` + 行為時序 + 顧客細節 |
| `/area` | 7 | 區域 | 區域選單 + 即時影像 + `TopView3D` + 停留列表 |
| `/heatmap` | 8, 9 | 熱力圖 | 過濾器 + `Heatmap`(path) + `Heatmap`(behavior) |
| `/product` | 10, 11 | 商品 | 商品列表 + 俯視擺放 + 年齡觀看秒數 + 互動佔比 |
| `/customer` | 12, 13 | 顧客 | 性別年齡堆疊 + 行為橫條 + 顧客抽屜 |
| `/entrance` | 14, 15 | 出入口 | 俯視平面 + 多入口折線 + 轉換率比較 |
| `/survey` | 16, 17 | 興趣評估 | 產品偏好 + 感興趣 vs 一般族群行為比較 |
| `/survey-list` | 18, 19 | 問券列表 | 問券表格 + 抽屜 (影像/QR/線上欄位) |

`/` 會重導至 `/overview`。

---

## 2. 領域背景 (重要)

**這不是一般零售賣場，而是汽車展間 (車商展示中心)。**

PPT 中出現：展車、賞車、試乘、商談區、車款、對應影像 (CAM-xx)、QR CODE 掃描規格頁。
因此 mock 資料和文案用 BMW 車型 (M3/i7/X5/M4 CS) 與區域命名 (A 展車區、C 商談區、D 試乘準備)。

**接手時請保留這個框架**，避免把詞彙換成通用零售（如「貨架」、「收銀台」）。
如果後續需要改 pivot，這個改動必須同步更新：`src/lib/mock.ts` 的 `products / areas / behaviors / NEEDS`。

---

## 3. 專案結構

```
src/
├─ app/                        # 各路由 page.tsx
│  ├─ layout.tsx               # 全域 Sidebar + Topbar 包裝
│  ├─ page.tsx                 # redirect → /overview
│  └─ <route>/page.tsx         # 10 個功能頁
├─ components/
│  ├─ layout/  Sidebar, Topbar
│  ├─ ui/      Card, Stat, Badge, Avatar, PageHeader  (shadcn 風格輕量 primitive)
│  └─ viz/     TopView3D, Heatmap                     (自製 SVG 視覺化)
└─ lib/
   ├─ mock.ts                  # 所有資料來源 (seeded PRNG，SSR 一致)
   └─ utils.ts                 # cn, pct, fmt helpers
```

---

## 4. 設計 / 技術決策

| 決策 | 選擇 | 為什麼 |
|---|---|---|
| 框架 | Next.js 16 App Router | SSR + 路由檔案化最快出原型 |
| 樣式 | Tailwind v4 + CSS variables (`--color-*`) | 用 CSS var 統一 token，圖表顏色可直接參照 `var(--color-accent)` |
| 圖表 | Recharts | 宣告式 JSX、組合彈性高；客戶側渲染以 `"use client"` 標記 |
| 俯視圖 | SVG (不使用 three.js) | 只是示意位置，SVG 已足；介面 (`areas[]`, `products[]`, `path[]`) 未來可直接替換實作 |
| 熱力圖 | SVG + radialGradient + `mix-blend-mode: screen` | 無需 canvas，檔案輕；接真實 density 時把 `<circle>` 批次渲染換成 `heatmap.js` 即可 |
| 資料 | 全部 mock，seeded PRNG | `mulberry32(20260422)` 保證 SSR 與 client hydration 一致，避免 React hydration mismatch |

---

## 5. Mock 資料 → 真 API 的接點

所有頁面只從 `@/lib/mock` import。改接真 API 時：

1. 在 `src/lib/mock.ts` 每個 export 旁新增對應 fetcher (e.g. `fetchStores()`)
2. 把頁面的 `import { stores } from "@/lib/mock"` 改成 `const stores = await fetchStores()`（server component）或 `useSWR`（client）
3. 型別已經內嵌在 mock (`Gender`, `AgeBand` 等 export)，可直接用

**不要**把 API 回傳直接代入元件而不定型別 — 目前所有圖表都依賴特定 key name（`人流`、`去年同期`、`男性` 等中文 key），若後端使用英文 key，請在 fetcher 做一次 map。

---

## 6. 已知簡化 / 未來 TODO

- **即時影像**：目前是 `<div>` 佔位 + `Play` icon，接真 CAM stream 可用 HLS.js 或 `<video>` 加 MSE。
- **3D 俯視**：`TopView3D` 用固定 `viewBox="0 0 720 420"`，若切換不同店格局需讓 `areaRects` / `entranceMarkers` 座標可傳入。
- **熱力圖**：只有兩個 mode (`path` / `behavior`)，點位固定。接後端 heatmap matrix 時，將 intensity 做 normalize 後塞進 `points[]`。
- **Sidebar**：當前高亮只靠 `pathname.startsWith`，嵌套路由（如 `/customer/[id]`）需要時要調整。
- **國際化**：文案全部硬編中文；若要支援日英，可引入 `next-intl`，把 `PageHeader` 等 primitive 的字串改為 key。
- **搜尋 / 過濾**：`Topbar` 的搜尋框目前無功能，`/heatmap` 的 date range slider 是純視覺。
- **Dark mode**：CSS variable 架構已備好，但尚未設計 dark palette。

---

## 7. 執行方式

```bash
npm run dev      # 開發伺服器 (本次以 PORT=3321 起動)
npm run build    # 產生生產版本；所有 12 路由目前皆 ○ static
npm run lint     # eslint
npx tsc --noEmit # 型別檢查 (目前乾淨)
```

---

## 8. 容易踩雷的地方

- **Recharts Tooltip `formatter` 的型別**：Recharts 把 value 型別定為 `ValueType | undefined`；寫 `(v: number) =>` 會 TS 錯誤。請用 `(v) =>` 並在需要時 `Number(v)`。
- **Tailwind v4 自訂顏色**：必須同時在 `globals.css` 的 `:root` (值) 和 `@theme inline` (宣告) 寫，否則 `bg-accent` 等 class 不會產生。
- **`"use client"` 邊界**：圖表、useState、lucide-react 互動 icon 都需 client boundary。整個 page 標成 client 最簡單，除非需要 server fetching。
- **Geist 字型 + 中文**：目前字型 fallback 清單已包含 `"Noto Sans TC", "PingFang TC"`，新增頁面不用額外處理中文顯示。
