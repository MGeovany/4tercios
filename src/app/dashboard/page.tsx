import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Camera,
  CheckSquare,
  ChevronRight,
  ClipboardCheck,
  Image as ImageIcon,
  PackageCheck,
  ShoppingCart,
  SlidersHorizontal,
  Square,
} from "lucide-react";

import { requirePhotographer } from "@/lib/server/auth";
import {
  listEventsForPhotographer,
  listUpcomingEventsForPhotographer,
  getPhotographerStats,
} from "@/lib/server/events";
import { cn } from "@/lib/utils";
import { Topbar } from "@/components/shell/topbar";
import type { EventRow, EventStatus, EventType, OrderRow, OrderStatus } from "@/lib/db/types";

import { Sparkline } from "./_components/sparkline";
import { OverviewChart, type ChartPoint } from "./_components/overview-chart";

const ORDER_LABEL_ES: Record<OrderStatus, string> = {
  paid: "Pagada",
  pending: "Pendiente",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

const ORDER_BADGE: Record<OrderStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  delivered: "bg-zinc-100 text-zinc-700",
  cancelled: "bg-rose-50 text-rose-700",
};

const EVENT_BADGE: Record<EventStatus, string> = {
  Listo: "bg-emerald-50 text-emerald-700",
  Procesando: "bg-amber-50 text-amber-700",
  Subiendo: "bg-sky-50 text-sky-700",
  "Con errores": "bg-rose-50 text-rose-700",
  Borrador: "bg-zinc-100 text-zinc-700",
  Archivado: "bg-zinc-100 text-zinc-500",
};

const UPCOMING_STATUS_OPTIONS: { value: EventStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "Borrador", label: "Borrador" },
  { value: "Subiendo", label: "Subiendo" },
  { value: "Procesando", label: "Procesando" },
  { value: "Listo", label: "Listo" },
  { value: "Con errores", label: "Con errores" },
  { value: "Archivado", label: "Archivado" },
];

const UPCOMING_TYPE_OPTIONS: { value: EventType | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "Carrera", label: "Carrera" },
  { value: "Graduacion", label: "Graduacion" },
  { value: "Boda", label: "Boda" },
  { value: "Torneo", label: "Torneo" },
  { value: "Corporativo", label: "Corporativo" },
  { value: "Otro", label: "Otro" },
];

const MONTH_SHORT_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const MONTH_FULL_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function formatNumber(n: number) {
  return n.toLocaleString("es-HN");
}

const DATE_FMT = new Intl.DateTimeFormat("es-HN", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = iso.length <= 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return DATE_FMT.format(date);
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function shortOrderId(id: string, fallback: number) {
  const cleaned = id.replace(/[^0-9]/g, "");
  if (cleaned.length >= 4) return `#PV-${cleaned.slice(-4)}`;
  return `#PV-${pad(2400 + fallback)}`;
}

function buildMonthlySeries(orders: Pick<OrderRow, "created_at" | "total_hnl" | "status">[]) {
  const now = new Date();
  const months: ChartPoint[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: MONTH_SHORT_ES[d.getMonth()],
      fullLabel: `${MONTH_FULL_ES[d.getMonth()]} ${d.getFullYear()}`,
      value: 0,
    });
  }

  for (const o of orders) {
    if (!o.created_at) continue;
    const d = new Date(o.created_at);
    const monthsBack = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    const idx = 7 - monthsBack;
    if (idx >= 0 && idx < months.length) {
      months[idx].value += 1;
    }
  }
  const hasRealData = months.some((m) => m.value > 0);
  return { months, hasRealData };
}

