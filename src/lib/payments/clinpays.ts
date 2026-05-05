import "server-only";

/**
 * Clinpays integration adapter.
 *
 * Clinpays is the chosen payment processor for Honduras. The real API contract
 * is documented at: https://clinpays.com (private merchant docs).
 *
 * Today we wrap their REST endpoint behind this interface. For production, set:
 *   CLINPAYS_API_BASE      e.g. https://api.clinpays.com
 *   CLINPAYS_MERCHANT_ID
 *   CLINPAYS_API_KEY
 *   CLINPAYS_RETURN_URL    where customers land after paying
 *   CLINPAYS_WEBHOOK_SECRET for verifying status callbacks
 *
 * When any of the above is missing we fall back to the manual flow
 * (the order is still persisted; payment_url stays null and the photographer
 * coordinates by WhatsApp).
 */

export type CreateClinpaysSessionInput = {
  orderId: string;
  amountHnl: number;
  description: string;
  customerName: string;
  customerWhatsapp: string;
  customerEmail?: string | null;
};

export type ClinpaysSession = {
  paymentUrl: string;
  reference: string;
};

export function isClinpaysConfigured() {
  return Boolean(
    process.env.CLINPAYS_API_BASE &&
    process.env.CLINPAYS_MERCHANT_ID &&
    process.env.CLINPAYS_API_KEY
  );
}

export async function createClinpaysSession(
  input: CreateClinpaysSessionInput
): Promise<ClinpaysSession> {
  if (!isClinpaysConfigured()) {
    throw new Error("Clinpays no está configurado. Configura CLINPAYS_* en el servidor.");
  }

  const base = process.env.CLINPAYS_API_BASE!.replace(/\/$/, "");
  const apiKey = process.env.CLINPAYS_API_KEY!;
  const merchantId = process.env.CLINPAYS_MERCHANT_ID!;
  const returnUrl = process.env.CLINPAYS_RETURN_URL ?? "";

  const res = await fetch(`${base}/v1/checkout/sessions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      "x-merchant-id": merchantId,
    },
    body: JSON.stringify({
      reference: input.orderId,
      amount: input.amountHnl,
      currency: "HNL",
      description: input.description,
      customer: {
        name: input.customerName,
        phone: input.customerWhatsapp,
        email: input.customerEmail ?? undefined,
      },
      return_url: returnUrl ? `${returnUrl}?order=${input.orderId}` : undefined,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Clinpays ${res.status}: ${text || "error desconocido"}`);
  }

  const body = (await res.json()) as {
    payment_url?: string;
    url?: string;
    reference?: string;
  };
  const paymentUrl = body.payment_url || body.url;
  if (!paymentUrl) {
    throw new Error("Clinpays no devolvió payment_url");
  }
  return { paymentUrl, reference: body.reference ?? input.orderId };
}

export function buildWhatsappUrl(opts: {
  whatsapp: string;
  eventName: string;
  customerName: string;
  photoIds: string[];
  totalHnl: number;
  paymentUrl?: string | null;
}) {
  const phone = opts.whatsapp.replace(/[^0-9]/g, "");
  const lines = [
    `Hola, soy ${opts.customerName}.`,
    `Me interesan ${opts.photoIds.length} fotos del evento "${opts.eventName}".`,
    `Total estimado: HNL ${opts.totalHnl.toLocaleString("es-HN")}.`,
  ];
  if (opts.paymentUrl) lines.push(`Aquí va el link de pago: ${opts.paymentUrl}`);
  lines.push(`Códigos: ${opts.photoIds.join(", ")}`);
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${phone}?text=${text}`;
}
