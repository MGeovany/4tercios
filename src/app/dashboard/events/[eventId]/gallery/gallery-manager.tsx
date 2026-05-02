"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import type { PhotoRow } from "@/lib/db/types";
import { Badge } from "@/components/ui/badge";
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
import { DeletePhotoButton } from "../upload/delete-photo-button";
import { RetryPhotoButton } from "../upload/retry-photo-button";

type Counts = { all: number; ready: number; error: number; processing: number };
type Filter = "all" | "ready" | "error" | "processing";

const FILTERS: { value: Filter; label: (counts: Counts) => string }[] = [
  { value: "all", label: (c) => `Todas · ${c.all}` },
  { value: "ready", label: (c) => `Listas · ${c.ready}` },
  { value: "processing", label: (c) => `En cola · ${c.processing}` },
  { value: "error", label: (c) => `Errores · ${c.error}` },
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
  const router = useRouter();
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [bulkError, setBulkError] = React.useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = React.useState<PhotoRow | null>(null);

  const selectedIds = React.useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected]
  );

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function clear() {
    setSelected({});
  }

  function selectAll() {
    setSelected(Object.fromEntries(photos.map((p) => [p.id, true])));
  }

  async function bulkDelete() {
    if (deleting || selectedIds.length === 0) return;
    setDeleting(true);
    setBulkError(null);

    try {
      const results = await Promise.allSettled(
        selectedIds.map(async (photoId) => {
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
      clear();
      router.refresh();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "No se pudieron borrar las fotos.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/dashboard/events/${eventId}/gallery?filter=${f.value}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                filter === f.value
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
              )}
            >
              {f.label(counts)}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={selectAll}
            disabled={photos.length === 0}
          >
            Seleccionar todo
          </Button>
          {selectedIds.length > 0 ? (
            <Button type="button" size="sm" variant="ghost" onClick={clear}>
              Limpiar
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            disabled={selectedIds.length === 0}
          >
            <Trash2 className="size-4" />
            Borrar ({selectedIds.length})
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center text-sm text-zinc-600">
          No hay fotos con este filtro.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {photos.map((p) => {
            const url = previewUrls[p.id];
            const isSelected = !!selected[p.id];
            return (
              <div
                key={p.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition",
                  isSelected
                    ? "border-zinc-950 ring-2 ring-zinc-950"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(p)}
                  className="relative block aspect-4/3 w-full overflow-hidden bg-zinc-100"
                  aria-label={`Ver ${p.filename} en grande`}
                >
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={p.filename}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-zinc-400">
                      Sin vista previa
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant={
                        p.status === "ready" ? "success" : p.status === "error" ? "danger" : "info"
                      }
                    >
                      {labelForStatus(p.status)}
                    </Badge>
                  </div>
                  <label
                    className="absolute top-2 right-2 cursor-pointer rounded-md bg-white/90 px-1.5 py-1 backdrop-blur"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(p.id)}
                      className="size-4 rounded border-zinc-300 accent-zinc-950"
                      aria-label={`Seleccionar ${p.filename}`}
                    />
                  </label>
                </button>
                <div className="space-y-1 p-2.5">
                  <p className="truncate text-xs font-medium text-zinc-900">{p.filename}</p>
                  <p className="text-[11px] text-zinc-500">
                    {p.faces_count} rostro{p.faces_count === 1 ? "" : "s"}
                  </p>
                  {p.status === "error" && p.error_message ? (
                    <p className="line-clamp-2 text-[11px] text-red-600">{p.error_message}</p>
                  ) : null}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {p.status === "error" ? <RetryPhotoButton photoId={p.id} /> : <span />}
                    <DeletePhotoButton photoId={p.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={confirmOpen}
        onOpenChange={(next) => {
          setConfirmOpen(next);
          if (!next) setBulkError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Borrar {selectedIds.length} fotos?</DialogTitle>
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
              disabled={deleting || selectedIds.length === 0}
            >
              <Trash2 className="size-4" />
              {deleting ? "Borrando..." : "Sí, borrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewPhoto}
        onOpenChange={(next) => {
          if (!next) setPreviewPhoto(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewPhoto?.filename ?? "Vista previa"}</DialogTitle>
            <DialogDescription>
              {previewPhoto
                ? `${previewPhoto.faces_count} rostro${previewPhoto.faces_count === 1 ? "" : "s"}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {previewPhoto && previewUrls[previewPhoto.id] ? (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrls[previewPhoto.id] as string}
                alt={previewPhoto.filename}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
          ) : (
            <p className="text-sm text-zinc-600">No hay vista previa disponible.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function labelForStatus(status: string) {
  switch (status) {
    case "ready":
      return "Lista";
    case "error":
      return "Error";
    case "processing":
      return "Procesando";
    case "uploaded":
      return "Subida";
    default:
      return status;
  }
}
