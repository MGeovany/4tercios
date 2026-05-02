"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/forms/date-picker";
import { commissionHnl, formatHnl } from "@/lib/local-store";
import { saveEventAction, deleteEventAction } from "./actions";
import type { EventRow, EventType } from "@/lib/db/types";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "Carrera", label: "Carrera" },
  { value: "Graduacion", label: "Graduación" },
  { value: "Boda", label: "Boda" },
  { value: "Torneo", label: "Torneo" },
  { value: "Corporativo", label: "Corporativo" },
  { value: "Otro", label: "Otro" },
];

const MAX_ONLINE_DAYS = 60;

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLong(iso: string) {
  return new Intl.DateTimeFormat("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${iso}T00:00:00`));
}

export function EditEventForm({ event }: { event: EventRow }) {
  const router = useRouter();

  const [name, setName] = React.useState(event.name);
  const [type, setType] = React.useState<EventType>(event.type);
  const [date, setDate] = React.useState(event.date);
  const [city, setCity] = React.useState(event.city ?? "");
  const [venue, setVenue] = React.useState(event.venue ?? "");
  const [description, setDescription] = React.useState(event.description ?? "");
  const [price, setPrice] = React.useState<number>(event.price_per_photo_hnl);
  const [onlineDays, setOnlineDays] = React.useState<number>(event.online_days);
  const [whatsapp, setWhatsapp] = React.useState(event.whatsapp ?? "");
  const [isPublic, setIsPublic] = React.useState(event.is_public);

  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showDelete, setShowDelete] = React.useState(false);

  const priceValid = Number.isFinite(price) && price > 0;
  const daysValid = Number.isFinite(onlineDays) && onlineDays > 0 && onlineDays <= MAX_ONLINE_DAYS;
  const canSubmit = name.trim().length > 0 && priceValid && daysValid && !saving;

  const receives = priceValid ? Math.max(0, price - commissionHnl(price)) : 0;
  const availableUntil = daysValid ? addDaysIso(date, onlineDays) : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const result = await saveEventAction(event.id, {
      name: name.trim(),
      type,
      date,
      city: city.trim() || null,
      venue: venue.trim() || null,
      description: description.trim() || null,
      pricePerPhotoHnl: price,
      onlineDays,
      whatsapp: whatsapp.trim() || null,
      isPublic,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/dashboard/events");
  };

  const onDelete = async () => {
    setDeleting(true);
    setError(null);
    const result = await deleteEventAction(event.id);
    if (result && !result.ok) {
      setDeleting(false);
      setError(result.error);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 sm:p-8"
    >
      <Section eyebrow="01" title="Lo básico">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Nombre del evento</Label>
            <Input
              id="name"
              className="mt-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Tipo de evento</Label>
            <Select value={type} onValueChange={(v) => setType(v as EventType)}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <DatePicker label="Fecha del evento" value={date} onChange={setDate} />
          </div>
          <div>
            <Label htmlFor="city">Ciudad</Label>
            <Input
              id="city"
              className="mt-2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="venue">
              Lugar <span className="text-zinc-400">· opcional</span>
            </Label>
            <Input
              id="venue"
              className="mt-2"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>
        </div>
      </Section>

      <Section eyebrow="02" title="Página pública">
        <div className="grid gap-4">
          <div>
            <Label htmlFor="description">
              Descripción <span className="text-zinc-400">· opcional</span>
            </Label>
            <Textarea
              id="description"
              rows={3}
              className="mt-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-zinc-200 px-3 py-2.5">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-zinc-300 accent-zinc-950"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-950">Galería pública</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Cuando está apagada, sólo tú puedes ver el evento. Útil mientras subes fotos.
              </p>
            </div>
          </label>
        </div>
      </Section>

      <Section eyebrow="03" title="Precio y disponibilidad">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="price">Precio por foto (HNL)</Label>
            <Input
              id="price"
              type="number"
              inputMode="numeric"
              min={1}
              className="mt-2"
              value={Number.isFinite(price) ? String(price) : ""}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />
            <Hint>
              {priceValid ? (
                <>
                  Recibes <span className="font-medium text-zinc-900">{formatHnl(receives)}</span>{" "}
                  por foto (20% comisión).
                </>
              ) : (
                <>Comisión 20% por venta confirmada.</>
              )}
            </Hint>
          </div>
          <div>
            <Label htmlFor="online">Días disponible</Label>
            <Input
              id="online"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_ONLINE_DAYS}
              className="mt-2"
              value={Number.isFinite(onlineDays) ? String(onlineDays) : ""}
              onChange={(e) => setOnlineDays(Number(e.target.value))}
              required
            />
            <Hint>
              {availableUntil ? (
                <>
                  Galería abierta hasta el{" "}
                  <span className="font-medium text-zinc-900">
                    {formatDateLong(availableUntil)}
                  </span>
                  . Máximo {MAX_ONLINE_DAYS} días para mantener costos de almacenamiento.
                </>
              ) : (
                <>Máximo {MAX_ONLINE_DAYS} días.</>
              )}
            </Hint>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="whatsapp">
              WhatsApp de contacto <span className="text-zinc-400">· opcional</span>
            </Label>
            <Input
              id="whatsapp"
              className="mt-2"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+504 9999-1234"
            />
          </div>
        </div>
      </Section>

      {error ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col items-stretch justify-between gap-2 border-t border-zinc-100 pt-6 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="ghost"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => setShowDelete(true)}
          disabled={saving || deleting}
        >
          Borrar evento
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" asChild>
            <Link href={`/dashboard/events/${event.id}/upload`}>Ir a subida</Link>
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>

      {showDelete ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">¿Borrar este evento?</p>
          <p className="mt-1 text-xs text-red-800">
            Se borrarán también las fotos, rostros y órdenes asociadas. Esta acción no se puede
            deshacer.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDelete(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? "Borrando..." : "Sí, borrar"}
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-zinc-100 pt-8 first:border-t-0 first:pt-0">
      <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{eyebrow}</span>
      <h2 className="mt-1 text-base font-semibold tracking-tight text-zinc-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-zinc-500">{children}</p>;
}
