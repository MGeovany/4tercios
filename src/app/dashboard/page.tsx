"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  DotsHorizontalIcon,
  ExternalLinkIcon,
  Pencil1Icon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";

import {
  commissionHnl,
  formatDateISO,
  formatHnl,
  useLensia,
  type LensiaEvent,
  type OrderStatus,
  type ProcessingStatus,
} from "@/lib/local-store";
import { useAuthProfile } from "@/lib/auth-profile";
import { cn } from "@/lib/utils";
import { Topbar } from "@/components/shell/topbar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_DOT: Record<ProcessingStatus, string> = {
  Listo: "bg-emerald-500",
  Procesando: "bg-amber-500",
  Subiendo: "bg-sky-500",
  "Con errores": "bg-red-500",
  Borrador: "bg-zinc-300",
};

const ORDER_BADGE: Record<OrderStatus, string> = {
  Pagado: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  Pendiente: "bg-amber-50 text-amber-700 ring-amber-600/10",
  Entregado: "bg-zinc-100 text-zinc-700 ring-zinc-600/10",
};

function formatNumber(n: number) {
  return n.toLocaleString("es-HN");
}

function KpiStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-1 py-1"
    >
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{label}</p>
      <p className="text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </motion.div>
  );
}

function ContactItem({ label, value, href }: { label: string; value: string; href?: string }) {
  const emptyMessage = "No hay data que mostrar por los momentos";

  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
      <p className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">{label}</p>
      {value ? (
        href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block truncate text-sm text-zinc-900 underline-offset-4 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 truncate text-sm text-zinc-900">{value}</p>
        )
      ) : (
        <p className="mt-1 text-xs text-zinc-500">{emptyMessage}</p>
      )}
    </div>
  );
}

