"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function PublishEventButton({
  disabled,
  isPublished,
}: {
  disabled: boolean;
  isPublished: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending ? "Publicando..." : isPublished ? "Evento publicado" : "Publicar evento"}
    </Button>
  );
}

export function SaveDraftButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="secondary"
      className="w-full"
      disabled={disabled || pending}
    >
      {pending ? "Guardando..." : "Salvar como draft"}
    </Button>
  );
}
