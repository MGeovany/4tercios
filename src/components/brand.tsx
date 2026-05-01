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
        "inline-flex items-center",
        "focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none",
        className
      )}
    >
      <Image
        src="/brand/main-logo-hq.png"
        alt="4Tercios"
        width={428}
        height={86}
        priority
        className={size === "sm" ? "h-10 w-auto" : "h-11 w-auto"}
      />
    </Link>
  );
}
