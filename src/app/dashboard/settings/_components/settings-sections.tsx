"use client";

import * as React from "react";

import { useAuthProfile } from "@/lib/auth-profile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore, type SupportedLocale } from "@/lib/local-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RangeSlider } from "@/components/ui/range-slider";
import { WatermarkOverlay } from "@/components/photo/watermark-overlay";
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

function fileToImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo procesar la imagen."));
      img.onload = () => {
        const maxSize = 512;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo preparar el canvas."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Keep metadata lightweight by storing a compressed image.
        const webp = canvas.toDataURL("image/webp", 0.82);
        if (webp && webp.startsWith("data:image/webp")) {
          resolve(webp);
          return;
        }
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result ?? "");
    };
    reader.readAsDataURL(file);
  });
}

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
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [isProcessingAvatar, setIsProcessingAvatar] = React.useState(false);

  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(profile.name);
    setEmail(profile.email);
    setPhone(profile.phone);
    setWebsiteUrl(profile.website);
    setInstagram(profile.instagram);
    setBio(profile.bio);
    setAvatarUrl(profile.avatarUrl);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [
    profile.avatarUrl,
    profile.bio,
    profile.email,
    profile.instagram,
    profile.name,
    profile.phone,
    profile.website,
  ]);

  const initials = name
    .split(" ")
    .flatMap((p) => (p[0] ? [p[0]] : []))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const currentAvatarUrl = avatarUrl.trim();
  const hasAvatar = currentAvatarUrl.length > 0;

  async function onAvatarFileChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSaveError("Selecciona un archivo de imagen válido.");
      return;
    }
    setSaveError(null);
    setIsProcessingAvatar(true);
    try {
      const nextAvatar = await fileToImageDataUrl(file);
      setAvatarUrl(nextAvatar);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "No se pudo preparar la imagen."
      );
    } finally {
      setIsProcessingAvatar(false);
    }
  }

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
          const normalizedAvatarUrl = avatarUrl.trim();

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
              avatar_url: normalizedAvatarUrl || null,
            },
          });
          if (profileError) throw profileError;

          const { error: photographerError } = await supabase
            .from("photographers")
            .upsert(
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
          setSaveError(
            error instanceof Error ? error.message : "No se pudo guardar tu perfil."
          );
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <div className="flex items-center gap-4">
        {hasAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentAvatarUrl}
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
          <p>
            {hasAvatar
              ? "Usando tu imagen de perfil personalizada."
              : "El avatar se genera con tus iniciales."}
          </p>
          <p className="mt-0.5">Puedes pegar una URL de imagen y guardarla.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nombre o negocio" htmlFor="name">
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            label="Imagen de perfil"
            htmlFor="avatar-file"
            hint="Sube una imagen desde tus archivos. Recomendado: cuadrada."
            optional
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="avatar-file"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const inputEl = e.currentTarget;
                  const file = e.target.files?.[0] ?? null;
                  await onAvatarFileChange(file);
                  inputEl.value = "";
                }}
                className="py-1.5"
              />
              {isProcessingAvatar ? (
                <p className="text-xs text-zinc-500">Procesando imagen...</p>
              ) : null}
              {avatarUrl.trim() ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAvatarUrl("")}
                  disabled={isProcessingAvatar}
                >
                  Quitar
                </Button>
              ) : null}
            </div>
          </Field>
        </div>
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
        {saveError ? (
          <p className="text-sm text-red-600 sm:col-span-2">{saveError}</p>
        ) : null}
      </div>
    </SectionCard>
  );
}

const WATERMARK_PREVIEW_OPTIONS = [
  { id: "running", label: "Running", src: "/landing/fotos-webp/DSC04068.webp" },
  { id: "marathon", label: "Maratón", src: "/landing/fotos-webp/P1056924.webp" },
  { id: "team", label: "Equipo", src: "/landing/fotos-webp/DSC04612.webp" },
  { id: "stadium", label: "Estadio", src: "/landing/fotos-webp/P1253263.webp" },
] as const;

