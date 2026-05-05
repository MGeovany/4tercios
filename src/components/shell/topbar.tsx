import { LayoutGrid, Search } from "lucide-react";

export function Topbar({
  title,
  subtitle,
  icon,
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-6 lg:px-8">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px]">
            <span className="text-zinc-500">Main Menu</span>
            <span className="text-zinc-300">/</span>
            <span className="inline-flex items-center gap-1.5 text-zinc-900">
              <span className="text-zinc-500">
                {icon ?? <LayoutGrid className="size-4" strokeWidth={1.75} />}
              </span>
              <span className="truncate font-medium">{title}</span>
            </span>
          </nav>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11.5px] text-zinc-500">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <label className="relative hidden w-[280px] md:block">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
              strokeWidth={1.75}
            />
            <input
              type="search"
              placeholder="Search anything..."
              className="h-10 w-full rounded-2xl border border-zinc-200 bg-white py-2 pr-3 pl-9 text-[13.5px] text-zinc-900 transition-colors outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            />
          </label>
          {right ? <div className="flex items-center gap-2">{right}</div> : null}
        </div>
      </div>
    </header>
  );
}
