import { NextResponse, type NextRequest } from "next/server";

import { getPublicEventBySlug } from "@/lib/server/events";
import { searchEventBySelfie } from "@/lib/server/search";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  const event = await getPublicEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }

  let bytes: Buffer;
  let contentType = "image/jpeg";
  try {
    const ct = request.headers.get("content-type") ?? "";
    if (ct.startsWith("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("selfie");
      if (!(file instanceof Blob)) {
        return NextResponse.json({ error: "Falta el campo 'selfie'" }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: "La selfie es demasiado grande" },
          { status: 400 }
        );
      }
      bytes = Buffer.from(await file.arrayBuffer());
      contentType = file.type || contentType;
    } else if (ct.startsWith("application/json")) {
      const body = (await request.json()) as { dataUrl?: string };
      if (!body.dataUrl) {
        return NextResponse.json({ error: "Falta dataUrl" }, { status: 400 });
      }
      const decoded = decodeDataUrl(body.dataUrl);
      if (!decoded) {
        return NextResponse.json({ error: "dataUrl inválido" }, { status: 400 });
      }
      if (decoded.bytes.length > MAX_BYTES) {
        return NextResponse.json(
          { error: "La selfie es demasiado grande" },
          { status: 400 }
        );
      }
      bytes = decoded.bytes;
      contentType = decoded.contentType;
    } else {
      bytes = Buffer.from(await request.arrayBuffer());
      contentType = request.headers.get("content-type") ?? contentType;
      if (bytes.length === 0) {
        return NextResponse.json({ error: "Cuerpo vacío" }, { status: 400 });
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cuerpo inválido" },
      { status: 400 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  try {
    const result = await searchEventBySelfie({
      event,
      selfieBytes: bytes,
      contentType,
      ip,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

function decodeDataUrl(value: string) {
  const match = /^data:([\w/+\-.]+);base64,(.*)$/i.exec(value);
  if (!match) return null;
  return {
    contentType: match[1],
    bytes: Buffer.from(match[2], "base64"),
  };
}
