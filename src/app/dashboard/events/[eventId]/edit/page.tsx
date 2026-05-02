import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon } from "@radix-ui/react-icons";

import { Topbar } from "@/components/shell/topbar";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/server/auth";
import { getEventByIdForPhotographer } from "@/lib/server/events";
import { EditEventForm } from "./edit-form";

export default async function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  await requirePhotographer();

  const event = await getEventByIdForPhotographer(eventId);
  if (!event) notFound();

  return (
    <>
      <Topbar
        title="Editar evento"
        subtitle={event.name}
        right={
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/e/${event.slug}`} target="_blank">
              <ExternalLinkIcon /> Ver público
            </Link>
          </Button>
        }
      />
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-950"
        >
          <ArrowLeftIcon className="size-3" />
          Volver al dashboard
        </Link>

        <EditEventForm event={event} />
      </div>
    </>
  );
}
