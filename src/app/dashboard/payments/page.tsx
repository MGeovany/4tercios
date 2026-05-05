import Link from "next/link";
import { ChevronRightIcon } from "@radix-ui/react-icons";

import { listPaymentsForPhotographer } from "@/lib/server/orders";
import { formatHnl } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Topbar } from "@/components/shell/topbar";
import { ListFilters } from "@/components/dashboard/list-filters";
import type { OrderStatus, PaymentProvider } from "@/lib/db/types";

const STATUS_OPTIONS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pagada" },
  { value: "delivered", label: "Entregada" },
  { value: "cancelled", label: "Cancelada" },
];

const PROVIDER_OPTIONS: { value: PaymentProvider | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "manual_whatsapp", label: "WhatsApp manual" },
  { value: "clinpays", label: "Clinpays" },
];

const STATUS_BADGE: Record<OrderStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/10",
  delivered: "bg-zinc-100 text-zinc-700 ring-zinc-600/10",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-600/10",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "Pagada",
  pending: "Pendiente",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

function providerLabel(provider: PaymentProvider) {
  return provider === "clinpays" ? "Clinpays" : "WhatsApp manual";
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function buildHref({
  q,
  status,
  provider,
}: {
  q: string;
  status: string;
  provider: string;
}) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (status && status !== "all") params.set("status", status);
  if (provider && provider !== "all") params.set("provider", provider);
  const qs = params.toString();
  return qs ? `/dashboard/payments?${qs}` : "/dashboard/payments";
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q : Array.isArray(sp.q) ? sp.q[0] : "";
  const statusParam =
    typeof sp.status === "string"
      ? sp.status
      : Array.isArray(sp.status)
        ? sp.status[0]
        : "all";
  const providerParam =
    typeof sp.provider === "string"
      ? sp.provider
      : Array.isArray(sp.provider)
        ? sp.provider[0]
        : "all";

  const statusFilter =
    STATUS_OPTIONS.find((opt) => opt.value === statusParam)?.value ?? "all";
  const providerFilter =
    PROVIDER_OPTIONS.find((opt) => opt.value === providerParam)?.value ?? "all";

  const payments = await listPaymentsForPhotographer({
    search,
    status: statusFilter === "all" ? null : statusFilter,
    provider: providerFilter === "all" ? null : providerFilter,
  });

  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== "all" || providerFilter !== "all";

  const totals = payments.reduce(
    (acc, payment) => {
      acc.gross += payment.total_hnl;
      if (payment.status === "paid" || payment.status === "delivered")
        acc.collected += payment.total_hnl;
      return acc;
    },
    { gross: 0, collected: 0 }
  );

  return (
    <>
      <Topbar title="Pagos" />

      <div className="mx-auto w-full max-w-5xl space-y-4 px-6 py-8">
        <ListFilters
          searchPlaceholder="Buscar por cliente, referencia o WhatsApp…"
          statusOptions={STATUS_OPTIONS}
          initialSearch={search}
          initialStatus={statusFilter}
        />

        <div className="flex flex-wrap items-center gap-1.5">
          {PROVIDER_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={buildHref({ q: search, status: statusFilter, provider: opt.value })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                providerFilter === opt.value
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
              )}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {payments.length > 0 ? (
          <div className="grid grid-cols-2 gap-8 border-y border-zinc-100 py-4 sm:grid-cols-4">
            <Stat label="Pagos" value={payments.length.toLocaleString("es-HN")} />
            <Stat label="Total bruto" value={formatHnl(totals.gross)} />
            <Stat label="Cobrado" value={formatHnl(totals.collected)} accent="emerald" />
            <Stat
              label="Pendiente"
              value={formatHnl(totals.gross - totals.collected)}
              accent="amber"
            />
          </div>
        ) : null}

        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {payments.length === 0 ? (
            <div className="font-manrope px-6 py-16 text-center text-sm text-gray-500">
              {hasActiveFilters
                ? "No hay pagos con esos filtros."
                : "Cuando tengas ventas, tus pagos aparecerán aquí."}
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {payments.map((payment) => (
                <li key={payment.id}>
                  <Link
                    href={`/dashboard/orders/${payment.id}`}
                    className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-50 focus-visible:outline-none"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-zinc-950 decoration-zinc-300 underline-offset-4 group-hover:underline">
                          {payment.customer_name}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                            STATUS_BADGE[payment.status]
                          )}
                        >
                          {STATUS_LABEL[payment.status]}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {payment.events?.name ?? "Evento eliminado"} ·{" "}
                        {providerLabel(payment.payment_provider)} · Ref:{" "}
                        {payment.payment_reference ?? "—"}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                        Creada: {formatDateTime(payment.created_at)} · Pagada:{" "}
                        {formatDateTime(payment.paid_at)}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-zinc-950 tabular-nums">
                      {formatHnl(payment.total_hnl)}
                    </p>
                    <ChevronRightIcon className="size-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
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
    accent === "emerald"
      ? "text-emerald-700"
      : accent === "amber"
        ? "text-amber-700"
        : "";
  return (
    <div>
      <p className="text-xs tracking-wide text-zinc-500 uppercase">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", accentClass)}>
        {value}
      </p>
    </div>
  );
}
