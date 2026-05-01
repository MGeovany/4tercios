export function Topbar({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-zinc-100 bg-white/70 backdrop-blur">
      <div className="flex h-14 w-full items-center justify-between px-6">
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-zinc-950">
            {title}
          </h1>
          {subtitle ? <p className="truncate text-xs text-zinc-500">{subtitle}</p> : null}
        </div>
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
    </div>
  );
}
