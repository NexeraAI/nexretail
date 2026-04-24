"use client";

import { cn } from "@/lib/utils";

/**
 * 簡化版展場 3D 俯視示意圖 (SVG)。
 * areas: 各區域方塊
 * products: 商品擺放
 * path: 顧客路徑 (list of [x, y])
 */
export type Tone = "accent" | "pink" | "purple" | "teal" | "warning" | "success";

export type AreaRect = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone?: Tone;
};

export type PathPoint = { x: number; y: number; label?: string };

const TONE: Record<Tone, string> = {
  accent: "#3b82f6",
  pink: "#ee5da1",
  purple: "#7a5af8",
  teal: "#15b79e",
  warning: "#f79009",
  success: "#12b76a",
};

export function TopView3D({
  areas,
  products = [],
  path = [],
  entrances = [],
  highlightId,
  width = 720,
  height = 420,
  className,
}: {
  areas: AreaRect[];
  products?: { id: string; x: number; y: number; label: string }[];
  path?: PathPoint[];
  entrances?: { x: number; y: number; label: string }[];
  highlightId?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto rounded-lg bg-[linear-gradient(180deg,#f6f8ff_0%,#edf0f7_100%)]"
      >
        {/* Grid */}
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="#e1e6f0"
              strokeWidth="0.6"
            />
          </pattern>
          <linearGradient id="pathGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* Outer wall (perspective-ish) */}
        <rect
          x={20}
          y={20}
          width={width - 40}
          height={height - 40}
          fill="#ffffff"
          stroke="#c8cfdb"
          strokeWidth={1.4}
          rx={8}
        />

        {/* Areas */}
        {areas.map((a) => {
          const fill = TONE[a.tone ?? "accent"];
          const active = highlightId === a.id;
          return (
            <g key={a.id}>
              <rect
                x={a.x}
                y={a.y}
                width={a.w}
                height={a.h}
                fill={fill}
                fillOpacity={active ? 0.22 : 0.08}
                stroke={fill}
                strokeOpacity={active ? 0.9 : 0.5}
                strokeDasharray={active ? undefined : "4 3"}
                strokeWidth={active ? 1.6 : 1}
                rx={6}
              />
              <text
                x={a.x + 8}
                y={a.y + 16}
                fontSize={11}
                fill={fill}
                fontWeight={600}
              >
                {a.label}
              </text>
            </g>
          );
        })}

        {/* Products */}
        {products.map((p) => (
          <g key={p.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={8}
              fill="#ffffff"
              stroke="#3b82f6"
              strokeWidth={1.5}
            />
            <text
              x={p.x}
              y={p.y + 3}
              textAnchor="middle"
              fontSize={9}
              fill="#3b82f6"
              fontWeight={700}
            >
              {p.label}
            </text>
          </g>
        ))}

        {/* Entrances */}
        {entrances.map((e, i) => (
          <g key={i}>
            <rect
              x={e.x - 14}
              y={e.y - 6}
              width={28}
              height={12}
              fill="#12b76a"
              rx={3}
            />
            <text
              x={e.x}
              y={e.y + 3}
              textAnchor="middle"
              fontSize={9}
              fill="#ffffff"
              fontWeight={700}
            >
              {e.label}
            </text>
          </g>
        ))}

        {/* Path */}
        {path.length > 1 && (
          <>
            <polyline
              points={path.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="url(#pathGrad)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {path.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={i === 0 || i === path.length - 1 ? 5 : 3}
                  fill={i === path.length - 1 ? "#f04438" : "#3b82f6"}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              </g>
            ))}
          </>
        )}
      </svg>
    </div>
  );
}
