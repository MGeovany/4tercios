import Link from "next/link";
import { redirect } from "next/navigation";

export default async function GalleryRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Legacy route — galleries now live under /dashboard/events/[eventId]/upload (private)
  // and /e/[slug]/results (public). For old shared links we just bounce back to the dashboard.
  redirect(`/dashboard/events/${id}/upload`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <p className="text-sm text-zinc-700">Redirigiendo...</p>
      <Link href="/dashboard" className="mt-4 inline-block underline">
        Volver al dashboard
      </Link>
    </div>
  );
}
