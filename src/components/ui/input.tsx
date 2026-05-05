import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "aria-invalid:border-destructive flex h-9 w-full min-w-0 rounded-md border border-zinc-300 bg-transparent px-3 py-1 text-base shadow-none transition-colors outline-none placeholder:text-zinc-400 focus-visible:border-black disabled:pointer-events-none disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
