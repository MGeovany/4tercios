"use server";

import { redirect } from "next/navigation";

import { createEvent } from "@/lib/server/events";
import { requirePhotographer } from "@/lib/server/auth";
import type { EventType } from "@/lib/db/types";

export type CreateEventActionInput = {
  name: string;
  type: EventType;
  date: string;
  city?: string;
  venue?: string;
  description?: string;
  pricePerPhotoHnl: number;
  onlineDays: number;
  whatsapp?: string;
  slug: string;
};

export type CreateEventActionResult = { ok: true; eventId: string } | { ok: false; error: string };

export async function createEventAction(
  input: CreateEventActionInput
): Promise<CreateEventActionResult> {
  try {
    await requirePhotographer();
    const event = await createEvent({
      name: input.name,
      type: input.type,
      date: input.date,
      city: input.city,
      venue: input.venue,
      description: input.description,
      pricePerPhotoHnl: input.pricePerPhotoHnl,
      onlineDays: input.onlineDays,
      whatsapp: input.whatsapp,
      slug: input.slug,
    });
    return { ok: true, eventId: event.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return { ok: false, error: message };
  }
}

export async function redirectToUpload(eventId: string) {
  redirect(`/dashboard/events/${eventId}/upload`);
}
