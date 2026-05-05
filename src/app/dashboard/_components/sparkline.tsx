import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type Trend = "up" | "down";

type SparklineProps = Omit<ComponentProps<"svg">, "points"> & {
  points: number[];
  trend?: Trend;
};

export function Sparkline({ points, trend = "up", className, ...props }: SparklineProps) {
  const width = 120;
  const height = 44;
  const padX = 2;
  const padY = 4;

  const series: number[] = points.length < 2 ? [points[0] ?? 0, points[0] ?? 0] : points;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const stepX = (width - padX * 2) / (series.length - 1);

  const xy = series.map((v, i) => {
    const x = padX + i * stepX;
    const y = padY + (height - padY * 2) * (1 - (v - min) / range);
    return [x, y] as const;
  });

  const path = xy
    .map(([x, y], i) =>
      i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`
    )
    .join(" ");

  const area =
    `${path} L ${xy[xy.length - 1][0].toFixed(1)} ${height - padY} ` +
    `L ${xy[0][0].toFixed(1)} ${height - padY} Z`;

  const stroke = trend === "down" ? "#ef4444" : "#22c55e";
  const fillStart = trend === "down" ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.20)";
  const fillEnd = trend === "down" ? "rgba(239,68,68,0)" : "rgba(34,197,94,0)";
  const gradId = `spark-${trend}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-11 w-[120px]", className)}
      preserveAspectRatio="none"
      role="img"
      aria-hidden
      {...props}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillStart} />
          <stop offset="100%" stopColor={fillEnd} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
