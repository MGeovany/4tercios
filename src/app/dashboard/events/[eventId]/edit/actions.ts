"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requirePhotographer } from "@/lib/server/auth";
import { updateEvent, deleteEvent, type UpdateEventInput } from "@/lib/server/events";

export type SaveEventResult = { ok: true } | { ok: false; error: string };

export async function saveEventAction(
  eventId: string,
  patch: UpdateEventInput
): Promise<SaveEventResult> {
  try {
    await requirePhotographer();
    await updateEvent(eventId, patch);
    revalidatePath(`/dashboard/events/${eventId}/edit`);
    revalidatePath(`/dashboard/events/${eventId}/upload`);
    revalidatePath("/dashboard/events");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error inesperado" };
  }
}

export async function deleteEventAction(eventId: string): Promise<SaveEventResult> {
  try {
    await requirePhotographer();
    await deleteEvent(eventId);
    revalidatePath("/dashboard/events");
    revalidatePath("/dashboard");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error inesperado" };
  }
  redirect("/dashboard/events");
}
