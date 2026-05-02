import Link from "next/link";
import { ArrowRightIcon, ChevronRightIcon, PlusIcon } from "@radix-ui/react-icons";

import { requirePhotographer } from "@/lib/server/auth";
import { listEventsForPhotographer, getPhotographerStats } from "@/lib/server/events";
import { formatHnl } from "@/lib/local-store";
import { cn } from "@/lib/utils";
import { Topbar } from "@/components/shell/topbar";
import { Button } from "@/components/ui/button";
import type { EventRow, EventStatus, OrderStatus } from "@/lib/db/types";

const STATUS_DOT: Record<EventStatus, string> = {
  Listo: "bg-emerald-500",
  Procesando: "bg-amber-500",
  Subiendo: "bg-sky-500",
  "Con errores": "bg-red-500",
  Borrador: "bg-zinc-300",
  Archivado: "bg-zinc-200",
};

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

function formatNumber(n: number) {
  return n.toLocaleString("es-HN");
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-HN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(`${iso}T00:00:00`));
}

export default async function DashboardPage() {
  const { photographer } = await requirePhotographer();
  const [events, stats] = await Promise.all([listEventsForPhotographer(), getPhotographerStats()]);

  const recentEvents = events.slice(0, 5);
  const recentOrders = stats.recentOrders.slice(0, 4);
  const firstName = photographer.business_name?.split(" ")[0] ?? "";

  return (
    <>
      <Topbar
        title="Inicio"
        subtitle={firstName ? `Hola, ${firstName}` : undefined}
        right={
          <Button size="sm" asChild>
            <Link href="/dashboard/events/new">
              <PlusIcon /> Nuevo evento
            </Link>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <section className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <KpiStat label="Eventos" value={formatNumber(stats.totals.events)} />
          <KpiStat label="Fotos" value={formatNumber(stats.totals.photos)} />
          <KpiStat label="Rostros" value={formatNumber(stats.totals.facesDetected)} />
          <KpiStat
            label="Cobrado"
            value={formatHnl(stats.totals.paidHnl)}
            hint={`Bruto ${formatHnl(stats.totals.grossHnl)}`}
          />
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-950">Eventos</h2>
            <Link
              href="/dashboard/events"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-950"
            >
              Ver todos <ArrowRightIcon className="size-3" />
            </Link>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {recentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <p className="text-sm text-zinc-700">Aún no tienes eventos.</p>
                <Button size="sm" asChild>
                  <Link href="/dashboard/events/new">Crear mi primer evento</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {recentEvents.map((event) => (
                  <li key={event.id}>
                    <EventRow event={event} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-950">
              Órdenes recientes
            </h2>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-950"
            >
              Ver todas <ArrowRightIcon className="size-3" />
            </Link>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-zinc-500">
                Cuando tus clientes compren fotos, aparecerán aquí.
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-50 focus-visible:outline-none"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-950 decoration-zinc-300 underline-offset-4 group-hover:underline">
                          {order.customer_name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {order.photo_ids.length} fotos
                        </p>
                      </div>
                      <p className="hidden text-sm font-medium text-zinc-950 tabular-nums sm:block">
                        {formatHnl(order.total_hnl)}
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                          ORDER_BADGE[order.status as OrderStatus]
                        )}
                      >
                        {ORDER_LABEL[order.status as OrderStatus]}
                      </span>
                      <ChevronRightIcon className="size-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function KpiStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 py-1">
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{label}</p>
      <p className="text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function EventRow({ event }: { event: EventRow }) {
  return (
    <Link
      href={`/dashboard/events/${event.id}/upload`}
      className="group relative flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-50"
    >
      <span className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[event.status])} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-950 decoration-zinc-300 underline-offset-4 group-hover:underline">
          {event.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {event.city ?? "—"} · {formatDate(event.date)} · {event.type}
        </p>
      </div>
      <div className="hidden items-center gap-5 text-right sm:flex">
        <div className="w-20">
          <p className="text-sm font-medium text-zinc-950 tabular-nums">
            {formatHnl(event.price_per_photo_hnl)}
          </p>
          <p className="text-xs text-zinc-500">por foto</p>
        </div>
        <ChevronRightIcon className="size-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
      </div>
    </Link>
  );
}
