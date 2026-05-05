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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Total" value={initialTotals.uploaded} />
        <Stat label="Listas" value={initialTotals.ready} />
        <Stat label="Rostros" value={initialTotals.faces} />
      </div>
      <PhotoUploader eventId={eventId} onPhotoReady={handlePhotoReady} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/70 px-1 py-1 text-center">
      <p className="text-[11px] font-medium tracking-[0.08em] text-zinc-500 uppercase">{label}</p>
      <p className="mt-1 text-4xl leading-none font-semibold tracking-tight text-zinc-950 tabular-nums">
        {value.toLocaleString("es-HN")}
      </p>
    </div>
  );
}
