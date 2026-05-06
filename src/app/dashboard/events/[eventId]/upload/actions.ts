"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePhotographer } from "@/lib/server/auth";
import { updateEvent } from "@/lib/server/events";
import { resolvePublicUsername } from "@/lib/public-event-path";

export async function publishEventAction(eventId: string, slug: string) {
  const { photographer } = await requirePhotographer();
  const publicUsername = resolvePublicUsername(photographer.business_name);
  const publicBasePath = `/${publicUsername}/${slug}`;

  await updateEvent(eventId, {
    status: "Listo",
    isPublic: true,
  });

  revalidatePath(`/dashboard/events/${eventId}/upload`);
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard");
  revalidatePath(`/${publicUsername}`);
  revalidatePath(publicBasePath);
  revalidatePath(`${publicBasePath}/results`);
  revalidatePath(`/e/${slug}`);
  revalidatePath(`/e/${slug}/results`);

  redirect(publicBasePath);
}

export async function saveEventAsDraftAction(eventId: string) {
  await requirePhotographer();

  await updateEvent(eventId, {
    status: "Borrador",
    isPublic: false,
  });

  revalidatePath(`/dashboard/events/${eventId}/upload`);
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard");
}
