"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MagnifyingGlassIcon, Cross1Icon } from "@radix-ui/react-icons";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

export function ListFilters({
  searchPlaceholder,
  statusOptions,
  initialSearch = "",
  initialStatus = "all",
  className,
}: {
  searchPlaceholder: string;
  statusOptions: Option[];
  initialSearch?: string;
  initialStatus?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(initialSearch);
  const [status, setStatus] = React.useState(initialStatus);

  const debouncedRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const shouldRestoreFocusRef = React.useRef(false);
  const caretRef = React.useRef<number | null>(null);

  const updateUrl = React.useCallback(
    (nextSearch: string, nextStatus: string, preserveFocus = false) => {
      if (preserveFocus) {
        shouldRestoreFocusRef.current = document.activeElement === inputRef.current;
        caretRef.current = nextSearch.length;
      }
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (nextSearch.trim()) params.set("q", nextSearch.trim());
      else params.delete("q");
      if (nextStatus && nextStatus !== "all") params.set("status", nextStatus);
      else params.delete("status");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  React.useEffect(() => {
    if (!shouldRestoreFocusRef.current) return;
    shouldRestoreFocusRef.current = false;
    const nextCaret = caretRef.current;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      if (inputRef.current && typeof nextCaret === "number" && inputRef.current.setSelectionRange) {
        inputRef.current.setSelectionRange(nextCaret, nextCaret);
      }
    });
  }, [searchParams]);

  React.useEffect(() => {
    return () => {
      if (debouncedRef.current) clearTimeout(debouncedRef.current);
    };
  }, []);

  function onSearchChange(value: string) {
    setSearch(value);
    if (debouncedRef.current) clearTimeout(debouncedRef.current);
    debouncedRef.current = setTimeout(() => {
      updateUrl(value, status, true);
    }, 300);
  }

  function onStatusChange(value: string) {
    setStatus(value);
    updateUrl(search, value);
  }

  function clearAll() {
    setSearch("");
    setStatus("all");
    updateUrl("", "all");
  }

  const hasFilters = search.trim().length > 0 || (status && status !== "all");

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 self-end rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 transition hover:bg-zinc-50 sm:self-auto"
          >
            <Cross1Icon className="size-3" />
            Limpiar
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onStatusChange(opt.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              status === opt.value
                ? "border-zinc-950 bg-zinc-950 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
