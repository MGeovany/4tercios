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
import { cn } from "@/lib/utils";
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
  const { session, users, actions } = useLensia();
  const me = users.find((u) => u.id === session.userId)!;
  const { saved, trigger } = useSavedIndicator();

  const [name, setName] = React.useState(me.name);
  const [email, setEmail] = React.useState(me.email);
  const [phone, setPhone] = React.useState(me.phone ?? "");
  const [websiteUrl, setWebsiteUrl] = React.useState(me.websiteUrl ?? "");
  const [bio, setBio] = React.useState(me.bio ?? "");

  const initials = name
    .split(" ")
    .flatMap((p) => (p[0] ? [p[0]] : []))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SectionCard
      id="perfil"
      eyebrow="01"
      title="Perfil"
      description="Cómo te mostramos en la app y en la galería pública."
      saved={saved}
      onSubmit={() => {
        actions.updateUser({
          name: name.trim() || me.name,
          email: email.trim() || me.email,
          phone: phone.trim() || undefined,
          websiteUrl: websiteUrl.trim() || undefined,
          bio: bio.trim() || undefined,
        });
        trigger();
      }}
    >
      <div className="flex items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-zinc-100 text-base font-semibold text-zinc-700">
          {initials || "·"}
        </span>
        <div className="text-xs text-zinc-500">
          <p>El avatar se genera con tus iniciales.</p>
          <p className="mt-0.5">Subir logo propio llegará pronto.</p>
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
      </div>
    </SectionCard>
  );
}

const WATERMARK_OPTIONS: { value: WatermarkStyle; label: string; description: string }[] = [
  { value: "none", label: "Sin marca", description: "Solo vista previa borrosa." },
  { value: "subtle", label: "Sutil", description: "Texto pequeño en esquina." },
  { value: "bold", label: "Visible", description: "Marca diagonal grande." },
];

