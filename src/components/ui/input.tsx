import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "placeholder:text-muted-foreground aria-invalid:border-destructive flex h-9 w-full min-w-0 rounded-md border border-zinc-300 bg-transparent px-3 py-1 text-base shadow-none transition-colors outline-none focus-visible:border-black disabled:pointer-events-none disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Input };
