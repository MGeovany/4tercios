"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ReloadIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";

export function RetryPhotoButton({ photoId }: { photoId: string }) {
  const router = useRouter();
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    if (running) return;
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/photos/${photoId}/process`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Reintento falló");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reintento falló");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        aria-label="Reintentar procesamiento"
        onClick={onClick}
        disabled={running}
      >
        <ReloadIcon className={running ? "animate-spin" : undefined} />
        {running ? "Reintentando..." : "Reintentar"}
      </Button>
      {error ? <p className="mt-1 text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}
