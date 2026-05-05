"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Loader2,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react";

import type { PhotoRow } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Counts = { all: number; ready: number; error: number; processing: number };
type Filter = "all" | "ready" | "error" | "processing";

const FILTERS: { value: Filter; label: string; key: keyof Counts }[] = [
  { value: "all", label: "Todas", key: "all" },
  { value: "ready", label: "Listas", key: "ready" },
  { value: "processing", label: "En cola", key: "processing" },
  { value: "error", label: "Errores", key: "error" },
];

export function GalleryManager({
  eventId,
  photos,
  previewUrls,
  counts,
  filter,
}: {
  eventId: string;
  photos: PhotoRow[];
  previewUrls: Record<string, string | null>;
  counts: Counts;
  filter: Filter;
}) {
  const { refresh } = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [bulkError, setBulkError] = React.useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);
  const [retryingId, setRetryingId] = React.useState<string | null>(null);

  const selectedCount = selected.size;
  const selectionMode = selectedCount > 0;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function selectAll() {
    setSelected(new Set(photos.map((p) => p.id)));
  }

  async function bulkDelete() {
    if (deleting || selectedCount === 0) return;
    setDeleting(true);
    setBulkError(null);

    try {
      const ids = Array.from(selected);
      const results = await Promise.allSettled(
        ids.map(async (photoId) => {
          const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(body.error || "No se pudo borrar una foto.");
          }
        })
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        setBulkError(`Se borraron algunas, pero ${failed} fallaron.`);
      } else {
        setConfirmOpen(false);
      }
      clearSelection();
      refresh();
    } catch (err) {
      setBulkError(
        err instanceof Error ? err.message : "No se pudieron borrar las fotos."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function retryPhoto(photoId: string) {
    if (retryingId) return;
    setRetryingId(photoId);
    try {
      const res = await fetch(`/api/photos/${photoId}/process`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Reintento falló");
      }
      refresh();
    } catch {
      // surfaced silently; the badge will still indicate the error.
    } finally {
      setRetryingId(null);
    }
  }

  const openPreviewAt = React.useCallback((idx: number) => {
    setPreviewIndex(idx);
  }, []);

  const goPrev = React.useCallback(() => {
    setPreviewIndex((i) => {
      if (i == null) return i;
      return i === 0 ? photos.length - 1 : i - 1;
    });
  }, [photos.length]);

  const goNext = React.useCallback(() => {
    setPreviewIndex((i) => {
      if (i == null) return i;
      return i === photos.length - 1 ? 0 : i + 1;
    });
  }, [photos.length]);

  React.useEffect(() => {
    if (previewIndex == null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "Escape") {
        setPreviewIndex(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewIndex, goNext, goPrev]);

  const previewPhoto = previewIndex != null ? photos[previewIndex] : null;
  const previewUrl = previewPhoto ? previewUrls[previewPhoto.id] : null;

  return (
    <div className="space-y-5 pb-28">
      {/* Toolbar: minimalist segmented control + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filtros de fotos"
          className="inline-flex items-center gap-0.5 rounded-full border border-zinc-200 bg-zinc-50/80 p-1 backdrop-blur"
        >
          {FILTERS.map((f) => {
            const isActive = filter === f.value;
            const count = counts[f.key];
            return (
              <Link
                key={f.value}
                href={`/dashboard/events/${eventId}/gallery?filter=${f.value}`}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                  isActive
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
              >
                <span>{f.label}</span>
                <span
                  className={cn(
                    "tabular-nums",
                    isActive ? "text-white/70" : "text-zinc-400"
                  )}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {selectionMode ? (
            <span className="tabular-nums">{selectedCount} seleccionadas</span>
          ) : (
            <span>{photos.length} fotos</span>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
            onClick={selectionMode ? clearSelection : selectAll}
            disabled={photos.length === 0}
          >
            {selectionMode ? "Limpiar selección" : "Seleccionar todo"}
          </Button>
        </div>
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {photos.map((p, idx) => {
            const url = previewUrls[p.id];
            const isSelected = selected.has(p.id);
            const isError = p.status === "error";
            const isProcessing = p.status === "processing" || p.status === "uploaded";

            return (
              <div
                key={p.id}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-xl bg-zinc-100",
                  "ring-1 ring-zinc-200/80 transition",
                  isSelected && "ring-2 ring-zinc-950 ring-offset-2 ring-offset-white"
                )}
              >
                {/* Thumbnail (clickable to open preview) */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectionMode) {
                      toggle(p.id);
                    } else {
                      openPreviewAt(idx);
                    }
                  }}
                  className="absolute inset-0 block h-full w-full"
                  aria-label={`Ver ${p.filename}`}
                >
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={p.filename}
                      loading="lazy"
                      className={cn(
                        "h-full w-full object-cover transition duration-300",
                        "group-hover:scale-[1.03]",
                        isSelected && "scale-[0.97] opacity-90"
                      )}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-zinc-100">
                      <ImageOff className="size-6 text-zinc-300" />
                    </div>
                  )}
                </button>

                {/* Bottom gradient with filename (hover) */}
                <div
                  className={cn(
                    "pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/30 to-transparent px-3 pt-8 pb-2",
                    "opacity-0 transition group-hover:opacity-100",
                    isSelected && "opacity-100"
                  )}
                >
                  <p className="truncate text-[11px] font-medium text-white">
                    {p.filename}
                  </p>
                  {p.faces_count > 0 ? (
                    <p className="text-[10px] text-white/70">
                      {p.faces_count} rostro{p.faces_count === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </div>

                {/* Selection checkbox (top-left) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(p.id);
                  }}
                  aria-label={isSelected ? "Quitar selección" : "Seleccionar"}
                  className={cn(
                    "absolute top-2 left-2 grid size-6 place-items-center rounded-full border transition",
                    isSelected
                      ? "border-zinc-950 bg-zinc-950 text-white opacity-100"
                      : "border-white/80 bg-white/30 text-transparent opacity-0 backdrop-blur group-hover:opacity-100",
                    selectionMode &&
                      !isSelected &&
                      "border-zinc-300 bg-white/80 opacity-100"
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </button>

                {/* Status indicator (top-right) */}
                {isError ? (
                  <span
                    className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-red-500/95 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
                    title={p.error_message ?? "Error al procesar"}
                  >
                    <AlertCircle className="size-3" />
                    Error
                  </span>
                ) : isProcessing ? (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 shadow-sm backdrop-blur">
                    <Loader2 className="size-3 animate-spin" />
                    Procesando
                  </span>
                ) : null}

                {/* Retry action for error photos */}
                {isError ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void retryPhoto(p.id);
                    }}
                    disabled={retryingId === p.id}
                    aria-label="Reintentar"
                    className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-medium text-zinc-800 shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-60"
                  >
                    <RefreshCcw
                      className={cn("size-3", retryingId === p.id && "animate-spin")}
                    />
                    {retryingId === p.id ? "..." : "Reintentar"}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating action bar */}
      {selectionMode ? (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white/95 p-1 pl-4 shadow-lg backdrop-blur">
            <span className="text-xs font-medium text-zinc-900 tabular-nums">
              {selectedCount} seleccionada{selectedCount === 1 ? "" : "s"}
            </span>
            <span className="mx-1 h-4 w-px bg-zinc-200" aria-hidden />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-full text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              onClick={clearSelection}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Borrar
            </Button>
          </div>
        </div>
      ) : null}

      {/* Bulk delete confirm */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(next) => {
          setConfirmOpen(next);
          if (!next) setBulkError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Borrar {selectedCount} fotos?</DialogTitle>
            <DialogDescription>
              Se eliminarán del evento y del almacenamiento. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {bulkError ? <p className="text-sm text-red-600">{bulkError}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={bulkDelete}
              disabled={deleting || selectedCount === 0}
            >
              <Trash2 className="size-4" />
              {deleting ? "Borrando..." : "Sí, borrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox preview */}
      <Lightbox
        open={previewIndex != null}
        photo={previewPhoto}
        photoUrl={previewUrl ?? null}
        position={previewIndex != null ? previewIndex + 1 : 0}
        total={photos.length}
        onClose={() => setPreviewIndex(null)}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-20 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-zinc-100">
        <ImageOff className="size-5 text-zinc-400" />
      </div>
      <p className="text-sm font-medium text-zinc-900">No hay fotos en esta vista</p>
      <p className="mt-1 text-xs text-zinc-500">
        Cambia el filtro o sube nuevas fotos al evento.
      </p>
    </div>
  );
}

function Lightbox({
  open,
  photo,
  photoUrl,
  position,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  open: boolean;
  photo: PhotoRow | null;
  photoUrl: string | null;
  position: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!open || !photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={photo.filename}
      tabIndex={0}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{photo.filename}</p>
          <p className="text-[11px] text-white/60">
            {position} / {total}
            {photo.faces_count > 0
              ? ` · ${photo.faces_count} rostro${photo.faces_count === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Prev */}
      {total > 1 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-3 grid size-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
          aria-label="Anterior"
        >
          <ChevronLeft className="size-5" />
        </button>
      ) : null}

      {/* Next */}
      {total > 1 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-3 grid size-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
          aria-label="Siguiente"
        >
          <ChevronRight className="size-5" />
        </button>
      ) : null}

      {/* Image */}
      <div className="flex max-h-[88vh] max-w-[92vw] items-center justify-center">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={photo.filename}
            className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
          />
        ) : (
          <p className="text-sm text-white/70">No hay vista previa disponible.</p>
        )}
      </div>
    </div>
  );
}
