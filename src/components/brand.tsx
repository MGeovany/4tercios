import Link from "next/link";

import { cn } from "@/lib/utils";

export function Brand({
  href = "/",
  className,
  size = "md",
}: {
  href?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl",
        "focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none",
        className
      )}
    >
      <span
        className={cn(
          "font-semibold tracking-tight text-zinc-950",
          size === "sm" && "text-sm",
          size === "md" && "text-base"
        )}
      >
        4Tercios
      </span>
    </Link>
  );
}
