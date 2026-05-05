"use client";

import { FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function TopbarSearch() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentQuery = pathname.startsWith("/dashboard/events")
    ? (searchParams.get("q") ?? "")
    : "";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const term = String(form.get("q") ?? "").trim();
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    router.push(`/dashboard/events${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form key={`${pathname}:${currentQuery}`} onSubmit={handleSubmit} className="hidden md:block">
      <label className="relative block w-[280px]">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
          strokeWidth={1.75}
        />
        <input
          type="search"
          name="q"
          defaultValue={currentQuery}
          placeholder="Search anything..."
          className="h-8 w-full rounded-md border border-zinc-200 bg-gray-50 py-1 pr-3 pl-9 text-xs text-zinc-900 transition-colors outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>
    </form>
  );
}
