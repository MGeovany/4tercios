import { NextResponse, type NextRequest } from "next/server";

import { processPhoto } from "@/lib/server/photos";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_request: NextRequest, ctx: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await ctx.params;
  if (!photoId) {
    return NextResponse.json({ error: "photoId required" }, { status: 400 });
  }

  try {
    const photo = await processPhoto(photoId);
    return NextResponse.json({ photo });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
