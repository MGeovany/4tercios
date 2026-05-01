import Link from "next/link";
import Image from "next/image";

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
      <Image
        src="/brand/logo-4-3.png"
        alt="4Tercios"
        width={size === "sm" ? 24 : 28}
        height={size === "sm" ? 24 : 28}
        priority
        className="rounded-sm ring-1 ring-black/10"
      />
      <span
        className={cn(
          "font-semibold tracking-tight text-zinc-950",
          size === "sm" ? "text-base" : "text-lg"
        )}
      >
        4Tercios
      </span>
    </Link>
  );
}
