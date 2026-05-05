"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type ChartPoint = {
  label: string;
  fullLabel: string;
  value: number;
};

export function OverviewChart({
  data,
  highlightIndex,
  unit = "ord",
  avgLabel,
  changeLabel,
  changePositive = true,
}: {
  data: ChartPoint[];
  highlightIndex: number;
  unit?: string;
  avgLabel: string;
  changeLabel: string;
  changePositive?: boolean;
}) {
  const [active, setActive] = useState<number>(highlightIndex);

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <section className="flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-5 lg:p-6">
      <header className="flex items-start justify-between gap-4">
        <h2 className="text-[17px] font-semibold tracking-tight text-zinc-950">Resumen</h2>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Último mes
          <ChevronDown className="size-3.5 text-zinc-400" strokeWidth={2} />
        </button>
      </header>

      <div className="mt-4">
        <p className="text-[12px] text-zinc-500">Promedio mensual</p>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-[26px] font-semibold tracking-tight text-zinc-950 tabular-nums">
            {avgLabel}
          </p>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-semibold tabular-nums",
              changePositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}
          >
            {changeLabel}
            <span aria-hidden>{changePositive ? "▲" : "▼"}</span>
          </span>
        </div>
      </div>

      <div className="mt-6 flex-1">
        <div className="relative h-[210px]">
          <div className="pointer-events-none absolute inset-x-0 bottom-7 grid grid-rows-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border-t border-dashed border-zinc-100" />
            ))}
          </div>

          <div className="relative flex h-full items-end justify-between gap-2 pb-7">
            {data.map((d, i) => {
              const isActive = i === active;
              const heightPct = Math.max(8, Math.round((d.value / max) * 100));
              return (
                <button
                  key={d.label}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
                  aria-label={`${d.fullLabel}: ${d.value} ${unit}`}
                >
                  {isActive ? (
                    <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full">
                      <div className="rounded-xl bg-zinc-900 px-3 py-2 text-center text-white shadow-lg">
                        <p className="text-[10.5px] font-medium tracking-wide text-zinc-300">
                          {d.fullLabel}
                        </p>
                        <p className="text-[13px] font-semibold tabular-nums">
                          {d.value} {unit}
                        </p>
                      </div>
                      <div
                        className="mx-auto h-2 w-2 -translate-y-1 rotate-45 bg-zinc-900"
                        aria-hidden
                      />
                    </div>
                  ) : null}

                  <div
                    className={cn(
                      "relative w-full max-w-[34px] overflow-hidden rounded-t-[12px] transition-all",
                      isActive
                        ? "bg-zinc-900"
                        : "border border-zinc-200/80 bg-zinc-50 group-hover:border-zinc-300"
                    )}
                    style={{ height: `${heightPct}%` }}
                  >
                    {!isActive ? (
                      <div
                        className="absolute inset-0 opacity-70"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(135deg, transparent 0 5px, rgba(24,24,27,0.06) 5px 6px)",
                        }}
                        aria-hidden
                      />
                    ) : null}
                    {isActive ? (
                      <span className="absolute top-1.5 left-1/2 size-2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_3px_rgba(24,24,27,0.85)]" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between gap-2">
            {data.map((d, i) => (
              <div
                key={`${d.label}-x`}
                className={cn(
                  "flex-1 text-center text-[11.5px]",
                  i === active ? "font-semibold text-zinc-900" : "text-zinc-500"
                )}
              >
                {d.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
