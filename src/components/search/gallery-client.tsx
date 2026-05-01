"use client";

import * as React from "react";
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatHnl } from "@/lib/local-store";

export type GalleryPhoto = {
  photoId: string;
  facesCount: number;
  thumbUrl: string;
};

type Props = {
  photos: GalleryPhoto[];
  eventSlug: string;
  eventName: string;
  pricePerPhotoHnl: number;
  whatsapp: string;
};

export function GalleryClient({ photos, eventSlug, pricePerPhotoHnl, whatsapp }: Props) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = React.useState<string | null>(null);

  const selectedIds = React.useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected]
  );
  const total = selectedIds.length * pricePerPhotoHnl;

  const requestOrder = async (provider: "manual_whatsapp" | "clinpays") => {
    if (selectedIds.length === 0 || !name || !phone) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventSlug}/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          customer_whatsapp: phone,
          photo_ids: selectedIds,
          payment_provider: provider,
        }),
      });
      const body = (await res.json()) as {
        error?: string;
        whatsapp_url?: string;
        payment_url?: string | null;
      };
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      setPaymentUrl(body.payment_url || body.whatsapp_url || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la orden");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {photos.map((p) => (
          <button
            key={p.photoId}
            type="button"
            onClick={() => setSelected((s) => ({ ...s, [p.photoId]: !s[p.photoId] }))}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-white text-left transition",
              selected[p.photoId]
                ? "border-zinc-950 ring-2 ring-zinc-950"
                : "border-zinc-200 hover:border-zinc-300"
            )}
          >
            <div className="relative aspect-[4/3] bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.thumbUrl}
                alt="Foto"
                loading="lazy"
                className="h-full w-full object-cover"
              />
              {selected[p.photoId] ? (
                <span className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-zinc-950 text-white">
                  <CheckIcon />
                </span>
              ) : null}
            </div>
            <div className="flex items-center justify-between p-2 text-xs text-zinc-700">
              <span>{p.facesCount} rostros</span>
              <span>{formatHnl(pricePerPhotoHnl)}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="sticky bottom-3 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-zinc-700">
              {selectedIds.length} foto{selectedIds.length === 1 ? "" : "s"} seleccionada
              {selectedIds.length === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums">
              {formatHnl(total)}
            </p>
          </div>
          <div className="grid w-full gap-2 sm:max-w-md sm:grid-cols-2">
            <input
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
            <input
              type="tel"
              placeholder="Tu WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Button
            disabled={creating || selectedIds.length === 0 || !name || !phone}
            onClick={() => requestOrder("manual_whatsapp")}
            variant="secondary"
          >
            Solicitar por WhatsApp
          </Button>
          <Button
            disabled={creating || selectedIds.length === 0 || !name || !phone}
            onClick={() => requestOrder("clinpays")}
          >
            Pagar online (Clinpays)
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm font-medium text-red-700">{error}</p> : null}
        {paymentUrl ? (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-zinc-950 underline"
          >
            Continuar <ArrowRightIcon />
          </a>
        ) : null}
        <p className="mt-2 text-[11px] text-zinc-500">
          Pago vía Clinpays (Honduras) o coordinación directa con el fotógrafo. WhatsApp:{" "}
          {whatsapp || "—"}
        </p>
      </div>
    </div>
  );
}
