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
    const message = getErrorMessage(err);
    console.error("[api/photos/:photoId/process] failed", {
      photoId,
      message,
      err,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null) {
    const maybe = err as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    const parts = [maybe.message, maybe.details, maybe.hint, maybe.code]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map((v) => v.trim());
    if (parts.length > 0) return parts.join(" | ");
  }
  return "Unknown error";
}
