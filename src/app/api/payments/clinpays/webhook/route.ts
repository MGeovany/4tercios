import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Clinpays payment status webhook.
 * Expected payload shape (subject to Clinpays' final docs — adjust mapping here):
 *   {
 *     "reference": "<order_id>",
 *     "status": "paid" | "failed" | "expired",
 *     "amount": 1200,
 *     "currency": "HNL",
 *     "transaction_id": "..."
 *   }
 *
 * The signature is sent in `x-clinpays-signature` and is HMAC-SHA256 of the raw
 * request body using CLINPAYS_WEBHOOK_SECRET.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CLINPAYS_WEBHOOK_SECRET;
  const raw = await request.text();

  if (secret) {
    const provided = request.headers.get("x-clinpays-signature") ?? "";
    const expected = createHmac("sha256", secret).update(raw).digest("hex");
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "bad signature" }, { status: 401 });
    }
  }

  let payload: { reference?: string; status?: string; transaction_id?: string };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!payload.reference || !payload.status) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const admin = getSupabaseServiceClient();
  const status =
    payload.status === "paid"
      ? "paid"
      : payload.status === "failed" || payload.status === "expired"
        ? "cancelled"
        : null;

  if (!status) return NextResponse.json({ ok: true, ignored: true });

  const update: Record<string, unknown> = {
    status,
    payment_reference: payload.transaction_id ?? null,
  };
  if (status === "paid") update.paid_at = new Date().toISOString();

  const { error } = await admin.from("orders").update(update).eq("id", payload.reference);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
