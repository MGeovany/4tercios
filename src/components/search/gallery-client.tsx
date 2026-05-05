"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatHnl } from "@/lib/currency";
import { type WatermarkFontId, type WatermarkStyle } from "@/lib/branding";
import { WatermarkOverlay } from "@/components/photo/watermark-overlay";

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
  watermarkStyle?: WatermarkStyle;
  watermarkColor?: string;
  watermarkLabel?: string;
  watermarkFont?: WatermarkFontId;
  watermarkOpacity?: number;
  watermarkDensity?: number;
};

type ViewFilter = "all" | "withFaces" | "selected";

export function GalleryClient({
  photos,
  eventSlug,
  pricePerPhotoHnl,
  whatsapp,
  watermarkStyle = "subtle",
  watermarkColor = "#ffffff",
  watermarkLabel = "4Tercios",
  watermarkFont = "sans",
  watermarkOpacity = 0.08,
  watermarkDensity = 1,
}: Props) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<ViewFilter>("all");
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  const selectedIds = React.useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected]
  );
  const total = selectedIds.length * pricePerPhotoHnl;

  const visiblePhotos = React.useMemo(() => {
    switch (filter) {
      case "withFaces":
        return photos.filter((p) => p.facesCount > 0);
      case "selected":
        return photos.filter((p) => selected[p.photoId]);
      default:
        return photos;
    }
  }, [photos, filter, selected]);

  const previewPhoto = React.useMemo(
    () => photos.find((p) => p.photoId === previewId) ?? null,
    [photos, previewId]
  );

  const toggle = React.useCallback((photoId: string) => {
    setSelected((s) => ({ ...s, [photoId]: !s[photoId] }));
  }, []);

  const clearSelection = React.useCallback(() => setSelected({}), []);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            label={`Todas · ${photos.length}`}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterChip
            label="Con rostros"
            active={filter === "withFaces"}
            onClick={() => setFilter("withFaces")}
          />
          <FilterChip
            label={`Seleccionadas · ${selectedIds.length}`}
            active={filter === "selected"}
            onClick={() => setFilter("selected")}
            disabled={selectedIds.length === 0}
          />
        </div>
        {selectedIds.length > 0 ? (
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs font-medium text-zinc-500 underline underline-offset-4 hover:text-zinc-950"
          >
            Limpiar selección
          </button>
        ) : null}
      </div>

      {visiblePhotos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-600">
          No hay fotos para mostrar con este filtro.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {visiblePhotos.map((p) => (
            <PhotoTile
              key={p.photoId}
              photo={p}
              selected={!!selected[p.photoId]}
              onToggle={() => toggle(p.photoId)}
              onPreview={() => setPreviewId(p.photoId)}
              pricePerPhotoHnl={pricePerPhotoHnl}
              watermarkStyle={watermarkStyle}
              watermarkColor={watermarkColor}
              watermarkLabel={watermarkLabel}
              watermarkFont={watermarkFont}
              watermarkOpacity={watermarkOpacity}
              watermarkDensity={watermarkDensity}
            />
          ))}
        </div>
      )}

      <div className="sticky bottom-3 z-20 overflow-hidden rounded-3xl border border-zinc-200 bg-white/95 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.18)] backdrop-blur">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="border-zinc-200">
              Pedido
            </Badge>
            <p className="text-xs text-zinc-500">
              Confirma tus fotos y completa tu compra
            </p>
          </div>
          <p className="hidden text-[11px] text-zinc-400 sm:block">
            Pago seguro · Envío inmediato
          </p>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-end sm:gap-6">
          <div>
            <p className="text-[11px] font-medium tracking-widest text-zinc-500 uppercase">
              {selectedIds.length} foto{selectedIds.length === 1 ? "" : "s"} seleccionada
              {selectedIds.length === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950 tabular-nums sm:text-4xl">
              {formatHnl(total)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Precio por foto: {formatHnl(pricePerPhotoHnl)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="gallery-name" className="text-xs">
                Tu nombre
              </Label>
              <Input
                id="gallery-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Ana López"
                autoComplete="name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gallery-phone" className="text-xs">
                Tu WhatsApp
              </Label>
              <Input
                id="gallery-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+504 9999-1234"
                autoComplete="tel"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-2 border-t border-zinc-100 bg-zinc-50/50 p-4 sm:grid-cols-2 sm:px-5">
          <Button
            disabled={creating || selectedIds.length === 0 || !name || !phone}
            onClick={() => requestOrder("manual_whatsapp")}
            variant="secondary"
            size="lg"
          >
            Solicitar por WhatsApp
          </Button>
          <Button
            disabled={creating || selectedIds.length === 0 || !name || !phone}
            onClick={() => requestOrder("clinpays")}
            size="lg"
          >
            {creating ? "Procesando..." : "Pagar online"} <ArrowRightIcon />
          </Button>
        </div>

        {error ? (
          <p className="border-t border-red-100 bg-red-50/60 px-5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        {paymentUrl ? (
          <div className="border-t border-emerald-100 bg-emerald-50/70 px-5 py-3">
            <a
              href={paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 underline underline-offset-4"
            >
              Continuar al siguiente paso <ArrowRightIcon />
            </a>
          </div>
        ) : null}

        <p className="border-t border-zinc-100 px-5 py-2.5 text-[11px] text-zinc-500">
          Pago vía Clinpays (Honduras)
        </p>
      </div>

      {previewPhoto ? (
        <PreviewLightbox
          photo={previewPhoto}
          onClose={() => setPreviewId(null)}
          selected={!!selected[previewPhoto.photoId]}
          onToggle={() => toggle(previewPhoto.photoId)}
          pricePerPhotoHnl={pricePerPhotoHnl}
          watermarkStyle={watermarkStyle}
          watermarkColor={watermarkColor}
          watermarkLabel={watermarkLabel}
          watermarkFont={watermarkFont}
          watermarkOpacity={watermarkOpacity}
          watermarkDensity={watermarkDensity}
        />
      ) : null}
    </div>
  );
}

function FilterChip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-zinc-950 bg-zinc-950 text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
        disabled ? "cursor-not-allowed opacity-50 hover:bg-white" : ""
      )}
    >
      {label}
    </button>
  );
}

