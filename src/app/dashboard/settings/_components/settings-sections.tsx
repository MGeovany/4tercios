"use client";

import * as React from "react";

import {
  BRAND_FONTS,
  BRAND_PALETTES,
  normalizeHexColor,
  WATERMARK_FONTS,
  WATERMARK_STYLES,
  type BrandFontId,
  type BrandPaletteId,
  type WatermarkFontId,
  type WatermarkStyle,
} from "@/lib/branding";
import { useAuthProfile } from "@/lib/auth-profile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore, type SupportedLocale } from "@/lib/local-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { Field, SectionCard, Toggle, useSavedIndicator } from "./settings-primitives";

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
  
] as const;

type OnboardingPayoutMethod = (typeof ONBOARDING_PAYOUT_OPTIONS)[number]["value"];

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

export function ProfileSection() {
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
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(profile.name);
    setEmail(profile.email);
    setPhone(profile.phone);
    setWebsiteUrl(profile.website);
    setInstagram(profile.instagram);
    setBio(profile.bio);
    /* eslint-enable react-hooks/set-state-in-effect */
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
          const normalizedName = name.trim();
          const normalizedPhone = phone.trim();

          const { data: userRes, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          if (!userRes.user) throw new Error("No encontramos tu sesión.");

          const { error: profileError } = await supabase.auth.updateUser({
            data: {
              business_name: normalizedName,
              full_name: normalizedName,
              phone: normalizedPhone,
              website: websiteUrl.trim(),
              instagram: normalizedInstagram,
              bio: bio.trim(),
            },
          });
          if (profileError) throw profileError;

          const { error: photographerError } = await supabase.from("photographers").upsert(
            {
              id: userRes.user.id,
              business_name: normalizedName || "Fotógrafo",
              whatsapp: normalizedPhone || null,
            },
            { onConflict: "id" }
          );
          if (photographerError) throw photographerError;

          if (normalizedEmail && normalizedEmail !== profile.email) {
            const { error: emailError } = await supabase.auth.updateUser({
              email: normalizedEmail,
            });
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
        {saveError ? <p className="text-sm text-red-600 sm:col-span-2">{saveError}</p> : null}
      </div>
    </SectionCard>
  );
}

export function BrandSection() {
  const { profile, loading } = useAuthProfile();
  const { saved, trigger } = useSavedIndicator();
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [primaryColor, setPrimaryColor] = React.useState(profile.brandColor);
  const [palette, setPalette] = React.useState<BrandPaletteId>(profile.brandPalette);
  const [brandFont, setBrandFont] = React.useState<BrandFontId>(profile.brandFont);
  const [watermarkStyle, setWatermarkStyle] = React.useState<WatermarkStyle>(profile.watermarkStyle);
  const [watermarkColor, setWatermarkColor] = React.useState(profile.watermarkColor);
  const [watermarkFont, setWatermarkFont] = React.useState<WatermarkFontId>(profile.watermarkFont);

  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setPrimaryColor(profile.brandColor || "#2563eb");
    setPalette(profile.brandPalette);
    setBrandFont(profile.brandFont);
    setWatermarkStyle(profile.watermarkStyle);
    setWatermarkColor(profile.watermarkColor);
    setWatermarkFont(profile.watermarkFont);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [
    profile.brandColor,
    profile.brandFont,
    profile.brandPalette,
    profile.watermarkColor,
    profile.watermarkFont,
    profile.watermarkStyle,
  ]);

  return (
    <SectionCard
      id="marca"
      eyebrow="02"
      title="Marca"
      description="Personaliza paleta, fuente y marca de agua para tu landing y galería."
      saved={saved}
      canSave={!loading && !isSaving}
      onSubmit={async () => {
        setSaveError(null);
        setIsSaving(true);
        try {
          const supabase = getSupabaseBrowserClient();
          const safePrimary = normalizeHexColor(primaryColor, "#2563eb");
          const safeWatermark = normalizeHexColor(watermarkColor, "#ffffff");

          const { data: userRes, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          if (!userRes.user) throw new Error("No encontramos tu sesión.");

          const { error } = await supabase.auth.updateUser({
            data: {
              brand_color: safePrimary,
              brand_palette: palette,
              brand_font: brandFont,
              watermark_style: watermarkStyle,
              watermark_color: safeWatermark,
              watermark_font: watermarkFont,
            },
          });
          if (error) throw error;

          const fullPatch = {
            id: userRes.user.id,
            brand_color: safePrimary,
            theme_palette: palette,
            theme_font: brandFont,
            watermark_style: watermarkStyle,
            watermark_color: safeWatermark,
            watermark_font: watermarkFont,
          } as const;

          const { error: photographerError } = await supabase
            .from("photographers")
            .upsert(fullPatch, { onConflict: "id" });

          if (photographerError) {
            const code = (photographerError as { code?: string }).code;
            if (code === "PGRST204") {
              const { error: minimalError } = await supabase
                .from("photographers")
                .upsert({ id: userRes.user.id, brand_color: safePrimary }, { onConflict: "id" });
              if (minimalError) throw minimalError;
              setSaveError(
                "Aplicamos el color y guardamos el resto en tu perfil. Para activar paleta/watermark en BD ejecuta la migración 0005_branding_theme.sql en Supabase."
              );
            } else {
              throw photographerError;
            }
          }

          trigger();
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : "No se pudo guardar la marca.");
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Paleta de color" hint="Define el look base de la plataforma.">
          <Select value={palette} onValueChange={(v) => setPalette(v as BrandPaletteId)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRAND_PALETTES.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1.5 text-xs text-zinc-500">
            {BRAND_PALETTES.find((option) => option.id === palette)?.description}
          </p>
        </Field>
        <Field label="Fuente" hint="Tipografía principal para dashboard y páginas públicas.">
          <Select value={brandFont} onValueChange={(v) => setBrandFont(v as BrandFontId)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRAND_FONTS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
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
        <Field label="Estilo de marca de agua">
          <Select value={watermarkStyle} onValueChange={(v) => setWatermarkStyle(v as WatermarkStyle)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WATERMARK_STYLES.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1.5 text-xs text-zinc-500">
            {WATERMARK_STYLES.find((option) => option.id === watermarkStyle)?.description}
          </p>
        </Field>
        <Field label="Color del watermark">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={watermarkColor}
              onChange={(e) => setWatermarkColor(e.target.value)}
              className="size-10 cursor-pointer rounded-md border border-zinc-200"
              aria-label="Color de watermark"
            />
            <Input
              value={watermarkColor}
              onChange={(e) => setWatermarkColor(e.target.value)}
              className="font-mono"
              maxLength={7}
            />
          </div>
        </Field>
        <Field label="Fuente del watermark">
          <Select value={watermarkFont} onValueChange={(value) => setWatermarkFont(value as WatermarkFontId)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WATERMARK_FONTS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 sm:col-span-2">
          <p className="text-sm text-zinc-800">
            Vista previa:{" "}
            <span className="font-semibold" style={{ color: normalizeHexColor(primaryColor, "#2563eb") }}>
              {BRAND_PALETTES.find((option) => option.id === palette)?.name}
            </span>{" "}
            · Watermark{" "}
            <span style={{ color: normalizeHexColor(watermarkColor, "#ffffff") }}>
              {WATERMARK_STYLES.find((option) => option.id === watermarkStyle)?.name}
            </span>
          </p>
        </div>
      </div>
      {saveError ? <p className="mt-4 text-sm text-red-600">{saveError}</p> : null}
    </SectionCard>
  );
}

export function PayoutSection() {
  const { profile, loading } = useAuthProfile();
  const { saved, trigger } = useSavedIndicator();
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [country, setCountry] = React.useState(profile.paymentsCountry);
  const [method, setMethod] = React.useState<OnboardingPayoutMethod | "">(
    (profile.paymentsMethod as OnboardingPayoutMethod) || ""
  );

  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setCountry(profile.paymentsCountry);
    setMethod((profile.paymentsMethod as OnboardingPayoutMethod) || "");
    /* eslint-enable react-hooks/set-state-in-effect */
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
          const { data: userRes, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          if (!userRes.user) throw new Error("No encontramos tu sesión.");

          const { error } = await supabase.auth.updateUser({
            data: {
              payments_country: country,
              payments_method: method,
            },
          });
          if (error) throw error;

          const { error: photographerError } = await supabase.from("photographers").upsert(
            {
              id: userRes.user.id,
              payout_country: country || null,
              payout_method: method || null,
            },
            { onConflict: "id" }
          );
          if (photographerError && (photographerError as { code?: string }).code !== "PGRST204") {
            throw photographerError;
          }

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

export function NotificationsSection() {
  const { profile, loading } = useAuthProfile();
  const { saved, trigger } = useSavedIndicator();
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [sales, setSales] = React.useState(profile.notifSales);
  const [matches, setMatches] = React.useState(profile.notifMatches);
  const [weeklyDigest, setWeeklyDigest] = React.useState(profile.notifWeeklyDigest);

  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSales(profile.notifSales);
    setMatches(profile.notifMatches);
    setWeeklyDigest(profile.notifWeeklyDigest);
    /* eslint-enable react-hooks/set-state-in-effect */
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

export function PreferencesSection() {
  const { settings, actions } = useAppStore();
  const { saved, trigger } = useSavedIndicator();

  const [locale, setLocale] = React.useState<SupportedLocale>(settings.preferences.locale);
  const [timezone, setTimezone] = React.useState(settings.preferences.timezone);
  const [dateFormat, setDateFormat] = React.useState<"short" | "long">(settings.preferences.dateFormat);

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
              {LOCALES.map((localeOption) => (
                <SelectItem key={localeOption.value} value={localeOption.value}>
                  {localeOption.label}
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
              {TIMEZONES.map((timezoneOption) => (
                <SelectItem key={timezoneOption} value={timezoneOption}>
                  {timezoneOption.replace("_", " ")}
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

export function DangerSection() {
  const { actions } = useAppStore();
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
