import "server-only";

import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import {
  buildWhatsappUrl,
  createClinpaysSession,
  isClinpaysConfigured,
} from "@/lib/payments/clinpays";
import type { OrderRow, EventRow, OrderStatus, PaymentProvider } from "@/lib/db/types";

export type CreateOrderInput = {
  eventSlug: string;
  customerName: string;
  customerWhatsapp: string;
  customerEmail?: string | null;
  photoIds: string[];
  selfieQueryId?: string | null;
  paymentProvider: PaymentProvider;
};

export type CreateOrderResult = {
  order: OrderRow;
  whatsappUrl: string;
  paymentUrl: string | null;
};

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (input.photoIds.length === 0) throw new Error("Selecciona al menos una foto");
  if (!input.customerName.trim()) throw new Error("Falta tu nombre");
  if (!input.customerWhatsapp.trim()) throw new Error("Falta tu WhatsApp");

  const admin = getSupabaseServiceClient();

  // Resolve event via service role (public events only, no auth).
  const { data: event, error: eventError } = await admin
    .from("events")
    .select("*")
    .eq("slug", input.eventSlug)
    .eq("is_public", true)
    .in("status", ["Procesando", "Listo"])
    .maybeSingle();
  if (eventError || !event) throw new Error("Evento no disponible");

  const e = event as EventRow;

  // Validate photos belong to the event and are ready.
  const { data: photos } = await admin
    .from("photos")
    .select("id, status")
    .eq("event_id", e.id)
    .in("id", input.photoIds);
  const validIds = (photos ?? [])
    .filter((p) => (p.status as string) === "ready")
    .map((p) => p.id as string);
  if (validIds.length === 0) throw new Error("Las fotos no están disponibles");

  const total = validIds.length * e.price_per_photo_hnl;

  const { data: created, error: createError } = await admin
    .from("orders")
    .insert({
      event_id: e.id,
      customer_name: input.customerName.trim(),
      customer_whatsapp: input.customerWhatsapp.trim(),
      customer_email: input.customerEmail ?? null,
      selfie_query_id: input.selfieQueryId ?? null,
      photo_ids: validIds,
      total_hnl: total,
      payment_provider: input.paymentProvider,
    })
    .select("*")
    .single();
  if (createError || !created) {
    throw new Error(`No pudimos crear la orden: ${createError?.message ?? ""}`);
  }
  const order = created as OrderRow;

  let paymentUrl: string | null = null;
  if (input.paymentProvider === "clinpays" && isClinpaysConfigured()) {
    try {
      const session = await createClinpaysSession({
        orderId: order.id,
        amountHnl: total,
        description: `Fotos de "${e.name}"`,
        customerName: input.customerName,
        customerWhatsapp: input.customerWhatsapp,
        customerEmail: input.customerEmail,
      });
      paymentUrl = session.paymentUrl;
      await admin
        .from("orders")
        .update({
          payment_url: session.paymentUrl,
          payment_reference: session.reference,
        })
        .eq("id", order.id);
    } catch (err) {
      console.error("[clinpays] session creation failed", err);
      // Fall through: order stays as manual-WhatsApp until photographer follows up.
    }
  }

  const whatsappUrl = buildWhatsappUrl({
    whatsapp: e.whatsapp ?? "",
    eventName: e.name,
    customerName: input.customerName,
    photoIds: validIds,
    totalHnl: total,
    paymentUrl,
  });

  return { order: { ...order, payment_url: paymentUrl }, whatsappUrl, paymentUrl };
}

export type ListOrdersFilters = {
  search?: string | null;
  status?: OrderStatus | "all" | null;
};

export async function listOrdersForPhotographer(
  filters: ListOrdersFilters = {}
): Promise<OrderRow[]> {
  const supabase = await getSupabaseServerClient();
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const search = filters.search?.trim();
  if (search) {
    const escaped = search.replace(/[\\%_,]/g, (m) => `\\${m}`);
    query = query.or(
      `customer_name.ilike.%${escaped}%,customer_whatsapp.ilike.%${escaped}%,payment_reference.ilike.%${escaped}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as OrderRow[];
}

export async function getOrderWithEvent(orderId: string) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("*, events!inner(id, name, slug, price_per_photo_hnl, whatsapp)")
    .eq("id", orderId)
    .maybeSingle();
  if (!data) return null;
  return data as OrderRow & {
    events: {
      id: string;
      name: string;
      slug: string;
      price_per_photo_hnl: number;
      whatsapp: string | null;
    };
  };
}

export async function listPhotosForOrder(photoIds: string[]) {
  if (photoIds.length === 0) return [];
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("photos")
    .select("id, thumb_path, faces_count")
    .in("id", photoIds);
  return (data ?? []) as { id: string; thumb_path: string | null; faces_count: number }[];
}

export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "paid" | "delivered" | "cancelled"
) {
  const supabase = await getSupabaseServerClient();
  const update: Record<string, unknown> = { status };
  if (status === "paid") update.paid_at = new Date().toISOString();
  if (status === "delivered") update.delivered_at = new Date().toISOString();
  const { error } = await supabase.from("orders").update(update).eq("id", orderId);
  if (error) throw error;
}
