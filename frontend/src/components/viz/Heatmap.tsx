"use client";

/**
 * 簡化版熱力圖：透過 radial gradient 模擬密度。
 * points: { x, y, intensity }（以 viewBox 座標系）
 */
export function Heatmap({
  points,
  mode = "path",
  width = 720,
  height = 420,
}: {
  points: { x: number; y: number; intensity: number }[];
  mode?: "path" | "behavior";
  width?: number;
  height?: number;
}) {
  const color = mode === "path" ? "250,100,0" : "47,104,255";
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto rounded-lg bg-[#11131a]"
    >
      <defs>
        <radialGradient id={`hm-${mode}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`rgba(${color},0.9)`} />
          <stop offset="40%" stopColor={`rgba(${color},0.5)`} />
          <stop offset="100%" stopColor={`rgba(${color},0)`} />
        </radialGradient>
        <pattern id={`g-${mode}`} width="28" height="28" patternUnits="userSpaceOnUse">
          <path
            d="M 28 0 L 0 0 0 28"
            fill="none"
            stroke="#1c2030"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width={width} height={height} fill={`url(#g-${mode})`} />

      {/* store outline */}
      <rect
        x={20}
        y={20}
        width={width - 40}
        height={height - 40}
        fill="none"
        stroke="#2a2f45"
        strokeWidth={1.2}
        rx={6}
      />

      {points.map((p, i) => {
        const r = 40 + p.intensity * 50;
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={r}
            fill={`url(#hm-${mode})`}
            style={{ mixBlendMode: "screen" }}
          />
        );
      })}
    </svg>
  );
}
