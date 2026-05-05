import { NextResponse, type NextRequest } from "next/server";

import { requirePhotographer } from "@/lib/server/auth";
import { listFailedPhotoIdsForEvent, processPhoto } from "@/lib/server/photos";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PARALLEL = 3;

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await ctx.params;
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  try {
    await requirePhotographer();
    const keepPrivate = request.nextUrl.searchParams.get("keepPrivate") === "1";
    const supabase = await getSupabaseServerClient();
    if (keepPrivate) {
      await supabase.from("events").update({ is_public: false }).eq("id", eventId);
    }
    const ids = await listFailedPhotoIdsForEvent(eventId);
    if (ids.length === 0) {
      return NextResponse.json({
        ok: true,
        attempted: 0,
        succeeded: 0,
        failed: 0,
        errors: [],
      });
    }

    const errors: { photoId: string; message: string }[] = [];
    let succeeded = 0;

    for (let i = 0; i < ids.length; i += MAX_PARALLEL) {
      const batch = ids.slice(i, i + MAX_PARALLEL);
      const results = await Promise.allSettled(batch.map((id) => processPhoto(id)));
      results.forEach((res, idx) => {
        if (res.status === "fulfilled") {
          succeeded += 1;
        } else {
          errors.push({
            photoId: batch[idx],
            message: res.reason instanceof Error ? res.reason.message : "Unknown error",
          });
        }
      });
    }

    if (keepPrivate) {
      await supabase.from("events").update({ is_public: false }).eq("id", eventId);
    }

    return NextResponse.json({
      ok: true,
      attempted: ids.length,
      succeeded,
      failed: errors.length,
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
