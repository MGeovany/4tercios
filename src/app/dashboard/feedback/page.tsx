"use client";

import { useMemo, useState } from "react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { MessageSquareText } from "lucide-react";

import { Topbar } from "@/components/shell/topbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const FEEDBACK_TYPES = [
  { id: "bug", label: "Reportar bug" },
  { id: "idea", label: "Nueva idea" },
  { id: "ux", label: "Mejora de experiencia" },
  { id: "other", label: "Otro" },
] as const;

export default function FeedbackPage() {
  const [type, setType] = useState<(typeof FEEDBACK_TYPES)[number]["id"]>("idea");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  const mailtoHref = useMemo(() => {
    const subject = `[Feedback ${type.toUpperCase()}] ${title.trim() || "Sin título"}`;
    const body = `Tipo: ${type}\n\nDetalle:\n${details.trim() || "Sin detalle"}`;
    return `mailto:marlon.castro@thefndrs.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [details, title, type]);

  return (
    <>
      <Topbar title="Feedback" subtitle="Comparte ideas y mejoras para 4Tercios" />

      <div className="mx-auto w-full max-w-3xl space-y-4 px-6 py-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700">
            <MessageSquareText className="size-5" strokeWidth={1.75} />
          </div>

          <h2 className="mt-3 text-base font-semibold text-zinc-950">Enviar feedback al equipo</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Cuéntanos qué te gustaría mejorar. Esto abre tu cliente de correo con el mensaje listo.
          </p>

          <div className="mt-5 grid gap-4">
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase">Tipo</p>
              <div className="flex flex-wrap gap-1.5">
                {FEEDBACK_TYPES.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setType(option.id)}
                    className={
                      type === option.id
                        ? "rounded-full border border-zinc-950 bg-zinc-950 px-3 py-1 text-xs font-medium text-white"
                        : "rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-800">Título</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Mejorar rendimiento en filtros"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-800">Detalle</label>
              <Textarea
                rows={6}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe el problema o idea (pasos, pantalla, resultado esperado...)."
              />
            </div>

            <div className="pt-1">
              <a
                href={mailtoHref}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Enviar feedback
                <ArrowTopRightIcon className="size-4" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