function BrandSection() {
  const { settings, actions } = useLensia();
  const { saved, trigger } = useSavedIndicator();

  const [primaryColor, setPrimaryColor] = React.useState(settings.brand.primaryColor);
  const [watermarkStyle, setWatermarkStyle] = React.useState<WatermarkStyle>(
    settings.brand.watermarkStyle
  );
  const [instagramHandle, setInstagramHandle] = React.useState(
    settings.brand.instagramHandle ?? ""
  );

  return (
    <SectionCard
      id="marca"
      eyebrow="02"
      title="Marca de galería"
      description="Cómo se ve tu galería cuando tus clientes la abren."
      saved={saved}
      onSubmit={() => {
        actions.updateSettings("brand", {
          primaryColor,
          watermarkStyle,
          instagramHandle: instagramHandle.trim() || undefined,
        });
        trigger();
      }}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Color primario" hint="Botones, acentos y elementos destacados.">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="size-10 cursor-pointer rounded-md border border-zinc-200"
                aria-label="Color primario"
              />
            </div>
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="font-mono"
              maxLength={7}
            />
          </div>
        </Field>

        <Field label="Handle de Instagram" optional htmlFor="ig">
          <div className="flex items-center rounded-md border border-zinc-200 bg-white focus-within:border-zinc-400 focus-within:ring-[3px] focus-within:ring-zinc-950/10">
            <span className="px-3 text-sm text-zinc-500 select-none">@</span>
            <input
              id="ig"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ""))}
              placeholder="sulaphotostudio"
              className="h-9 flex-1 rounded-r-md border-0 bg-transparent pr-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </Field>
      </div>

      <div className="mt-6">
        <Label>Estilo de watermark</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {WATERMARK_OPTIONS.map((opt) => {
            const active = watermarkStyle === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setWatermarkStyle(opt.value)}
                className={cn(
                  "flex flex-col items-start rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-zinc-950 bg-zinc-50"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium text-zinc-950">{opt.label}</span>
                  <span
                    className={cn(
                      "size-4 rounded-full border-2 transition-colors",
                      active ? "border-zinc-950 bg-zinc-950" : "border-zinc-300"
                    )}
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-500">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

const PAYOUT_OPTIONS: {
  value: PayoutMethod;
  label: string;
  description: string;
}[] = [
  { value: "none", label: "Sin configurar", description: "Configuras esto cuando vendas." },
  { value: "bank", label: "Transferencia bancaria", description: "BAC, Ficohsa, Atlántida, etc." },
  { value: "mobile-money", label: "Billetera móvil", description: "Tigo Money, Claro Pay, Nequi." },
  { value: "paypal", label: "PayPal", description: "Para cobros en USD." },
];

function maskedAccount(value: string) {
  if (!value) return "";
  const clean = value.replace(/\s+/g, "");
  if (clean.length <= 4) return clean;
  return `${"•".repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
}

function PayoutSection() {
  const { settings, actions } = useLensia();
  const { saved, trigger } = useSavedIndicator();

  const [method, setMethod] = React.useState<PayoutMethod>(settings.payout.method);
  const [currency, setCurrency] = React.useState<"HNL" | "USD">(settings.payout.currency);
  const [accountHolder, setAccountHolder] = React.useState(settings.payout.accountHolder ?? "");
  const [rtn, setRtn] = React.useState(settings.payout.rtn ?? "");
  const [bankName, setBankName] = React.useState(settings.payout.bankName ?? "");
  const [accountNumber, setAccountNumber] = React.useState(settings.payout.accountNumber ?? "");
  const [mobileProvider, setMobileProvider] = React.useState(settings.payout.mobileProvider ?? "");
  const [mobilePhone, setMobilePhone] = React.useState(settings.payout.mobilePhone ?? "");
  const [paypalEmail, setPaypalEmail] = React.useState(settings.payout.paypalEmail ?? "");

  return (
    <SectionCard
      id="pagos"
      eyebrow="03"
      title="Pagos"
      description="Dónde recibes el dinero de tus ventas, menos la comisión."
      saved={saved}
      onSubmit={() => {
        actions.updateSettings("payout", {
          method,
          currency,
          accountHolder: accountHolder.trim() || undefined,
          rtn: rtn.trim() || undefined,
          bankName: method === "bank" ? bankName.trim() || undefined : undefined,
          accountNumber: method === "bank" ? accountNumber.trim() || undefined : undefined,
          mobileProvider:
            method === "mobile-money" ? mobileProvider.trim() || undefined : undefined,
          mobilePhone: method === "mobile-money" ? mobilePhone.trim() || undefined : undefined,
          paypalEmail: method === "paypal" ? paypalEmail.trim() || undefined : undefined,
        });
        trigger();
      }}
    >
      <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
        <InfoCircledIcon className="mt-0.5 size-4 shrink-0 text-zinc-500" />
        <div className="text-xs leading-5 text-zinc-600">
          Tu cuenta aún no tiene ventas pendientes. Al confirmar la primera, depositaremos el neto
          (después del 20% de comisión) usando el método que configures aquí.
        </div>
      </div>

      <div className="mt-6">
        <Label>Método de cobro</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {PAYOUT_OPTIONS.map((opt) => {
            const active = method === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMethod(opt.value)}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-zinc-950 bg-zinc-50"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                )}
              >
                <div>
                  <p className="text-sm font-medium text-zinc-950">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{opt.description}</p>
                </div>
                <span
                  className={cn(
                    "mt-0.5 size-4 shrink-0 rounded-full border-2 transition-colors",
                    active ? "border-zinc-950 bg-zinc-950" : "border-zinc-300"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {method !== "none" ? (
        <div className="mt-6 grid gap-4 border-t border-zinc-100 pt-6 sm:grid-cols-2">
          <Field label="Nombre del titular" htmlFor="holder">
            <Input
              id="holder"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Como aparece en tu cuenta"
            />
          </Field>
          <Field label="RTN" hint="Para emisión de factura." optional htmlFor="rtn">
            <Input
              id="rtn"
              value={rtn}
              onChange={(e) => setRtn(e.target.value)}
              placeholder="0801-1999-12345"
            />
          </Field>

          {method === "bank" ? (
            <>
              <Field label="Banco" htmlFor="bank">
                <Input
                  id="bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="BAC, Ficohsa, Atlántida..."
                />
              </Field>
              <Field
                label="Número de cuenta"
                htmlFor="acct"
                hint={accountNumber ? `Guardado como ${maskedAccount(accountNumber)}` : undefined}
              >
                <Input
                  id="acct"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  inputMode="numeric"
                />
              </Field>
            </>
          ) : null}

          {method === "mobile-money" ? (
            <>
              <Field label="Proveedor" htmlFor="mprov">
                <Input
                  id="mprov"
                  value={mobileProvider}
                  onChange={(e) => setMobileProvider(e.target.value)}
                  placeholder="Tigo Money, Claro Pay..."
                />
              </Field>
              <Field label="Número registrado" htmlFor="mphone">
                <Input
                  id="mphone"
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(e.target.value)}
                  placeholder="+504 9999-1234"
                />
              </Field>
            </>
          ) : null}

          {method === "paypal" ? (
            <div className="sm:col-span-2">
              <Field label="Email de PayPal" htmlFor="paypal">
                <Input
                  id="paypal"
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="tu-correo@ejemplo.com"
                />
              </Field>
            </div>
          ) : null}

          <Field label="Moneda preferida" hint="Afecta el formato en tu dashboard.">
            <Select value={currency} onValueChange={(v) => setCurrency(v as "HNL" | "USD")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HNL">Lempira hondureño (HNL)</SelectItem>
                <SelectItem value="USD">Dólar estadounidense (USD)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      ) : null}
    </SectionCard>
  );
}

function NotificationsSection() {
  const { settings, actions } = useLensia();
  const { saved, trigger } = useSavedIndicator();

  const [draft, setDraft] = React.useState<LensiaSettings["notifications"]>(settings.notifications);

  const toggle = (key: keyof LensiaSettings["notifications"]) => (next: boolean) =>
    setDraft((d) => ({ ...d, [key]: next }));

  return (
    <SectionCard
      id="notificaciones"
      eyebrow="04"
      title="Notificaciones"
      description="Cuándo y cómo te avisamos de la actividad de tus eventos."
      saved={saved}
      onSubmit={() => {
        actions.updateSettings("notifications", draft);
        trigger();
      }}
    >
      <div>
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Por email</p>
        <div className="mt-2 flex flex-col gap-1">
          <Toggle
            checked={draft.emailNewOrder}
            onChange={toggle("emailNewOrder")}
            label="Nueva orden"
            description="Te avisamos apenas alguien solicita la compra."
          />
          <Toggle
            checked={draft.emailWeeklySummary}
            onChange={toggle("emailWeeklySummary")}
            label="Resumen semanal"
            description="Métricas y ventas cada lunes."
          />
          <Toggle
            checked={draft.emailProductNews}
            onChange={toggle("emailProductNews")}
            label="Novedades de 4Tercios"
            description="Nuevas funciones y tips. Sin spam."
          />
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-100 pt-6">
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Por WhatsApp</p>
        <div className="mt-2 flex flex-col gap-1">
          <Toggle
            checked={draft.whatsappNewOrder}
            onChange={toggle("whatsappNewOrder")}
            label="Nueva orden"
            description="Mensaje al número de contacto del evento."
          />
        </div>
      </div>
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
            Vuelve al estado demo con los eventos y órdenes de ejemplo. Se borran tus cambios
            guardados en este navegador.
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
