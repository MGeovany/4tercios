"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

function isoToDate(iso: string) {
  // iso: YYYY-MM-DD
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function dateToIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatShort(date: Date) {
  return new Intl.DateTimeFormat("es-HN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function DatePicker({
  id,
  label,
  value,
  onChange,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (nextIso: string) => void;
}) {
  const selected = isoToDate(value);

  return (
    <div>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between",
              label ? "mt-2" : undefined,
              !selected ? "text-muted-foreground" : undefined
            )}
          >
            <span>{selected ? formatShort(selected) : "Selecciona una fecha"}</span>
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected ?? undefined}
            onSelect={(d) => {
              if (!d) return;
              onChange(dateToIso(d));
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
