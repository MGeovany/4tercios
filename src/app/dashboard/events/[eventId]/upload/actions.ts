"use server";

import { revalidatePath } from "next/cache";

import { requirePhotographer } from "@/lib/server/auth";
import { updateEvent } from "@/lib/server/events";

export async function publishEventAction(eventId: string) {
  await requirePhotographer();

  await updateEvent(eventId, {
    status: "Listo",
    isPublic: true,
  });

  revalidatePath(`/dashboard/events/${eventId}/upload`);
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard");
}

