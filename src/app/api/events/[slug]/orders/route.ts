import { NextResponse, type NextRequest } from "next/server";

import { createOrder } from "@/lib/server/orders";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const body = payload as Partial<{
    customer_name: string;
    customer_whatsapp: string;
    customer_email: string;
    photo_ids: string[];
    selfie_query_id: string;
    payment_provider: "manual_whatsapp" | "clinpays";
  }>;

  if (!body.customer_name || !body.customer_whatsapp || !Array.isArray(body.photo_ids)) {
    return NextResponse.json(
      { error: "customer_name, customer_whatsapp y photo_ids son requeridos" },
      { status: 400 }
    );
  }

  try {
    const result = await createOrder({
      eventSlug: slug,
      customerName: body.customer_name,
      customerWhatsapp: body.customer_whatsapp,
      customerEmail: body.customer_email ?? null,
      photoIds: body.photo_ids,
      selfieQueryId: body.selfie_query_id ?? null,
      paymentProvider: body.payment_provider ?? "manual_whatsapp",
    });

    return NextResponse.json({
      order_id: result.order.id,
      total_hnl: result.order.total_hnl,
      payment_url: result.paymentUrl,
      whatsapp_url: result.whatsappUrl,
      photo_ids: result.order.photo_ids,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
