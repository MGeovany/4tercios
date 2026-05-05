"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeletePhotoButton({ photoId }: { photoId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onDelete() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "No se pudo borrar la foto.");
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo borrar la foto.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-zinc-500 hover:bg-red-50 hover:text-red-700"
          aria-label="Borrar imagen"
          disabled={deleting}
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Borrar imagen?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará la imagen de este evento.
          </DialogDescription>
        </DialogHeader>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={deleting}
          >
            <Trash2 className="size-4" />
            {deleting ? "Borrando..." : "Sí, borrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
