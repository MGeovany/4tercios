"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon, ExternalLinkIcon, InfoCircledIcon } from "@radix-ui/react-icons";

import {
  useLensia,
  type LensiaSettings,
  type PayoutMethod,
  type SupportedLocale,
  type WatermarkStyle,
} from "@/lib/local-store";
import { useAuthProfile } from "@/lib/auth-profile";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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

const SECTIONS = [
  { id: "perfil", label: "Perfil" },
  { id: "marca", label: "Marca" },
  { id: "pagos", label: "Pagos" },
  { id: "notificaciones", label: "Notificaciones" },
  { id: "preferencias", label: "Preferencias" },
  { id: "peligro", label: "Zona de peligro" },
] as const;

function useSavedIndicator() {
  const [saved, setSaved] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setSaved(true);
    timer.current = setTimeout(() => setSaved(false), 2000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { saved, trigger };
}

function SectionCard({
  id,
  eyebrow,
  title,
  description,
  onSubmit,
  saved,
  canSave = true,
  footer,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  onSubmit?: () => void;
  saved?: boolean;
  canSave?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="rounded-xl border border-zinc-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
        >
          <div className="border-b border-zinc-100 p-6 sm:p-8">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                {eyebrow}
              </span>
            </div>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-zinc-950">{title}</h2>
            {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
          </div>
          <div className="p-6 sm:p-8">{children}</div>
          {footer !== null && onSubmit ? (
            <div className="flex items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/40 px-6 py-3 sm:px-8">
              <p
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-opacity",
                  saved ? "text-emerald-600 opacity-100" : "text-zinc-400 opacity-0"
                )}
                aria-live="polite"
              >
                <CheckIcon className="size-3.5" />
                Guardado
              </p>
              <div className="flex items-center gap-2">
                {footer}
                <Button type="submit" size="sm" disabled={!canSave}>
                  Guardar
                </Button>
              </div>
            </div>
          ) : footer ? (
            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/40 px-6 py-3 sm:px-8">
              {footer}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  htmlFor,
  optional,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>
        {label}
        {optional ? <span className="ml-1 text-zinc-400">· opcional</span> : null}
      </Label>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1.5 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-zinc-300 accent-zinc-950"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-950">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-zinc-500">{description}</p> : null}
      </div>
    </label>
  );
}

function ProfileSection() {
  const { profile, loading } = useAuthProfile();
  const { saved, trigger } = useSavedIndicator();
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [instagram, setInstagram] = React.useState("");
  const [bio, setBio] = React.useState("");

  React.useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setPhone(profile.phone);
    setWebsiteUrl(profile.website);
    setInstagram(profile.instagram);
    setBio(profile.bio);
  }, [profile.bio, profile.email, profile.instagram, profile.name, profile.phone, profile.website]);

  const initials = name
    .split(" ")
    .flatMap((p) => (p[0] ? [p[0]] : []))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hasGoogleAvatar = profile.provider === "google" && profile.avatarUrl;

  return (
    <SectionCard
      id="perfil"
      eyebrow="01"
      title="Perfil"
      description="Cómo te mostramos en la app y en la galería pública."
      saved={saved}
      canSave={!loading && !isSaving}
      onSubmit={async () => {
        setSaveError(null);
        setIsSaving(true);

        try {
          const supabase = getSupabaseBrowserClient();
          const normalizedEmail = email.trim();
          const normalizedInstagram = instagram.trim().replace(/^@/, "");

          const { error: profileError } = await supabase.auth.updateUser({
            data: {
              business_name: name.trim(),
              full_name: name.trim(),
              phone: phone.trim(),
              website: websiteUrl.trim(),
              instagram: normalizedInstagram,
              bio: bio.trim(),
            },
          });
          if (profileError) throw profileError;

          if (normalizedEmail && normalizedEmail !== profile.email) {
            const { error: emailError } = await supabase.auth.updateUser({ email: normalizedEmail });
            if (emailError) throw emailError;
          }

          trigger();
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : "No se pudo guardar tu perfil.");
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <div className="flex items-center gap-4">
        {hasGoogleAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt={name ? `Avatar de ${name}` : "Avatar de perfil"}
            className="size-14 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex size-14 items-center justify-center rounded-full bg-zinc-100 text-base font-semibold text-zinc-700">
            {initials || "·"}
          </span>
        )}
        <div className="text-xs text-zinc-500">
          <p>{hasGoogleAvatar ? "Usando foto de Google." : "El avatar se genera con tus iniciales."}</p>
          <p className="mt-0.5">Datos sincronizados con lo que configuras en onboarding.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nombre o negocio" htmlFor="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Teléfono" htmlFor="phone" optional>
          <Input
            id="phone"
            placeholder="+504 9999-1234"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label="Sitio web o Instagram" htmlFor="website" optional>
          <Input
            id="website"
            placeholder="https://..."
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
        </Field>
        <Field label="Instagram" htmlFor="instagram" optional>
          <Input
            id="instagram"
            placeholder="@tuusuario"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field
            label="Bio"
            htmlFor="bio"
            hint="Aparece en la página pública de tus eventos."
            optional
          >
            <Textarea
              id="bio"
              rows={3}
              placeholder="Fotógrafo de deportes y eventos en Honduras."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </Field>
        </div>
        {saveError ? <p className="sm:col-span-2 text-sm text-red-600">{saveError}</p> : null}
      </div>
    </SectionCard>
  );
}

const ONBOARDING_COUNTRY_OPTIONS = [
  { value: "HN", label: "Honduras" },
  { value: "GT", label: "Guatemala" },
  { value: "SV", label: "El Salvador" },
  { value: "NI", label: "Nicaragua" },
  { value: "CR", label: "Costa Rica" },
  { value: "PA", label: "Panamá" },
  { value: "MX", label: "México" },
  { value: "CO", label: "Colombia" },
  { value: "OTRO", label: "Otro país" },
] as const;

const ONBOARDING_PAYOUT_OPTIONS = [
  {
    value: "transferencia",
    label: "Transferencia bancaria",
    description: "Recibe directo en tu banco local.",
  },
  {
    value: "tigo_money",
    label: "Tigo Money / billetera móvil",
    description: "Ideal si manejas pagos por celular.",
  },
  {
    value: "paypal",
    label: "PayPal",
    description: "Para retiros internacionales rápidos.",
  },
  {
    value: "wire",
    label: "Wire / SWIFT",
    description: "Para cuentas en USD u otras monedas.",
  },
  {
    value: "otro",
    label: "Lo conversamos",
    description: "Te contactamos para definirlo contigo.",
  },
] as const;

type OnboardingPayoutMethod = (typeof ONBOARDING_PAYOUT_OPTIONS)[number]["value"];

function BrandSection() {
  const { profile, loading } = useAuthProfile();
  const { saved, trigger } = useSavedIndicator();
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [primaryColor, setPrimaryColor] = React.useState(profile.brandColor);

  React.useEffect(() => {
    setPrimaryColor(profile.brandColor || "#2563eb");
  }, [profile.brandColor]);

  return (
    <SectionCard
      id="marca"
      eyebrow="02"
      title="Marca"
      description="Color principal configurado desde onboarding."
      saved={saved}
      canSave={!loading && !isSaving}
      onSubmit={async () => {
        setSaveError(null);
        setIsSaving(true);
        try {
          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase.auth.updateUser({
            data: {
              brand_color: primaryColor.trim() || "#2563eb",
            },
          });
          if (error) throw error;
          trigger();
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : "No se pudo guardar la marca.");
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Color principal" hint="Botones y acentos de la galería pública.">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="size-10 cursor-pointer rounded-md border border-zinc-200"
              aria-label="Color principal"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="font-mono"
              maxLength={7}
            />
          </div>
        </Field>
        <div className="flex items-end">
          <p className="text-xs text-zinc-500">
            Este valor se sincroniza con `brand_color` en tu onboarding.
          </p>
        </div>
      </div>
      {saveError ? <p className="mt-4 text-sm text-red-600">{saveError}</p> : null}
    </SectionCard>
  );
}

function PayoutSection() {
  const { profile, loading } = useAuthProfile();
  const { saved, trigger } = useSavedIndicator();
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [country, setCountry] = React.useState(profile.paymentsCountry);
  const [method, setMethod] = React.useState<OnboardingPayoutMethod | "">(
    (profile.paymentsMethod as OnboardingPayoutMethod) || ""
  );

  React.useEffect(() => {
    setCountry(profile.paymentsCountry);
    setMethod((profile.paymentsMethod as OnboardingPayoutMethod) || "");
  }, [profile.paymentsCountry, profile.paymentsMethod]);

  return (
    <SectionCard
      id="pagos"
      eyebrow="03"
      title="Pagos"
      description="Método y país configurados en onboarding."
      saved={saved}
      canSave={!loading && !isSaving && !!country && !!method}
      onSubmit={async () => {
        setSaveError(null);
        setIsSaving(true);
        try {
          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase.auth.updateUser({
            data: {
              payments_country: country,
              payments_method: method,
            },
          });
          if (error) throw error;
          trigger();
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : "No se pudo guardar pagos.");
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="País">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona tu país" />
            </SelectTrigger>
            <SelectContent>
              {ONBOARDING_COUNTRY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Método preferido">
          <Select value={method} onValueChange={(value) => setMethod(value as OnboardingPayoutMethod)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona método" />
            </SelectTrigger>
            <SelectContent>
              {ONBOARDING_PAYOUT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      {saveError ? <p className="mt-4 text-sm text-red-600">{saveError}</p> : null}
    </SectionCard>
  );
}

function NotificationsSection() {
  const { profile, loading } = useAuthProfile();
  const { saved, trigger } = useSavedIndicator();
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [sales, setSales] = React.useState(profile.notifSales);
  const [matches, setMatches] = React.useState(profile.notifMatches);
  const [weeklyDigest, setWeeklyDigest] = React.useState(profile.notifWeeklyDigest);

  React.useEffect(() => {
    setSales(profile.notifSales);
    setMatches(profile.notifMatches);
    setWeeklyDigest(profile.notifWeeklyDigest);
  }, [profile.notifMatches, profile.notifSales, profile.notifWeeklyDigest]);

  return (
    <SectionCard
      id="notificaciones"
      eyebrow="04"
      title="Notificaciones"
      description="Preferencias configuradas en onboarding."
      saved={saved}
      canSave={!loading && !isSaving}
      onSubmit={async () => {
        setSaveError(null);
        setIsSaving(true);
        try {
          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase.auth.updateUser({
            data: {
              notif_sales: sales,
              notif_matches: matches,
              notif_weekly_digest: weeklyDigest,
            },
          });
          if (error) throw error;
          trigger();
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : "No se pudo guardar notificaciones.");
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <div className="flex flex-col gap-1">
        <Toggle
          checked={sales}
          onChange={setSales}
          label="Avisarme de ventas"
          description="Notificación cuando recibes una venta."
        />
        <Toggle
          checked={matches}
          onChange={setMatches}
          label="Avisarme de nuevas coincidencias"
          description="Cuando haya actividad de búsqueda en tus eventos."
        />
        <Toggle
          checked={weeklyDigest}
          onChange={setWeeklyDigest}
          label="Resumen semanal"
          description="Resumen de actividad y desempeño de la semana."
        />
      </div>
      {saveError ? <p className="mt-4 text-sm text-red-600">{saveError}</p> : null}
    </SectionCard>
  );
}

const LOCALES: { value: SupportedLocale; label: string }[] = [
  { value: "es-HN", label: "Español (Honduras)" },
  { value: "es-MX", label: "Español (México)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "en-US", label: "English (US)" },
];

const TIMEZONES = [
  "America/Tegucigalpa",
  "America/Guatemala",
  "America/El_Salvador",
  "America/Managua",
  "America/Mexico_City",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Madrid",
];

function PreferencesSection() {
  const { settings, actions } = useLensia();
  const { saved, trigger } = useSavedIndicator();

  const [locale, setLocale] = React.useState<SupportedLocale>(settings.preferences.locale);
  const [timezone, setTimezone] = React.useState(settings.preferences.timezone);
  const [dateFormat, setDateFormat] = React.useState<"short" | "long">(
    settings.preferences.dateFormat
  );

  return (
    <SectionCard
      id="preferencias"
      eyebrow="05"
      title="Preferencias"
      description="Idioma, zona horaria y formato de fechas del dashboard."
      saved={saved}
      onSubmit={() => {
        actions.updateSettings("preferences", { locale, timezone, dateFormat });
        trigger();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Idioma">
          <Select value={locale} onValueChange={(v) => setLocale(v as SupportedLocale)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Zona horaria">
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Formato de fecha">
            <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as "short" | "long")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Corto (15 may 2026)</SelectItem>
                <SelectItem value="long">Largo (15 de mayo de 2026)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    </SectionCard>
  );
}

function DangerSection() {
  const { actions } = useLensia();
  const [confirming, setConfirming] = React.useState(false);

  return (
    <SectionCard
      id="peligro"
      eyebrow="06"
      title="Zona de peligro"
      description="Acciones irreversibles. Ten cuidado."
    >
      <div className="flex flex-col gap-4 rounded-lg border border-red-200 bg-red-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-red-900">Restablecer datos locales</p>
          <p className="mt-1 text-xs text-red-700/80">
            Limpia datos locales guardados en este navegador y vuelve al estado inicial vacío.
          </p>
        </div>
        {confirming ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                actions.reset();
                setConfirming(false);
              }}
            >
              Sí, restablecer
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirming(true)}
            className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-900"
          >
            Restablecer
          </Button>
        )}
      </div>
    </SectionCard>
  );
}

function SideNav() {
  const [active, setActive] = React.useState<string>(SECTIONS[0].id);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="sticky top-20 hidden self-start lg:block" aria-label="Navegación de ajustes">
      <p className="px-3 pb-2 text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
        Secciones
      </p>
      <ul className="flex flex-col gap-0.5">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={cn(
                "block rounded-md px-3 py-1.5 text-sm transition-colors",
                active === s.id
                  ? "bg-zinc-100 font-medium text-zinc-950"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
              )}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function SettingsPage() {
  const { session, users } = useLensia();
  const me = users.find((u) => u.id === session.userId);

  return (
    <>
      <Topbar
        title="Configuración"
        subtitle="Tu cuenta, tu marca, tus pagos"
        right={
          me ? (
            <Button variant="ghost" size="sm" asChild>
              <a
                href={`mailto:${me.email}`}
                className="inline-flex items-center gap-1.5"
                aria-label="Contactar soporte"
              >
                Soporte
                <ExternalLinkIcon />
              </a>
            </Button>
          ) : null
        }
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-950"
        >
          <ArrowLeftIcon className="size-3" />
          Volver al dashboard
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
          <SideNav />
          <div className="flex flex-col gap-6">
            <ProfileSection />
            <BrandSection />
            <PayoutSection />
            <NotificationsSection />
            <PreferencesSection />
            <DangerSection />
          </div>
        </div>
      </div>
    </>
  );
}
