import { NextResponse, type NextRequest } from "next/server";

import { requirePhotographer } from "@/lib/server/auth";
import { deleteEvent } from "@/lib/server/events";

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await ctx.params;
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  try {
    await requirePhotographer();
    await deleteEvent(eventId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
