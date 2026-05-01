import Link from "next/link";
import { ChevronRightIcon } from "@radix-ui/react-icons";

import { listOrdersForPhotographer } from "@/lib/server/orders";
import { listEventsForPhotographer } from "@/lib/server/events";
import { requirePhotographer } from "@/lib/server/auth";
import { formatHnl } from "@/lib/local-store";
import { cn } from "@/lib/utils";
import { Topbar } from "@/components/shell/topbar";
import type { OrderStatus } from "@/lib/db/types";

const ORDER_BADGE: Record<OrderStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/10",
  delivered: "bg-zinc-100 text-zinc-700 ring-zinc-600/10",
  cancelled: "bg-red-50 text-red-700 ring-red-600/10",
};

const ORDER_LABEL: Record<OrderStatus, string> = {
  paid: "Pagada",
  pending: "Pendiente",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function OrdersListPage() {
  await requirePhotographer();
  const [orders, events] = await Promise.all([
    listOrdersForPhotographer(),
    listEventsForPhotographer(),
  ]);
  const eventNameById = new Map(events.map((e) => [e.id, e.name]));

  const totals = orders.reduce(
    (acc, o) => {
      acc.gross += o.total_hnl;
      if (o.status === "paid") acc.paid += o.total_hnl;
      return acc;
    },
    { gross: 0, paid: 0 }
  );

  return (
    <>
      <Topbar title="Órdenes" subtitle={`${orders.length} en total`} />

      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        {orders.length > 0 ? (
          <div className="grid grid-cols-2 gap-8 border-y border-zinc-100 py-4 sm:grid-cols-4">
            <Stat label="Órdenes" value={orders.length.toLocaleString("es-HN")} />
            <Stat label="Total bruto" value={formatHnl(totals.gross)} />
            <Stat label="Cobrado" value={formatHnl(totals.paid)} accent="emerald" />
            <Stat label="Pendiente" value={formatHnl(totals.gross - totals.paid)} accent="amber" />
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {orders.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-zinc-500">
              Cuando tus clientes compren fotos, aparecerán aquí.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-50 focus-visible:outline-none"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-zinc-950 decoration-zinc-300 underline-offset-4 group-hover:underline">
                          {order.customer_name}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                            ORDER_BADGE[order.status]
                          )}
                        >
                          {ORDER_LABEL[order.status]}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {eventNameById.get(order.event_id) ?? "Evento eliminado"} ·{" "}
                        {order.photo_ids.length} fotos · {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-zinc-950 tabular-nums">
                      {formatHnl(order.total_hnl)}
                    </p>
                    <ChevronRightIcon className="size-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "amber";
}) {
  const accentClass =
    accent === "emerald" ? "text-emerald-700" : accent === "amber" ? "text-amber-700" : "";
  return (
    <div>
      <p className="text-xs tracking-wide text-zinc-500 uppercase">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", accentClass)}>{value}</p>
    </div>
  );
}
