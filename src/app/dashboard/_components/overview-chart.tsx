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
  unit = "ordenes",
  avgLabel,
  changeLabel,
  changePositive = true,
  hasRealData = true,
}: {
  data: ChartPoint[];
  highlightIndex: number;
  unit?: string;
  avgLabel: string;
  changeLabel?: string;
  changePositive?: boolean;
  hasRealData?: boolean;
}) {
  const PERIODS = [
    { key: "1", label: "Ultimo mes", months: 1 },
    { key: "3", label: "Ultimos 3 meses", months: 3 },
    { key: "6", label: "Ultimos 6 meses", months: 6 },
    { key: "8", label: "Ultimos 8 meses", months: 8 },
  ] as const;

  const [periodMonths, setPeriodMonths] = useState<number>(1);
  const visibleData = data.slice(-periodMonths);
  const safeHighlight = Math.max(0, Math.min(highlightIndex, visibleData.length - 1));
  const [active, setActive] = useState<number>(safeHighlight);

  const max = Math.max(...visibleData.map((d) => d.value), 1);
  const selected =
    visibleData[Math.min(active, visibleData.length - 1)] ?? visibleData[0];

  const periodOrderCount = (months: number) =>
    data.slice(-months).reduce((acc, m) => acc + m.value, 0);
  const formatCount = (count: number) => `${count} ${count === 1 ? "orden" : "ordenes"}`;

  return (
    <section className="flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-5 lg:p-6">
      <header className="flex items-start justify-between gap-4">
        <h2 className="text-[17px] font-semibold tracking-tight text-zinc-950">
          Resumen
        </h2>
        {hasRealData ? (
          <label className="relative">
            <select
              value={String(periodMonths)}
              onChange={(e) => {
                const next = Number(e.target.value) || 1;
                setPeriodMonths(next);
                setActive(next - 1);
              }}
              className="appearance-none rounded-xl border border-zinc-200 bg-white py-1.5 pr-8 pl-3 text-[12.5px] font-medium text-zinc-700 transition-colors outline-none hover:bg-zinc-50 focus:border-zinc-400"
            >
              {PERIODS.map((p) => (
                <option key={p.key} value={p.months}>
                  {p.label} · {formatCount(periodOrderCount(p.months))}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-zinc-400"
              strokeWidth={2}
            />
          </label>
        ) : (
          <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[12.5px] font-medium text-zinc-500">
            Aun no hay informacion
          </div>
        )}
      </header>

      <div className="mt-4">
        <p className="text-[12px] text-zinc-500">Promedio mensual</p>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-[26px] font-semibold tracking-tight text-zinc-950 tabular-nums">
            {avgLabel}
          </p>
          {changeLabel ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-semibold tabular-nums",
                changePositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              )}
            >
              {changeLabel}
              <span aria-hidden>{changePositive ? "▲" : "▼"}</span>
            </span>
          ) : null}
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
            {visibleData.map((d, i) => {
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
                  <div className="relative flex w-full flex-col items-center">
                    {isActive ? (
                      <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-10 -translate-x-1/2">
                        <div className="rounded-2xl bg-zinc-900 px-3 py-2 text-center text-white shadow-lg">
                          <p className="text-[11px] font-semibold whitespace-nowrap tabular-nums">
                            {d.fullLabel} · {d.value} {unit}
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
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between gap-2">
            {visibleData.map((d, i) => (
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
      {!hasRealData ? (
        <p className="mt-3 text-[12px] text-zinc-500">
          Aun no hay informacion de ordenes para este periodo.
        </p>
      ) : selected ? (
        <p className="mt-3 text-[12px] text-zinc-500">
          {selected.fullLabel} · {selected.value} {unit}
        </p>
      ) : null}
    </section>
  );
}
