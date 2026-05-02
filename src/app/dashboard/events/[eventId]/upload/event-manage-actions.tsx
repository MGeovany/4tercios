"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function EventManageActions({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onDelete() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/id/${eventId}`, { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error || "No se pudo borrar el evento.");
      }
      router.push("/dashboard/events");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar el evento.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild variant="secondary">
          <Link href={`/dashboard/events/${eventId}/edit`}>
            <Pencil1Icon /> Editar evento
          </Link>
        </Button>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          <TrashIcon /> Eliminar evento
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(next) => {
          setConfirmOpen(next);
          if (!next) setError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar evento?</DialogTitle>
            <DialogDescription>
              Se borrarán también las fotos, rostros y órdenes asociadas. Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" variant="destructive" disabled={deleting} onClick={onDelete}>
              {deleting ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

