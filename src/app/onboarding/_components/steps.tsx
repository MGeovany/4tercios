"use client";

import { AtSign, Bell, Check, Globe, Phone, Sparkles, Wallet } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  BRAND_COLORS,
  COUNTRY_OPTIONS,
  PAYOUT_METHODS,
  PHOTOGRAPHY_OPTIONS,
  type OnboardingState,
  type PayoutMethod,
  type PhotographyType,
} from "./types";

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">{subtitle}</p>
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-foreground text-background border-foreground"
          : "border-border text-foreground hover:border-foreground/40"
      )}
    >
      {children}
    </button>
  );
}

function Switch({
  checked,
  onChange,
  label,
  description,
  icon,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="border-border hover:border-foreground/30 flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors"
    >
      {icon ? (
        <span className="bg-muted text-foreground mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg">
          {icon}
        </span>
      ) : null}

      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{description}</p>
      </div>

      <span
        aria-hidden
        className={cn(
          "relative mt-1 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-foreground" : "bg-border"
        )}
      >
        <span
          className={cn(
            "bg-background inline-block size-4 rounded-full shadow-sm transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}

export function StepBusiness({
  value,
  onChange,
}: {
  value: OnboardingState["business"];
  onChange: (next: OnboardingState["business"]) => void;
}) {
  function toggleType(t: PhotographyType) {
    const exists = value.photographyTypes.includes(t);
    onChange({
      ...value,
      photographyTypes: exists
        ? value.photographyTypes.filter((x) => x !== t)
        : [...value.photographyTypes, t],
    });
  }

  return (
    <div className="space-y-7">
      <StepHeading
        title="Cuéntanos de tu negocio"
        subtitle="Esta información se mostrará en tus galerías. Podrás cambiarla cuando quieras."
      />

      <div className="space-y-5">
        <div className="grid gap-2">
          <Label htmlFor="businessName">
            Nombre del negocio <span className="text-muted-foreground">·</span>{" "}
            <span className="text-muted-foreground text-xs font-normal">requerido</span>
          </Label>
          <Input
            id="businessName"
            placeholder="Ej. Estudio Geo"
            value={value.businessName}
            onChange={(e) => onChange({ ...value, businessName: e.target.value })}
            required
            autoComplete="organization"
          />
        </div>

        <div className="grid gap-3">
          <Label>¿Qué tipo de eventos cubres?</Label>
          <div className="flex flex-wrap gap-2">
            {PHOTOGRAPHY_OPTIONS.map((opt) => (
              <ChipButton
                key={opt.value}
                active={value.photographyTypes.includes(opt.value)}
                onClick={() => toggleType(opt.value)}
              >
                {opt.label}
              </ChipButton>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">Elige uno o varios. Puedes saltarlo.</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bio">Bio breve</Label>
          <Textarea
            id="bio"
            rows={3}
            maxLength={160}
            placeholder="Una línea sobre tu trabajo. Ej. Capturamos momentos reales sin pose."
            value={value.bio}
            onChange={(e) => onChange({ ...value, bio: e.target.value })}
          />
          <p className="text-muted-foreground text-right text-xs tabular-nums">
            {value.bio.length}/160
          </p>
        </div>
      </div>
    </div>
  );
}

export function StepContact({
  value,
  onChange,
}: {
  value: OnboardingState["contact"];
  onChange: (next: OnboardingState["contact"]) => void;
}) {
  return (
    <div className="space-y-7">
      <StepHeading
        title="¿Cómo te encuentran?"
        subtitle="Todo es opcional. Aparecerá en tu galería pública para que tus clientes te contacten."
      />

      <div className="space-y-5">
        <div className="grid gap-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="text-muted-foreground size-3.5" />
            Teléfono / WhatsApp
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+504 9999-9999"
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            autoComplete="tel"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="text-muted-foreground size-3.5" />
            Sitio web
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://"
            value={value.website}
            onChange={(e) => onChange({ ...value, website: e.target.value })}
            autoComplete="url"
            inputMode="url"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="instagram" className="flex items-center gap-2">
            <AtSign className="text-muted-foreground size-3.5" />
            Instagram
          </Label>
          <div className="border-input focus-within:border-ring focus-within:ring-ring/50 flex h-9 w-full items-center rounded-md border bg-transparent transition-[color,box-shadow] focus-within:ring-[3px]">
            <span className="text-muted-foreground pl-3 text-sm">@</span>
            <input
              id="instagram"
              type="text"
              placeholder="tunegocio"
              value={value.instagram.replace(/^@/, "")}
              onChange={(e) => onChange({ ...value, instagram: e.target.value.replace(/^@/, "") })}
              className="placeholder:text-muted-foreground h-full w-full bg-transparent px-2 text-sm outline-none md:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StepBrand({
  value,
  onChange,
}: {
  value: OnboardingState["brand"];
  onChange: (next: OnboardingState["brand"]) => void;
}) {
  return (
    <div className="space-y-7">
      <StepHeading
        title="Personaliza tu galería"
        subtitle="Elige cómo se ve tu evento para los invitados. Después puedes ajustarlo por evento."
      />

      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
 Color principal
          </Label>
          <div className="flex flex-wrap gap-3">
            {BRAND_COLORS.map((c) => {
              const active = value.primaryColor.toLowerCase() === c.value.toLowerCase();
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onChange({ ...value, primaryColor: c.value })}
                  aria-label={c.label}
                  aria-pressed={active}
                  className={cn(
                    "relative size-10 rounded-full transition-transform",
                    active ? "ring-offset-background scale-105 ring-2 ring-offset-2" : "ring-0"
                  )}
                  style={{
                    backgroundColor: c.value,
                    ...(active ? { ["--tw-ring-color" as string]: c.value } : {}),
                  }}
                >
                  {active ? (
                    <Check
                      className="absolute inset-0 m-auto size-5 text-white drop-shadow"
                      strokeWidth={3}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="text-muted-foreground text-xs">
            Tus invitados verán este color en botones y acentos de la galería.
          </p>
        </div>

      </div>
    </div>
  );
}

export function StepPayments({
  value,
  onChange,
}: {
  value: OnboardingState["payments"];
  onChange: (next: OnboardingState["payments"]) => void;
}) {
  return (
    <div className="space-y-7">
      <StepHeading
        title="¿Cómo te pagamos?"
        subtitle="Por ahora solo dinos cómo prefieres recibir. Configurarás los datos antes de tu primera venta."
      />

      <div className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="country">País</Label>
          <Select value={value.country} onValueChange={(v) => onChange({ ...value, country: v })}>
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder="Selecciona tu país" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Método preferido</Label>
          <div className="grid gap-2">
            {PAYOUT_METHODS.map((m) => {
              const active = value.method === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => onChange({ ...value, method: m.value as PayoutMethod })}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    active
                      ? "border-foreground bg-muted/40"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                      active ? "bg-foreground text-background" : "bg-muted text-foreground"
                    )}
                  >
                    <Wallet className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1 size-4 shrink-0 rounded-full border transition-colors",
                      active ? "border-foreground bg-foreground" : "border-border"
                    )}
                  >
                    {active ? <Check className="text-background size-4" strokeWidth={3} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-muted-foreground bg-muted/40 rounded-md px-3 py-2 text-xs">
          No te pediremos datos bancarios ahora. Solo cuando confirmes tu primera venta.
        </p>
      </div>
    </div>
  );
}

export function StepNotifications({
  value,
  onChange,
}: {
  value: OnboardingState["notifications"];
  onChange: (next: OnboardingState["notifications"]) => void;
}) {
  return (
    <div className="space-y-7">
      <StepHeading
        title="Mantente al tanto"
        subtitle="Te avisamos solo cuando importa. Cambia esto cuando quieras desde Configuración."
      />

      <div className="space-y-3">
        <Switch
          checked={value.sales}
          onChange={(b) => onChange({ ...value, sales: b })}
          label="Nuevas ventas"
          description="Te llega un correo cuando se confirma una venta de fotos."
          icon={<Wallet className="size-4" />}
        />
        <Switch
          checked={value.matches}
          onChange={(b) => onChange({ ...value, matches: b })}
          label="Coincidencias en tus eventos"
          description="Avisamos cuando alguien encuentra fotos en tu galería."
          icon={<Bell className="size-4" />}
        />
        <Switch
          checked={value.weeklyDigest}
          onChange={(b) => onChange({ ...value, weeklyDigest: b })}
          label="Resumen semanal"
          description="Un correo los lunes con tus ventas, vistas y coincidencias."
          icon={<Sparkles className="size-4" />}
        />
      </div>
    </div>
  );
}
