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
  const [active, setActive] = React.useState<string>(() => {
    if (typeof window === "undefined") return SETTINGS_SECTIONS[0].id;
    const fromHash = window.location.hash.replace("#", "");
    return SETTINGS_SECTIONS.some((section) => section.id === fromHash)
      ? fromHash
      : SETTINGS_SECTIONS[0].id;
  });

  React.useEffect(() => {
    const onHashChange = () => {
      const next = window.location.hash.replace("#", "");
      if (SETTINGS_SECTIONS.some((section) => section.id === next)) {
        setActive(next);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  React.useEffect(() => {
    const TOP_OFFSET = 140;

    const resolveActive = () => {
      const positions = SETTINGS_SECTIONS.map((section) => {
        const el = document.getElementById(section.id);
        if (!el) return null;
        return { id: section.id, top: el.getBoundingClientRect().top };
      }).filter(
        (entry): entry is { id: (typeof SETTINGS_SECTIONS)[number]["id"]; top: number } =>
          entry !== null
      );

      if (!positions.length) return;

      // Prefer the section that has crossed the top offset and is closest to it.
      const crossed = positions.filter((entry) => entry.top <= TOP_OFFSET);
      if (crossed.length > 0) {
        crossed.sort((a, b) => b.top - a.top);
        setActive(crossed[0].id);
        return;
      }

      // Fallback: the first section visible below the offset.
      positions.sort((a, b) => a.top - b.top);
      setActive(positions[0].id);
    };

    resolveActive();
    window.addEventListener("scroll", resolveActive, { passive: true });
    window.addEventListener("resize", resolveActive);
    return () => {
      window.removeEventListener("scroll", resolveActive);
      window.removeEventListener("resize", resolveActive);
    };
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
              onClick={(e) => {
                e.preventDefault();
                setActive(section.id);
                const el = document.getElementById(section.id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.replaceState(null, "", `#${section.id}`);
                }
              }}
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