function toExternalUrl(value: string) {
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function EventRow({
  event,
  onDelete,
  onCopyLink,
}: {
  event: LensiaEvent;
  onDelete: (id: string) => void;
  onCopyLink: (slug: string) => void;
}) {
  return (
    <div className="group relative flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-50">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[event.status])} />

      <Link
        href={`/dashboard/events/${event.id}/upload`}
        className="flex min-w-0 flex-1 items-center gap-4 focus-visible:outline-none"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-950 decoration-zinc-300 underline-offset-4 group-hover:underline">
            {event.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            <span className="sm:hidden">
              {formatNumber(event.photosUploaded)} fotos · {formatNumber(event.orders)} órdenes
            </span>
            <span className="hidden sm:inline">
              {event.city} · {formatDateISO(event.date)} · {event.type}
            </span>
          </p>
        </div>

        <div className="hidden items-center gap-5 text-right sm:flex">
          <div className="w-16">
            <p className="text-sm font-medium text-zinc-950 tabular-nums">
              {formatNumber(event.photosUploaded)}
            </p>
            <p className="text-xs text-zinc-500">fotos</p>
          </div>
          <div className="w-16">
            <p className="text-sm font-medium text-zinc-950 tabular-nums">
              {formatNumber(event.orders)}
            </p>
            <p className="text-xs text-zinc-500">órdenes</p>
          </div>
          <ChevronRightIcon className="size-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
        </div>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Acciones para ${event.name}`}
            className="inline-flex size-8 items-center justify-center rounded-md text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:outline-none data-[state=open]:opacity-100"
          >
            <DotsHorizontalIcon />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onCopyLink(event.slug)}>
            <CopyIcon />
            <span className="ml-2">Copiar link</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {}}>
            <DownloadIcon />
            <span className="ml-2">Descargar QR</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/e/${event.slug}`}>
              <ExternalLinkIcon />
              <span className="ml-2">Ver público</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/events/${event.id}/edit`}>
              <Pencil1Icon />
              <span className="ml-2">Editar</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onDelete(event.id)}>
            <TrashIcon />
            <span className="ml-2">Borrar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function DashboardPage() {
  const { events, orders, actions } = useLensia();
  const { profile } = useAuthProfile();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const totals = React.useMemo(() => {
    return events.reduce(
      (acc, e) => {
        acc.photos += e.photosUploaded;
        acc.orders += e.orders;
        acc.gross += e.revenueGrossHnl;
        return acc;
      },
      { photos: 0, orders: 0, gross: 0 }
    );
  }, [events]);

  const net = Math.max(0, totals.gross - commissionHnl(totals.gross));
  const recentEvents = events.slice(0, 5);
  const recentOrders = orders.slice(0, 4);

  const onCopyPublicLink = React.useCallback(async (slug: string) => {
    try {
      const url = `${window.location.origin}/e/${slug}`;
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  }, []);

  return (
    <>
      <Topbar
        title="Inicio"
        subtitle={profile.name ? `Hola, ${profile.name.split(" ")[0]}` : undefined}
        right={
          <Button size="sm" asChild>
            <Link href="/dashboard/events/new">
              <PlusIcon /> Nuevo evento
            </Link>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <section aria-labelledby="kpis" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <h2 id="kpis" className="sr-only">
            Resumen
          </h2>
          <KpiStat label="Eventos" value={formatNumber(events.length)} />
          <KpiStat label="Fotos" value={formatNumber(totals.photos)} />
          <KpiStat label="Órdenes" value={formatNumber(totals.orders)} />
          <KpiStat label="Neto" value={formatHnl(net)} hint={`Bruto ${formatHnl(totals.gross)}`} />
        </section>

        <section aria-labelledby="contact-heading" className="mt-12">
          <h2 id="contact-heading" className="text-sm font-semibold tracking-tight text-zinc-950">
            Información de contacto
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-3"
          >
            <ContactItem label="Teléfono" value={profile.phone} />
            <ContactItem
              label="Sitio web"
              value={profile.website}
              href={toExternalUrl(profile.website)}
            />
            <ContactItem
              label="Instagram"
              value={profile.instagram ? `@${profile.instagram}` : ""}
              href={profile.instagram ? `https://instagram.com/${profile.instagram}` : undefined}
            />
          </motion.div>
        </section>

        <section aria-labelledby="events-heading" className="mt-12">
          <div className="flex items-end justify-between">
            <h2 id="events-heading" className="text-sm font-semibold tracking-tight text-zinc-950">
              Eventos
            </h2>
            <Link
              href="/dashboard/events/new"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-950"
            >
              Crear nuevo <ArrowRightIcon className="size-3" />
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white"
          >
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
                    <EventRow event={event} onDelete={setDeleteId} onCopyLink={onCopyPublicLink} />
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </section>

        <section aria-labelledby="orders-heading" className="mt-12">
          <div className="flex items-end justify-between">
            <h2 id="orders-heading" className="text-sm font-semibold tracking-tight text-zinc-950">
              Órdenes recientes
            </h2>
            {orders.length > recentOrders.length ? (
              <span className="text-xs text-zinc-500">
                Mostrando {recentOrders.length} de {orders.length}
              </span>
            ) : null}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white"
          >
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
                          {order.clientName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {order.id} · {order.photoIds.length} fotos
                        </p>
                      </div>
                      <p className="hidden text-sm font-medium text-zinc-950 tabular-nums sm:block">
                        {formatHnl(order.grossTotalHnl)}
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                          ORDER_BADGE[order.status]
                        )}
                      >
                        {order.status}
                      </span>
                      <ChevronRightIcon className="size-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </section>
      </div>

      <Dialog open={!!deleteId} onOpenChange={(o) => (!o ? setDeleteId(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Borrar evento</DialogTitle>
            <DialogDescription>
              Se borrarán también las fotos y órdenes asociadas guardadas localmente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteId) return;
                actions.deleteEvent(deleteId);
                setDeleteId(null);
              }}
            >
              Borrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
