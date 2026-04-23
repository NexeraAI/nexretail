import { cn } from "@/lib/utils";

export function Avatar({
  name,
  size = 32,
  gender = "m",
  className,
}: {
  name: string;
  size?: number;
  gender?: "m" | "f";
  className?: string;
}) {
  const initials = name.slice(0, 1).toUpperCase();
  const bg = gender === "f" ? "bg-pink/15 text-pink" : "bg-accent/15 text-accent";
  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-full font-semibold ring-1 ring-border",
        bg,
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={name}
    >
      {initials}
    </span>
  );
}
