"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DotsHorizontalIcon,
  ImageIcon,
  Pencil1Icon,
  ReloadIcon,
  TrashIcon,
} from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function EventRowActions({
  eventId,
  status,
  purgedAt,
}: {
  eventId: string;
  status: string;
  purgedAt?: string | null;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reopening, setReopening] = React.useState(false);

  async function onDelete() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/id/${eventId}`, { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error || "No se pudo borrar el evento");
      }
      setConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar el evento");
    } finally {
      setDeleting(false);
    }
  }

  async function onReopen() {
    if (reopening) return;
    setReopening(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/id/${eventId}/reopen`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || "No se pudo reabrir el evento");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reabrir el evento");
    } finally {
      setReopening(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-zinc-500 hover:text-zinc-900"
            aria-label="Acciones del evento"
          >
            <DotsHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {status === "Archivado" && !purgedAt ? (
            <DropdownMenuItem onClick={onReopen} disabled={reopening}>
              <ReloadIcon />
              {reopening ? "Reabriendo..." : "Reabrir 30 días"}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/events/${eventId}/gallery`}>
              <ImageIcon />
              Galería
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/events/${eventId}/edit`}>
              <Pencil1Icon />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 focus:text-red-700"
            onClick={() => setConfirmOpen(true)}
          >
            <TrashIcon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
              Se borrarán también sus fotos, rostros y órdenes asociadas. Esta acción no se puede
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
