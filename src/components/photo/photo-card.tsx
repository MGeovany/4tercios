import * as React from "react";
import { CheckIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { photoGradient } from "@/lib/photo";
import { Badge } from "@/components/ui/badge";

export function PhotoCard({
  id,
  label,
  matchScore,
  selected,
  onToggle,
}: {
  id: string;
  label: string;
  matchScore?: number;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const pct = typeof matchScore === "number" ? Math.round(matchScore * 100) : null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border bg-white text-left transition",
        "hover:border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none",
        selected ? "border-zinc-950" : "border-zinc-200"
      )}
      aria-pressed={selected}
    >
      <div className="relative aspect-[4/3] w-full">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: photoGradient(id) }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
        <div className="absolute top-3 left-3">
          <Badge variant={pct && pct >= 85 ? "success" : pct ? "info" : "neutral"}>
            {pct ? `${label} ${pct}%` : label}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="text-xs font-medium text-white/85">
            4Tercios
            <span className="ml-2 text-white/55">watermark</span>
          </span>
        </div>
        <div
          className={cn(
            "absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-xl border",
            selected
              ? "border-zinc-950 bg-white text-zinc-950"
              : "border-white/30 bg-white/10 text-white/70",
            "transition"
          )}
          aria-hidden
        >
          {selected ? <CheckIcon /> : <span className="text-xs">+</span>}
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-zinc-950">Foto {id.toUpperCase()}</p>
        <p className="mt-0.5 text-xs text-zinc-500">Click para seleccionar</p>
      </div>
    </button>
  );
}