export function BrandSection() {
  const { profile, loading } = useAuthProfile();
  const { saved, trigger } = useSavedIndicator();
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [watermarkLabel, setWatermarkLabel] = React.useState(
    profile.watermarkLabel || "4Tercios"
  );
  const [watermarkOpacity, setWatermarkOpacity] = React.useState(
    profile.watermarkOpacity ?? 0.08
  );
  const [watermarkDensity, setWatermarkDensity] = React.useState(
    profile.watermarkDensity ?? 1
  );
  const [previewSrc, setPreviewSrc] = React.useState<string>(WATERMARK_PREVIEW_OPTIONS[0].src);

  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setWatermarkLabel(profile.watermarkLabel || "4Tercios");
    setWatermarkOpacity(profile.watermarkOpacity ?? 0.08);
    setWatermarkDensity(profile.watermarkDensity ?? 1);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [profile.watermarkLabel, profile.watermarkOpacity, profile.watermarkDensity]);

  return (
    <SectionCard
      id="marca"
      eyebrow="02"
      title="Marca"
      description="Configura el texto de marca de agua de tu galería."
      saved={saved}
      canSave={!loading && !isSaving}
      onSubmit={async () => {
        setSaveError(null);
        setIsSaving(true);
        try {
          const supabase = getSupabaseBrowserClient();
          const safeWatermarkLabel = watermarkLabel.trim() || "4Tercios";
          const safeWatermarkOpacity = Math.max(0.02, Math.min(0.45, watermarkOpacity));
          const safeWatermarkDensity = Math.max(0.4, Math.min(2.2, watermarkDensity));

          const { data: userRes, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          if (!userRes.user) throw new Error("No encontramos tu sesión.");

          const { error } = await supabase.auth.updateUser({
            data: {
              watermark_style: "subtle",
              watermark_color: "#ffffff",
              watermark_font: "sans",
              watermark_label: safeWatermarkLabel,
              watermark_opacity: safeWatermarkOpacity,
              watermark_density: safeWatermarkDensity,
            },
          });
          if (error) throw error;

          const fullPatch = {
            id: userRes.user.id,
            watermark_style: "subtle",
            watermark_color: "#ffffff",
            watermark_font: "sans",
            watermark_label: safeWatermarkLabel,
            watermark_opacity: safeWatermarkOpacity,
            watermark_density: safeWatermarkDensity,
          } as const;

          const photographerAttempts: Array<Record<string, unknown>> = [
            fullPatch,
            (() => {
              const { watermark_density, ...rest } = fullPatch;
              void watermark_density;
              return rest;
            })(),
            (() => {
              const { watermark_density, watermark_opacity, ...rest } = fullPatch;
              void watermark_density;
              void watermark_opacity;
              return rest;
            })(),
            { id: userRes.user.id },
          ];

          let lastError: { message?: string; code?: string } | null = null;
          let savedRow = false;
          for (const payload of photographerAttempts) {
            const res = await supabase
              .from("photographers")
              .upsert(payload, { onConflict: "id" });
            if (!res.error) {
              savedRow = true;
              break;
            }
            lastError = res.error as { message?: string; code?: string };
            if (lastError?.code !== "PGRST204") break;
          }
          if (!savedRow && lastError) {
            const code = lastError.code;
            if (code === "PGRST204") {
              setSaveError(
                "Guardamos el texto en tu perfil. Para persistirlo también en BD ejecuta las migraciones de branding en Supabase."
              );
            } else {
              throw new Error(lastError.message ?? "No se pudo guardar la marca.");
            }
          }

          trigger();
        } catch (error) {
          setSaveError(
            error instanceof Error ? error.message : "No se pudo guardar la marca."
          );
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Field
            label="Texto de marca de agua"
            hint="Aparecerá sobre cada foto entregada."
          >
            <Input
              value={watermarkLabel}
              onChange={(e) => setWatermarkLabel(e.target.value)}
              placeholder="4Tercios"
              maxLength={48}
            />
          </Field>

          <SliderControl
            label="Opacidad"
            description="Qué tan visible se ve sobre la foto."
            min={0.02}
            max={0.45}
            step={0.01}
            value={watermarkOpacity}
            onChange={(v) =>
              setWatermarkOpacity(Math.max(0.02, Math.min(0.45, v)))
            }
            valueLabel={`${Math.round(watermarkOpacity * 100)}%`}
            ariaLabel="Opacidad de watermark"
          />

          <SliderControl
            label="Cantidad de marca de agua"
            description="Más alto = más texto repetido sobre la foto."
            min={0.5}
            max={2.0}
            step={0.05}
            value={watermarkDensity}
            onChange={(v) =>
              setWatermarkDensity(Math.max(0.4, Math.min(2.2, v)))
            }
            valueLabel={watermarkDensity < 0.85
              ? "Bajo"
              : watermarkDensity < 1.25
                ? "Medio"
                : watermarkDensity < 1.7
                  ? "Alto"
                  : "Muy alto"}
            ariaLabel="Cantidad de watermark"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-900">Vista previa</p>
            <p className="text-xs text-zinc-500">
              Probando sobre una foto de ejemplo
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-sm">
            <div
              className="aspect-4/3 w-full bg-cover bg-center transition-[background-image] duration-300"
              style={{ backgroundImage: `url("${previewSrc}")` }}
            />
            <WatermarkOverlay
              label={watermarkLabel.trim() || "4Tercios"}
              style="subtle"
              color="#ffffff"
              font="sans"
              opacity={watermarkOpacity}
              tileDensity={watermarkDensity}
              density="preview"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {WATERMARK_PREVIEW_OPTIONS.map((opt) => {
              const active = previewSrc === opt.src;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPreviewSrc(opt.src)}
                  className={
                    active
                      ? "relative h-14 w-14 overflow-hidden rounded-lg ring-2 ring-zinc-950 ring-offset-2 ring-offset-white transition"
                      : "relative h-14 w-14 overflow-hidden rounded-lg ring-1 ring-zinc-200 transition hover:ring-zinc-400"
                  }
                  aria-label={`Probar con foto ${opt.label}`}
                  title={opt.label}
                >
                  <span
                    className="block h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url("${opt.src}")` }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {saveError ? <p className="mt-4 text-sm text-red-600">{saveError}</p> : null}
    </SectionCard>
  );
}

function SliderControl({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
  valueLabel,
  ariaLabel,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step: number;
  valueLabel: string;
  ariaLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-900">{label}</p>
          {description ? (
            <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
          ) : null}
        </div>
        <span className="text-sm font-semibold text-zinc-900 tabular-nums">
          {valueLabel}
        </span>
      </div>
      <RangeSlider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={onChange}
        ariaLabel={ariaLabel}
      />
    </div>
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

          const { error: photographerError } = await supabase
            .from("photographers")
            .upsert(
              {
                id: userRes.user.id,
                payout_country: country || null,
                payout_method: method || null,
              },
              { onConflict: "id" }
            );
          if (
            photographerError &&
            (photographerError as { code?: string }).code !== "PGRST204"
          ) {
            throw photographerError;
          }

          trigger();
        } catch (error) {
          setSaveError(
            error instanceof Error ? error.message : "No se pudo guardar pagos."
          );
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
          <Select
            value={method}
            onValueChange={(value) => setMethod(value as OnboardingPayoutMethod)}
          >
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
          setSaveError(
            error instanceof Error ? error.message : "No se pudo guardar notificaciones."
          );
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

  const [locale, setLocale] = React.useState<SupportedLocale>(
    settings.preferences.locale
  );
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
            <Select
              value={dateFormat}
              onValueChange={(v) => setDateFormat(v as "short" | "long")}
            >
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
            Limpia datos locales guardados en este navegador y vuelve al estado inicial
            vacío.
          </p>
        </div>
        {confirming ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
            >
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
