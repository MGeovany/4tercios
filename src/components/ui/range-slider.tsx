"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (next: number) => void;
  ariaLabel?: string;
};

export function RangeSlider({
  value,
  min,
  max,
  step = 0.01,
  onValueChange,
  className,
  ariaLabel,
  ...rest
}: Props) {
  const safeValue = clamp(Number(value), min, max);
  const pct = ((safeValue - min) / (max - min)) * 100;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={safeValue}
      aria-label={ariaLabel}
      onChange={(e) => onValueChange(Number(e.target.value))}
      className={cn("range-slider", className)}
      style={{
        backgroundImage: `linear-gradient(to right, #0a0a0a 0%, #0a0a0a ${pct}%, #e4e4e7 ${pct}%, #e4e4e7 100%)`,
      }}
      {...rest}
    />
  );
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
