import { NextResponse, type NextRequest } from "next/server";

import { registerPhoto } from "@/lib/server/photos";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = payload as Partial<{
    event_id: string;
    filename: string;
    bytes: number;
  }>;

  if (!body.event_id || !body.filename || !Number.isFinite(body.bytes)) {
    return NextResponse.json(
      { error: "event_id, filename and bytes are required" },
      { status: 400 }
    );
  }

  try {
    const ext = (body.filename.split(".").pop() ?? "jpg").toLowerCase();
    const result = await registerPhoto({
      eventId: body.event_id,
      filename: body.filename,
      ext,
      bytes: Number(body.bytes),
    });
    return NextResponse.json({
      photo: result.photo,
      bucket: result.bucket,
      path: result.photo.storage_path,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
