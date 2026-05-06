"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";

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
import { LocationPickerMap } from "@/components/forms/location-picker-map";
import { useAuthProfile } from "@/lib/auth-profile";
import { CITY_SUGGESTIONS } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { resolvePublicUsername } from "@/lib/public-event-path";
import {
  commissionHnl,
  formatDateISO,
  formatHnl,
  type EventType,
} from "@/lib/local-store";
import { createEventAction } from "./actions";

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
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
          {eyebrow}
        </span>
      </div>
      <h2 className="mt-1 text-base font-semibold tracking-tight text-zinc-950">
        {title}
      </h2>
      {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-zinc-500">{children}</p>;
}

export default function NewEventPage() {
  const router = useRouter();
  const { profile } = useAuthProfile();
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<EventType>("Carrera");
  const today = React.useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);
  const [date, setDate] = React.useState(today);
  const [city, setCity] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [location, setLocation] = React.useState<{ lat: number; lng: number } | null>(
    null
  );
  const [resolvingLocation, setResolvingLocation] = React.useState(false);
  const [resolvingCity, setResolvingCity] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const skipNextCityGeocodeRef = React.useRef(false);

  const [slugTouched, setSlugTouched] = React.useState(false);
  const [slug, setSlug] = React.useState("");

  const [price, setPrice] = React.useState<number>(80);
  const [onlineDays, setOnlineDays] = React.useState<number>(14);
  const [whatsappTouched, setWhatsappTouched] = React.useState(false);
  const [whatsapp, setWhatsapp] = React.useState("");
  const effectiveWhatsapp = whatsappTouched ? whatsapp : whatsapp || profile.phone;

  const publicUsername = React.useMemo(
    () =>
      resolvePublicUsername(
        profile.name || profile.email.split("@")[0] || "fotografo"
      ),
    [profile.email, profile.name]
  );
  const autoSlug = React.useMemo(() => slugify(name || "nuevo-evento"), [name]);
  const effectiveSlug = slugTouched && slug ? slugify(slug) : autoSlug;

  const priceValid = Number.isFinite(price) && price > 0;
  const daysValid = Number.isFinite(onlineDays) && onlineDays > 0 && onlineDays <= 60;
  const canSubmit = name.trim().length > 0 && priceValid && daysValid;

  const receives = priceValid ? Math.max(0, price - commissionHnl(price)) : 0;
  const availableUntil = daysValid ? addDaysIso(date, onlineDays) : null;

  React.useEffect(() => {
    if (!location) return;
    const controller = new AbortController();

    const updateLocationFields = async () => {
      setResolvingLocation(true);
      try {
        const res = await fetch(
          `/api/geocode/reverse?lat=${encodeURIComponent(location.lat)}&lng=${encodeURIComponent(location.lng)}`,
          {
            signal: controller.signal,
          }
        );
        if (!res.ok) return;
        const body = (await res.json()) as { city?: string; venue?: string };

        if (typeof body.city === "string" && body.city.trim().length > 0) {
          skipNextCityGeocodeRef.current = true;
          setCity(body.city.trim());
        }
        if (typeof body.venue === "string" && body.venue.trim().length > 0) {
          setVenue(body.venue.trim());
        }
      } catch {
        // Ignore transient geocoder errors and keep manual values.
      } finally {
        if (!controller.signal.aborted) {
          setResolvingLocation(false);
        }
      }
    };

    void updateLocationFields();

    return () => {
      controller.abort();
    };
  }, [location]);

  React.useEffect(() => {
    const cityText = city.trim();
    if (cityText.length < 2) return;
    if (skipNextCityGeocodeRef.current) {
      skipNextCityGeocodeRef.current = false;
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setResolvingCity(true);
      try {
        const res = await fetch(
          `/api/geocode/forward?city=${encodeURIComponent(cityText)}`,
          {
            signal: controller.signal,
          }
        );
        if (!res.ok) return;
        const body = (await res.json()) as { lat?: number; lng?: number };
        if (typeof body.lat !== "number" || typeof body.lng !== "number") return;

        setLocation({
          lat: body.lat,
          lng: body.lng,
        });
      } catch {
        // Ignore transient geocoder errors and keep manual values.
      } finally {
        if (!controller.signal.aborted) {
          setResolvingCity(false);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
      setResolvingCity(false);
    };
  }, [city]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await createEventAction({
      name: name.trim(),
      type,
      date,
      city: city.trim() || undefined,
      venue: venue.trim() || undefined,
      locationLat: location?.lat,
      locationLng: location?.lng,
      description: description.trim() || undefined,
      pricePerPhotoHnl: price,
      onlineDays,
      whatsapp: effectiveWhatsapp.trim() || undefined,
      slug: effectiveSlug,
    });
    if (!result.ok) {
      setSubmitting(false);
      setSubmitError(result.error);
      return;
    }
    router.push(`/dashboard/events/${result.eventId}/upload`);
  };

  return (
    <>
      <Topbar
        title="Crear evento"
        subtitle="Se guarda como borrador hasta que subas las primeras fotos"
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-950"
        >
          <ArrowLeftIcon className="size-3" />
          Volver al dashboard
        </Link>

        <form
          onSubmit={onSubmit}
          className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"
        >
          <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
            <Section
              eyebrow="01"
              title="Lo básico"
              description="Nombre, tipo y cuándo ocurre el evento."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Nombre del evento</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Carrera 10K San Pedro Sula"
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
                      <SelectValue placeholder="Selecciona" />
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
                  <DatePicker
                    id="event-date"
                    label="Fecha del evento"
                    value={date}
                    onChange={setDate}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    placeholder="Ej: Tegucigalpa"
                    className="mt-2"
                    list="city-suggestions"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  {resolvingLocation ? (
                    <Hint>Actualizando ciudad desde el pin...</Hint>
                  ) : null}
                  {resolvingCity ? (
                    <Hint>Moviendo pin desde la ciudad seleccionada...</Hint>
                  ) : null}
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
                  {resolvingLocation ? (
                    <Hint>Actualizando lugar desde el pin...</Hint>
                  ) : null}
                </div>
                <div className="sm:col-span-2">
                  <Label>
                    Ubicación en mapa <span className="text-zinc-400">· opcional</span>
                  </Label>
                  <p className="mt-1.5 text-xs text-zinc-500">
                    Haz clic en el mapa o mueve el pin para marcar dónde fue la carrera.
                  </p>
                  <div className="mt-2">
                    <LocationPickerMap value={location} onChange={setLocation} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    {location ? (
                      <span className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-zinc-700">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </span>
                    ) : (
                      <span>Sin ubicación seleccionada.</span>
                    )}
                    {location ? (
                      <button
                        type="button"
                        className="rounded-md border border-zinc-200 px-2 py-1 text-zinc-700 hover:bg-zinc-50"
                        onClick={() => setLocation(null)}
                      >
                        Limpiar pin
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <datalist id="city-suggestions">
                {CITY_SUGGESTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </Section>

            <Section
              eyebrow="02"
              title="Página pública"
              description="Cómo se ve tu galería cuando la compartas."
            >
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
                      4tercios.thefndrs.com/{publicUsername}/
                    </span>
                    <input
                      id="slug"
                      type="text"
                      placeholder={autoSlug}
                      className="h-9 flex-1 rounded-r-md border-0 bg-transparent pr-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
                      value={slugTouched ? slug : ""}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlug(e.target.value);
                      }}
                    />
                  </div>
                  <Hint>
                    Se genera desde el nombre del evento. URL final:
                    <span className="font-medium"> /{publicUsername}/{effectiveSlug}</span>
                  </Hint>
                </div>

                <div>
                  <Label htmlFor="description">
                    Descripción <span className="text-zinc-400">· opcional</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Una frase que tus clientes verán en la galería."
                    className="mt-2"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </Section>

            <Section
              eyebrow="03"
              title="Precio y disponibilidad"
              description="Tú defines cuánto cobras y por cuánto tiempo."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="price">Precio por foto (HNL)</Label>
                  <Input
                    id="price"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="80"
                    className="mt-2"
                    value={Number.isFinite(price) ? String(price) : ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    required
                  />
                  <Hint>
                    {priceValid ? (
                      <>
                        Recibes{" "}
                        <span className="font-medium text-zinc-900">
                          {formatHnl(receives)}
                        </span>{" "}
                        por foto (20% comisión: {formatHnl(commissionHnl(price))}).
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
                    max={60}
                    placeholder="14"
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
                          {formatDateISO(availableUntil)}
                        </span>
                        . Máximo 60 días para mantener costos de almacenamiento bajos.
                      </>
                    ) : (
                      <>Máximo 60 días. Podrás cerrar antes desde el dashboard.</>
                    )}
                  </Hint>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="whatsapp">
                    WhatsApp de contacto <span className="text-zinc-400">· opcional</span>
                  </Label>
                  <Input
                    id="whatsapp"
                    placeholder="+504 9999-1234"
                    className="mt-2"
                    value={effectiveWhatsapp}
                    onChange={(e) => {
                      setWhatsappTouched(true);
                      setWhatsapp(e.target.value);
                    }}
                  />
                  <Hint>A dónde llegan las solicitudes de compra.</Hint>
                </div>
              </div>
            </Section>

            {submitError ? (
              <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {submitError}
              </p>
            ) : null}
            <div className="mt-8 flex items-center justify-between gap-2 border-t border-zinc-100 pt-6">
              <Button type="button" variant="ghost" asChild>
                <Link href="/dashboard">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={!canSubmit || submitting}>
                {submitting ? "Creando..." : "Crear evento"}
                <ArrowRightIcon />
              </Button>
            </div>
          </div>

          <aside className="lg:sticky lg:top-20">
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                Vista previa
              </p>
              <p className="mt-3 truncate text-base font-semibold text-zinc-950">
                {name.trim() || "Tu evento"}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {EVENT_TYPES.find((t) => t.value === type)?.label} · {formatDateISO(date)}
                {city.trim() ? ` · ${city.trim()}` : ""}
              </p>

              <div className="mt-4 rounded-md bg-zinc-50 px-3 py-2 text-xs">
                <span className="text-zinc-500">4tercios.thefndrs.com/{publicUsername}/</span>
                <span className="font-medium text-zinc-900">{effectiveSlug}</span>
              </div>

              <dl className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-xs text-zinc-500">Precio por foto</dt>
                  <dd className="text-sm font-medium text-zinc-950 tabular-nums">
                    {priceValid ? formatHnl(price) : "—"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-xs text-zinc-500">Recibes (neto)</dt>
                  <dd className="text-sm font-medium text-emerald-700 tabular-nums">
                    {priceValid ? formatHnl(receives) : "—"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-xs text-zinc-500">Abierta hasta</dt>
                  <dd className="text-sm font-medium text-zinc-950">
                    {availableUntil ? formatDateISO(availableUntil) : "—"}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 text-[11px] leading-5 text-zinc-500">
                Se crea como <span className="font-medium text-zinc-700">borrador</span>.
                Podrás editar todo esto después de subir las fotos.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </>
  );
}
