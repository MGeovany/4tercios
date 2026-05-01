"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon } from "@radix-ui/react-icons";

import { Topbar } from "@/components/shell/topbar";
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
import { cn } from "@/lib/utils";
import {
  commissionHnl,
  formatDateISO,
  formatHnl,
  useLensia,
  type EventType,
} from "@/lib/local-store";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "Carrera", label: "Carrera" },
  { value: "Graduacion", label: "Graduación" },
  { value: "Boda", label: "Boda" },
  { value: "Torneo", label: "Torneo" },
  { value: "Corporativo", label: "Corporativo" },
];

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-zinc-100 pt-8 first:border-t-0 first:pt-0">
      <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{eyebrow}</span>
      <h2 className="mt-1 text-base font-semibold tracking-tight text-zinc-950">{title}</h2>
      {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-zinc-500">{children}</p>;
}

export default function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { events } = useLensia();
  const { eventId } = React.use(params);
  const event = events.find((e) => e.id === eventId) ?? null;

  if (!event) {
    return (
      <>
        <Topbar title="Editar evento" />
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-950"
          >
            <ArrowLeftIcon className="size-3" /> Volver al dashboard
          </Link>
          <p className="mt-6 text-sm text-zinc-700">Evento no encontrado.</p>
        </div>
      </>
    );
  }

  return <EditEventForm key={event.id} eventId={event.id} />;
}

function EditEventForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { events, actions } = useLensia();
  const event = events.find((e) => e.id === eventId)!;

  const [name, setName] = React.useState(event.name);
  const [type, setType] = React.useState<EventType>(event.type);
  const [date, setDate] = React.useState(event.date);
  const [city, setCity] = React.useState(event.city);
  const [venue, setVenue] = React.useState(event.venue ?? "");
  const [description, setDescription] = React.useState(event.description ?? "");
  const [coverHint, setCoverHint] = React.useState(event.coverHint ?? "");
  const [slug, setSlug] = React.useState(event.slug);
  const [price, setPrice] = React.useState<number>(event.pricePerPhotoHnl);
  const [onlineDays, setOnlineDays] = React.useState<number>(event.onlineDays);
  const [whatsapp, setWhatsapp] = React.useState(event.whatsapp);

  const priceValid = Number.isFinite(price) && price > 0;
  const daysValid = Number.isFinite(onlineDays) && onlineDays > 0;
  const canSubmit = name.trim().length > 0 && priceValid && daysValid;

  const receives = priceValid ? Math.max(0, price - commissionHnl(price)) : 0;
  const availableUntil = daysValid ? addDaysIso(date, onlineDays) : null;
  const effectiveSlug = slugify(slug) || event.slug;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    actions.updateEvent(event.id, {
      name: name.trim() || event.name,
      type,
      date,
      city: city.trim() || event.city,
      venue: venue.trim() || undefined,
      description: description.trim() || undefined,
      pricePerPhotoHnl: price,
      onlineDays,
      whatsapp: whatsapp.trim() || event.whatsapp,
      coverHint: coverHint.trim(),
      slug: effectiveSlug,
    });
    router.push("/dashboard");
  };

  return (
    <>
      <Topbar
        title="Editar evento"
        subtitle={event.name}
        right={
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/e/${event.slug}`} target="_blank">
              <ExternalLinkIcon /> Ver público
            </Link>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-950"
        >
          <ArrowLeftIcon className="size-3" />
          Volver al dashboard
        </Link>

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
                  placeholder="Ej: Estadio Nacional"
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
                <Label htmlFor="slug">Link del evento</Label>
                <div
                  className={cn(
                    "mt-2 flex items-center rounded-md border border-zinc-200 bg-white",
                    "focus-within:border-zinc-400 focus-within:ring-[3px] focus-within:ring-zinc-950/10"
                  )}
                >
                  <span className="px-3 text-sm text-zinc-500 select-none">
                    4tercios.thefndrs.com/e/
                  </span>
                  <input
                    id="slug"
                    type="text"
                    className="h-9 flex-1 rounded-r-md border-0 bg-transparent pr-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
                <Hint>Cambiar el link romperá los QR y links ya compartidos.</Hint>
              </div>

              <div>
                <Label htmlFor="description">
                  Descripción <span className="text-zinc-400">· opcional</span>
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Una frase que tus clientes verán en la galería."
                  className="mt-2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="cover">
                  Sugerencia de portada <span className="text-zinc-400">· opcional</span>
                </Label>
                <Input
                  id="cover"
                  placeholder="Ej: atletas cruzando la meta"
                  className="mt-2"
                  value={coverHint}
                  onChange={(e) => setCoverHint(e.target.value)}
                />
              </div>
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
                      Recibes{" "}
                      <span className="font-medium text-zinc-900">{formatHnl(receives)}</span> por
                      foto (20% comisión).
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
                  className="mt-2"
                  value={Number.isFinite(onlineDays) ? String(onlineDays) : ""}
                  onChange={(e) => setOnlineDays(Number(e.target.value))}
                  required
                />
                <Hint>
                  {availableUntil ? (
                    <>
                      Abierta hasta el{" "}
                      <span className="font-medium text-zinc-900">
                        {formatDateISO(availableUntil)}
                      </span>
                      .
                    </>
                  ) : null}
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
                />
              </div>
            </div>
          </Section>

          <div className="mt-8 flex items-center justify-between gap-2 border-t border-zinc-100 pt-6">
            <Button type="button" variant="ghost" asChild>
              <Link href="/dashboard">Cancelar</Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" asChild>
                <Link href={`/dashboard/events/${event.id}/upload`}>Ir a subida</Link>
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                Guardar cambios
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
