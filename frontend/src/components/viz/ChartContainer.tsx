import { ResponsiveContainer } from "recharts";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof ResponsiveContainer>;

// Wraps Recharts ResponsiveContainer with initialDimension={1,1} so static
// generation (no ResizeObserver) doesn't emit width(-1)/height(-1) warnings.
export function ChartContainer({
  width = "100%",
  height = "100%",
  initialDimension = { width: 1, height: 1 },
  children,
  ...rest
}: Props) {
  return (
    <ResponsiveContainer
      width={width}
      height={height}
      initialDimension={initialDimension}
      {...rest}
    >
      {children}
    </ResponsiveContainer>
  );
}