function PhotoTile({
  photo,
  selected,
  onToggle,
  onPreview,
  pricePerPhotoHnl,
  watermarkStyle,
  watermarkColor,
  watermarkLabel,
  watermarkFont,
  watermarkOpacity,
  watermarkDensity,
}: {
  photo: GalleryPhoto;
  selected: boolean;
  onToggle: () => void;
  onPreview: () => void;
  pricePerPhotoHnl: number;
  watermarkStyle: WatermarkStyle;
  watermarkColor: string;
  watermarkLabel: string;
  watermarkFont: WatermarkFontId;
  watermarkOpacity: number;
  watermarkDensity: number;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition",
        selected
          ? "border-zinc-950 ring-2 ring-zinc-950"
          : "border-zinc-200/80 hover:border-zinc-300"
      )}
    >
      <button
        type="button"
        onClick={onPreview}
        className="relative block aspect-4/3 w-full overflow-hidden bg-zinc-100"
        aria-label="Ver foto en grande"
      >
        <Image
          src={photo.thumbUrl}
          alt="Foto"
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition group-hover:scale-105"
        />
        <WatermarkOverlay
          label={watermarkLabel}
          style={watermarkStyle}
          color={watermarkColor}
          font={watermarkFont}
          opacity={watermarkOpacity}
          tileDensity={watermarkDensity}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/35 to-transparent opacity-0 transition group-hover:opacity-100" />
        {selected ? (
          <span className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-zinc-950 text-white shadow">
            <CheckIcon />
          </span>
        ) : null}
        {photo.facesCount > 0 ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
            {photo.facesCount} {photo.facesCount === 1 ? "rostro" : "rostros"}
          </span>
        ) : null}
      </button>
      <div className="flex items-center justify-between gap-2 p-2.5">
        <span className="text-xs font-medium text-zinc-700">
          {formatHnl(pricePerPhotoHnl)}
        </span>
        <Button
          type="button"
          size="sm"
          variant={selected ? "default" : "secondary"}
          onClick={onToggle}
        >
          {selected ? "Seleccionada" : "Seleccionar"}
        </Button>
      </div>
    </div>
  );
}

function PreviewLightbox({
  photo,
  onClose,
  selected,
  onToggle,
  pricePerPhotoHnl,
  watermarkStyle,
  watermarkColor,
  watermarkLabel,
  watermarkFont,
  watermarkOpacity,
  watermarkDensity,
}: {
  photo: GalleryPhoto;
  onClose: () => void;
  selected: boolean;
  onToggle: () => void;
  pricePerPhotoHnl: number;
  watermarkStyle: WatermarkStyle;
  watermarkColor: string;
  watermarkLabel: string;
  watermarkFont: WatermarkFontId;
  watermarkOpacity: number;
  watermarkDensity: number;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-4/3 bg-zinc-950">
          <Image
            src={photo.thumbUrl}
            alt="Vista previa"
            fill
            sizes="(min-width: 1024px) 900px, 100vw"
            className="object-contain"
          />
          <WatermarkOverlay
            label={watermarkLabel}
            style={watermarkStyle}
            color={watermarkColor}
            font={watermarkFont}
            density="preview"
            opacity={watermarkOpacity}
            tileDensity={watermarkDensity}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-zinc-950/95 p-4 text-white">
          <div>
            <p className="text-xs text-zinc-300">Precio por foto</p>
            <p className="text-base font-semibold">{formatHnl(pricePerPhotoHnl)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button onClick={onToggle}>
              {selected ? "Quitar de la selección" : "Agregar al pedido"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
