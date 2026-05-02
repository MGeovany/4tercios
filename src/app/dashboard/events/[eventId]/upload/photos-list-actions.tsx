"use client";

import * as React from "react";
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
import { DeletePhotoButton } from "./delete-photo-button";
import { RetryPhotoButton } from "./retry-photo-button";

type PhotosListActionsProps = {
  photos: PhotoRow[];
  previewUrls: Record<string, string | null>;
};

export function PhotosListActions({ photos, previewUrls }: PhotosListActionsProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewPhoto, setPreviewPhoto] = React.useState<PhotoRow | null>(null);

  const selectedCount = selectedIds.length;
  const allSelected = photos.length > 0 && selectedCount === photos.length;

  function toggleSelection(photoId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? current.includes(photoId)
          ? current
          : [...current, photoId]
        : current.filter((id) => id !== photoId)
    );
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? photos.map((photo) => photo.id) : []);
  }

  async function onBulkDelete() {
    if (deleting || selectedCount === 0) return;
    setDeleting(true);
    setError(null);

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

      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length > 0) {
        throw new Error(`Se borraron algunas fotos, pero ${failed.length} fallaron.`);
      }

      setConfirmOpen(false);
      setSelectedIds([]);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron borrar las fotos seleccionadas."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-2 text-xs text-zinc-600">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => toggleSelectAll(e.target.checked)}
            className="size-4 rounded border-zinc-300 accent-zinc-950"
          />
          Seleccionar todo
        </label>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => setConfirmOpen(true)}
          disabled={selectedCount === 0}
        >
          <Trash2 className="size-4" />
          Borrar seleccionadas ({selectedCount})
        </Button>
      </div>

      <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
        {photos.map((p) => (
          <li
            key={p.id}
            className="flex flex-col items-start justify-between gap-2 p-3 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIds.includes(p.id)}
                onChange={(e) => toggleSelection(p.id, e.target.checked)}
                className="mt-1 size-4 rounded border-zinc-300 accent-zinc-950"
                aria-label={`Seleccionar ${p.filename}`}
              />
              <div className="min-w-0">
                {previewUrls[p.id] ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewPhoto(p);
                      setPreviewOpen(true);
                    }}
                    className="mb-2 block overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
                    aria-label={`Vista previa de ${p.filename}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrls[p.id] as string}
                      alt={p.filename}
                      className="h-16 w-24 object-cover"
                    />
                  </button>
                ) : null}
                <p className="truncate text-sm font-medium text-zinc-950">{p.filename}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {p.faces_count} rostro{p.faces_count === 1 ? "" : "s"} ·{" "}
                  {new Date(p.created_at).toLocaleString("es-HN")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 self-end sm:self-auto">
              <Badge
                variant={
                  p.status === "ready" ? "success" : p.status === "error" ? "danger" : "info"
                }
              >
                {labelForStatus(p.status)}
              </Badge>
              {p.status === "error" ? <RetryPhotoButton photoId={p.id} /> : null}
              <DeletePhotoButton photoId={p.id} />
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={confirmOpen}
        onOpenChange={(next) => {
          setConfirmOpen(next);
          if (!next) setError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Borrar {selectedCount} imágenes?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán del evento y del almacenamiento.
            </DialogDescription>
          </DialogHeader>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
              onClick={onBulkDelete}
              disabled={deleting || selectedCount === 0}
            >
              <Trash2 className="size-4" />
              {deleting ? "Borrando..." : "Sí, borrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={previewOpen}
        onOpenChange={(next) => {
          setPreviewOpen(next);
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
            <p className="text-sm text-zinc-600">No hay vista previa disponible para esta foto.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
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
