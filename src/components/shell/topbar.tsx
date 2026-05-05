import { LayoutGrid } from "lucide-react";
import { TopbarSearch } from "@/components/shell/topbar-search";

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
          <TopbarSearch />
          {right ? <div className="flex items-center gap-2">{right}</div> : null}
        </div>
      </div>
    </header>
  );
}
