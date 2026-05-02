"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ReloadIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";

type Result = {
  attempted: number;
  succeeded: number;
  failed: number;
};

export function ReprocessFailedButton({
  eventId,
  failedCount,
}: {
  eventId: string;
  failedCount: number;
}) {
  const router = useRouter();
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [last, setLast] = React.useState<Result | null>(null);

  const disabled = running || failedCount === 0;

  async function onClick() {
    if (disabled) return;
    setRunning(true);
    setError(null);
    setLast(null);

    try {
      const res = await fetch(`/api/events/id/${eventId}/reprocess-failed`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        attempted?: number;
        succeeded?: number;
        failed?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      setLast({
        attempted: body.attempted ?? 0,
        succeeded: body.succeeded ?? 0,
        failed: body.failed ?? 0,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reprocesar.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onClick}
        disabled={disabled}
      >
        <ReloadIcon className={running ? "animate-spin" : undefined} />
        {running
          ? "Reprocesando..."
          : failedCount === 0
            ? "Sin fotos con error"
            : `Reprocesar ${failedCount} con error`}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {last ? (
        <p className="text-xs text-zinc-500">
          {last.succeeded}/{last.attempted} OK · {last.failed} fallaron
        </p>
      ) : null}
    </div>
  );
}