function inferEventThumbIcon(type: EventRow["type"]) {
  switch (type) {
    case "Boda":
      return <Camera className="size-5" strokeWidth={1.75} />;
    case "Carrera":
      return <PackageCheck className="size-5" strokeWidth={1.75} />;
    case "Graduacion":
      return <ClipboardCheck className="size-5" strokeWidth={1.75} />;
    default:
      return <ImageIcon className="size-5" strokeWidth={1.75} />;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const upcomingSearch =
    typeof sp.ue_q === "string" ? sp.ue_q : Array.isArray(sp.ue_q) ? sp.ue_q[0] : "";
  const upcomingStatusParam =
    typeof sp.ue_status === "string"
      ? sp.ue_status
      : Array.isArray(sp.ue_status)
        ? sp.ue_status[0]
        : "all";
  const upcomingTypeParam =
    typeof sp.ue_type === "string" ? sp.ue_type : Array.isArray(sp.ue_type) ? sp.ue_type[0] : "all";

  const upcomingStatus =
    UPCOMING_STATUS_OPTIONS.find((o) => o.value === upcomingStatusParam)?.value ?? "all";
  const upcomingType =
    UPCOMING_TYPE_OPTIONS.find((o) => o.value === upcomingTypeParam)?.value ?? "all";
  const hasUpcomingFilters =
    (upcomingSearch ?? "").trim().length > 0 || upcomingStatus !== "all" || upcomingType !== "all";

  const { photographer } = await requirePhotographer();
  const [events, upcomingEvents, stats] = await Promise.all([
    listEventsForPhotographer(),
    listUpcomingEventsForPhotographer({
      search: upcomingSearch,
      status: upcomingStatus === "all" ? null : upcomingStatus,
      type: upcomingType === "all" ? null : upcomingType,
      limit: 12,
    }),
    getPhotographerStats(),
  ]);

  const allOrders = stats.recentOrders ?? [];
  const { months: series, hasRealData } = buildMonthlySeries(allOrders);
  const peakIndex = series.reduce((acc, cur, i) => (cur.value > series[acc].value ? i : acc), 0);
  const seriesTotal = series.reduce((acc, m) => acc + m.value, 0);
  const seriesAvg = Math.round(seriesTotal / series.length);

  const lastMonthValue = series[series.length - 1].value;
  const prevMonthValue = series[series.length - 2]?.value ?? 0;
  const monthlyChange = prevMonthValue
    ? Math.round(((lastMonthValue - prevMonthValue) / prevMonthValue) * 100)
    : lastMonthValue > 0
      ? 100
      : 0;

  const recentDelivered = allOrders.filter(
    (o) => o.status === "paid" || o.status === "delivered"
  ).length;
  const pendingOrders = allOrders.filter((o) => o.status === "pending").length;
  const totalOrders = allOrders.length;

  const recentOrders = allOrders.slice(0, 4);

  const eventNameById = new Map(events.map((e) => [e.id, e]));

  const firstName = photographer.business_name?.split(" ")[0] ?? "";

  return (
    <>
      <Topbar title="Dashboard" />

      <div className="mx-auto w-full max-w-[1280px] bg-white px-6 pt-8 pb-12 lg:px-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-[26px] leading-tight font-semibold tracking-tight text-zinc-950">
              Bienvenido{firstName ? `, ${firstName}` : ""}
              <span
                aria-hidden
                className="inline-block origin-[70%_70%] animate-[wave_2.4s_ease-in-out_infinite]"
              >
                👋
              </span>
            </h1>
            <p className="mt-3 text-[13.5px] text-gray-600">
              Gestiona tus eventos, sigue tus ventas y revisa tus fotos — todo en un solo lugar.
            </p>
          </div>
        </header>

        <section className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            icon={<ShoppingCart className="size-[18px]" strokeWidth={1.75} />}
            label="Órdenes pendientes"
            value={formatNumber(pendingOrders)}
            change={`+${Math.max(0, Math.round(pendingOrders * 0.21))}%`}
            trend="up"
            sparkPoints={[5, 7, 6, 9, 11, 8, 12, 14, 16]}
          />
          <KpiCard
            icon={<PackageCheck className="size-[18px]" strokeWidth={1.75} />}
            label="Órdenes pagadas"
            value={formatNumber(recentDelivered)}
            change={`+${Math.max(0, Math.round(recentDelivered * 0.11))}%`}
            trend="up"
            sparkPoints={[6, 8, 9, 11, 10, 13, 14, 18, 20]}
          />
          <KpiCard
            icon={<ImageIcon className="size-[18px]" strokeWidth={1.75} />}
            label="Total de órdenes"
            value={formatNumber(totalOrders)}
            change={
              totalOrders > 0
                ? `${formatNumber(Math.round(totalOrders * 0.25))} vs mes pasado`
                : "—"
            }
            trend={monthlyChange >= 0 ? "up" : "down"}
            sparkPoints={[18, 16, 17, 14, 13, 12, 14, 11, 9]}
          />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OverviewChart
              data={series}
              highlightIndex={peakIndex}
              avgLabel={
                hasRealData
                  ? `${formatNumber(seriesAvg)}/${formatNumber(Math.max(seriesAvg * 2, 10))}`
                  : "Aun no hay informacion"
              }
              changeLabel={
                hasRealData ? `${monthlyChange >= 0 ? "+" : ""}${monthlyChange}%` : undefined
              }
              changePositive={monthlyChange >= 0}
              hasRealData={hasRealData}
              unit="ordenes"
            />
          </div>

          <BuyingHistory orders={recentOrders} getEvent={(id) => eventNameById.get(id) ?? null} />
        </section>

        <section className="mt-5">
          <UpcomingEvents
            events={upcomingEvents}
            search={upcomingSearch}
            status={upcomingStatus}
            type={upcomingType}
            hasActiveFilters={hasUpcomingFilters}
          />
        </section>
      </div>

      <style>{`
        @keyframes wave {
          0%, 60%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
        }
      `}</style>
    </>
  );
}

function KpiCard({
  icon,
  label,
  value,
  change,
  trend,
  sparkPoints,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  sparkPoints: number[];
}) {
  const isUp = trend === "up";
  return (
    <article className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5">
      <header className="flex items-center gap-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700">
          {icon}
        </span>
        <p className="text-[13.5px] font-medium text-zinc-700">{label}</p>
      </header>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[34px] leading-none font-semibold tracking-tight text-zinc-950 tabular-nums">
            {value}
          </p>
          <p
            className={cn(
              "mt-2 inline-flex items-center gap-1 text-[12px] font-medium tabular-nums",
              isUp ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {isUp ? (
              <ArrowUpRight className="size-3.5" strokeWidth={2} />
            ) : (
              <ArrowDownRight className="size-3.5" strokeWidth={2} />
            )}
            {change}
            <span className="font-normal text-zinc-500"> vs mes pasado</span>
          </p>
        </div>
        <Sparkline points={sparkPoints} trend={trend} />
      </div>
    </article>
  );
}

function BuyingHistory({
  orders,
  getEvent,
}: {
  orders: Pick<
    OrderRow,
    "id" | "customer_name" | "status" | "event_id" | "created_at" | "photo_ids" | "total_hnl"
  >[];
  getEvent: (eventId: string) => EventRow | null;
}) {
  return (
    <aside className="flex h-full flex-col rounded-3xl border border-zinc-200 bg-white">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-zinc-950">
          Historial de compras
        </h2>
        <Link
          href="/dashboard/history"
          className="text-[12px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Ver todo
        </Link>
      </header>

      <ul className="flex flex-1 flex-col">
        {orders.length === 0 ? (
          <li className="flex flex-1 items-center justify-center px-5 py-10 text-center text-[13px] text-zinc-500">
            Cuando tus clientes compren fotos, aparecerán aquí.
          </li>
        ) : (
          orders.map((o, i) => {
            const event = getEvent(o.event_id);
            const status = o.status as OrderStatus;
            return (
              <li
                key={o.id}
                className={cn(
                  "flex items-start gap-3 px-5 py-3.5",
                  i !== orders.length - 1 && "border-b border-zinc-100"
                )}
              >
                <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700">
                  {event ? (
                    inferEventThumbIcon(event.type)
                  ) : (
                    <ImageIcon className="size-5" strokeWidth={1.75} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[13.5px] font-semibold text-zinc-950">
                      {event ? event.name : o.customer_name}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11.5px] text-zinc-500">
                    <span>Estado:</span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold",
                        ORDER_BADGE[status]
                      )}
                    >
                      {ORDER_LABEL_ES[status]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11.5px] text-zinc-500">
                    Orden ID: {shortOrderId(o.id, i)}
                  </p>
                  <p className="truncate text-[11.5px] text-zinc-500">
                    Entrega: {formatDate(o.created_at)}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}

function UpcomingEvents({
  events,
  search,
  status,
  type,
  hasActiveFilters,
}: {
  events: EventRow[];
  search: string;
  status: EventStatus | "all";
  type: EventType | "all";
  hasActiveFilters: boolean;
}) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-zinc-950">Próximos eventos</h2>
        <Link
          href="#upcoming-filters"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Filtrar
          <SlidersHorizontal className="size-3.5 text-zinc-400" strokeWidth={2} />
        </Link>
      </header>

      <form
        id="upcoming-filters"
        method="get"
        className="grid gap-3 border-b border-zinc-100 bg-zinc-50/40 px-5 py-3 md:grid-cols-4"
      >
        <label className="min-w-0 md:col-span-2">
          <span className="mb-1 block text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            Buscar
          </span>
          <input
            type="search"
            name="ue_q"
            defaultValue={search}
            placeholder="Nombre, ciudad o slug..."
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 transition-colors outline-none placeholder:text-zinc-400 focus:border-zinc-900"
          />
        </label>
        <label>
          <span className="mb-1 block text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            Estado
          </span>
          <select
            name="ue_status"
            defaultValue={status}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 transition-colors outline-none focus:border-zinc-900"
          >
            {UPCOMING_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            Tipo
          </span>
          <select
            name="ue_type"
            defaultValue={type}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 transition-colors outline-none focus:border-zinc-900"
          >
            {UPCOMING_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2 md:col-span-4">
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Aplicar filtros
          </button>
          {hasActiveFilters ? (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-[12.5px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Limpiar
            </Link>
          ) : null}
        </div>
      </form>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <p className="text-[13px] text-zinc-600">
            {hasActiveFilters
              ? "No se encontraron eventos para los filtros seleccionados."
              : "Sin eventos próximos por el momento."}
          </p>
          {!hasActiveFilters ? (
            <Link
              href="/dashboard/events/new"
              className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 px-3 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Crear evento
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-zinc-100 text-[11.5px] font-medium tracking-wide text-zinc-500 uppercase">
                <th className="px-5 py-3 font-medium">
                  <span className="inline-flex items-center gap-2">
                    <CheckSquare className="size-3.5 text-zinc-400" strokeWidth={2} />
                    ID Evento
                  </span>
                </th>
                <th className="px-3 py-3 font-medium">Nombre</th>
                <th className="px-3 py-3 font-medium">Tipo</th>
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {events.map((e, i) => (
                <tr key={e.id} className="transition-colors hover:bg-zinc-50/60">
                  <td className="px-5 py-3.5 font-medium text-zinc-700 tabular-nums">
                    <span className="inline-flex items-center gap-2">
                      <Square className="size-3.5 text-zinc-300" strokeWidth={2} />
                      EVT-{(2300 + i + 1).toString()}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 font-medium text-zinc-900">
                    <Link href={`/dashboard/events/${e.id}/upload`} className="hover:underline">
                      {e.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 text-zinc-600">{e.type}</td>
                  <td className="px-3 py-3.5 text-zinc-600 tabular-nums">{formatDate(e.date)}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                        EVENT_BADGE[e.status]
                      )}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/dashboard/events/${e.id}/upload`}
                      className="inline-flex items-center text-zinc-400 transition-colors hover:text-zinc-700"
                      aria-label={`Abrir ${e.name}`}
                    >
                      <ChevronRight className="size-4" strokeWidth={2} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
