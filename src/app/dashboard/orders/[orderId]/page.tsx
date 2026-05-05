import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ChatBubbleIcon,
  CheckCircledIcon,
  DownloadIcon,
} from "@radix-ui/react-icons";

import { requirePhotographer } from "@/lib/server/auth";
import { getOrderWithEvent, listPhotosForOrder } from "@/lib/server/orders";
import { thumbPublicUrl } from "@/lib/storage/paths";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { formatHnl } from "@/lib/currency";
import { Topbar } from "@/components/shell/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusActions } from "./status-actions";
import type { OrderStatus } from "@/lib/db/types";

const STATUS_VARIANT: Record<
  OrderStatus,
  "success" | "info" | "danger" | "warning" | "neutral"
> = {
  paid: "success",
  pending: "warning",
  delivered: "neutral",
  cancelled: "danger",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "Pagada",
  pending: "Pendiente",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  await requirePhotographer();

  const order = await getOrderWithEvent(orderId);
  if (!order) notFound();

  const env = getSupabaseEnv();
  const photos = await listPhotosForOrder(order.photo_ids);
  const thumbsByPhoto = new Map(
    photos.map((p) => [p.id, p.thumb_path ? thumbPublicUrl(env.url, p.thumb_path) : null])
  );

  const event = order.events;

  const waPhone = (order.customer_whatsapp || "").replace(/[^0-9]/g, "");

  return (
    <>
      <Topbar
        title={`Orden ${order.id.slice(0, 8)}…`}
        right={
          <Button asChild variant="secondary">
            <Link href="/dashboard/orders">
              <ArrowLeftIcon /> Volver
            </Link>
          </Button>
        }
      />
      <div className="w-full px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Cliente</CardTitle>
                  <p className="mt-1 text-sm text-zinc-700">{order.customer_name}</p>
                  <p className="mt-1 text-sm text-zinc-700">{order.customer_whatsapp}</p>
                  {order.customer_email ? (
                    <p className="mt-1 text-sm text-zinc-700">{order.customer_email}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-zinc-700">
                    Evento:{" "}
                    <span className="font-medium text-zinc-950">{event.name}</span>
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[order.status]}>
                  {STATUS_LABEL[order.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-zinc-900">
                {order.photo_ids.length} foto{order.photo_ids.length === 1 ? "" : "s"}{" "}
                seleccionada
                {order.photo_ids.length === 1 ? "" : "s"}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {order.photo_ids.map((pid) => {
                  const thumb = thumbsByPhoto.get(pid);
                  return (
                    <div
                      key={pid}
                      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
                    >
                      <div className="aspect-4/3 bg-zinc-100">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt="Foto"
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="p-2 text-xs text-zinc-500">{pid.slice(0, 8)}…</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-500">Total</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
                    {formatHnl(order.total_hnl)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-700">
                    {order.photo_ids.length} fotos ·{" "}
                    {formatHnl(event.price_per_photo_hnl)} c/u
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Pago:{" "}
                    {order.payment_provider === "clinpays"
                      ? "Clinpays"
                      : "WhatsApp manual"}
                  </p>
                </div>

                {order.payment_url ? (
                  <Button asChild className="w-full" variant="secondary">
                    <Link href={order.payment_url} target="_blank" rel="noreferrer">
                      Ver link de pago
                    </Link>
                  </Button>
                ) : null}

                {waPhone ? (
                  <Button asChild className="w-full">
                    <Link
                      href={`https://wa.me/${waPhone}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ChatBubbleIcon /> Abrir WhatsApp
                    </Link>
                  </Button>
                ) : null}

                <OrderStatusActions orderId={order.id} status={order.status}>
                  <CheckCircledIcon /> Marcar como pagada
                  <DownloadIcon /> Marcar como entregada
                </OrderStatusActions>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
