"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { PhotoUploader } from "@/components/upload/photo-uploader";

type Totals = {
  uploaded: number;
  ready: number;
  processing: number;
  errors: number;
  faces: number;
};

export function UploadStation({
  eventId,
  initialTotals,
}: {
  eventId: string;
  initialTotals: Totals;
}) {
  const router = useRouter();
  const lastRefresh = React.useRef(0);

  const handlePhotoReady = React.useCallback(() => {
    const now = Date.now();
    if (now - lastRefresh.current < 1500) return;
    lastRefresh.current = now;
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 2xl:grid-cols-5">
        <Stat label="Total" value={initialTotals.uploaded} />
        <Stat label="Listas" value={initialTotals.ready} />
        <Stat label="En cola" value={initialTotals.processing} />
        <Stat label="Errores" value={initialTotals.errors} />
        <Stat label="Rostros" value={initialTotals.faces} />
      </div>
      <PhotoUploader eventId={eventId} onPhotoReady={handlePhotoReady} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
      <p className="text-[11px] tracking-wide text-zinc-500 uppercase">{label}</p>
      <p className="text-base font-semibold text-zinc-950 tabular-nums">
        {value.toLocaleString("es-HN")}
      </p>
    </div>
  );
}
