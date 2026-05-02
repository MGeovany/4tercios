"use client";

import * as React from "react";

import { CheckIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const SETTINGS_SECTIONS = [
  { id: "perfil", label: "Perfil" },
  { id: "marca", label: "Marca" },
  { id: "pagos", label: "Pagos" },
  { id: "notificaciones", label: "Notificaciones" },
  { id: "preferencias", label: "Preferencias" },
  { id: "peligro", label: "Zona de peligro" },
] as const;

export function useSavedIndicator() {
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

export function SectionCard({
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

export function Field({
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

export function Toggle({
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

export function SideNav() {
  const [active, setActive] = React.useState<string>(SETTINGS_SECTIONS[0].id);

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
    SETTINGS_SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
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
        {SETTINGS_SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={cn(
                "block rounded-md px-3 py-1.5 text-sm transition-colors",
                active === section.id
                  ? "bg-zinc-100 font-medium text-zinc-950"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
