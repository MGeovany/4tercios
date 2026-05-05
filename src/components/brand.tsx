import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

export function Brand({ href = "/", className }: { href?: string; className?: string }) {
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
        src="/brand/logo-landing.png"
        alt="4Tercios"
        width={140}
        height={40}
        priority
        className="h-5 w-auto"
      />
    </Link>
  );
}
