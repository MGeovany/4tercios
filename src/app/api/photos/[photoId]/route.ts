import { NextResponse, type NextRequest } from "next/server";

import { deletePhoto } from "@/lib/server/photos";

export const runtime = "nodejs";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  if (!photoId) {
    return NextResponse.json({ error: "photoId is required" }, { status: 400 });
  }

  try {
    const deleted = await deletePhoto(photoId);
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
