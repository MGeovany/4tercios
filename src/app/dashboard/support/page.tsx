import Link from "next/link";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { LifeBuoy, Mail, MessageCircleMore } from "lucide-react";

import { Topbar } from "@/components/shell/topbar";

const FAQS = [
  {
    q: "¿Cómo publico un evento?",
    a: "Crea el evento, sube tus fotos y usa la pantalla de gestión para publicarlo cuando esté listo.",
  },
  {
    q: "¿Cómo reabro un evento archivado?",
    a: "En la lista de eventos, abre acciones del evento archivado y selecciona “Reabrir”.",
  },
  {
    q: "¿Dónde veo pagos y cobros?",
    a: "En la sección “Pagos” del dashboard encontrarás estado, referencia y montos.",
  },
];

export default function SupportPage() {
  return (
    <>
      <Topbar title="Soporte y ayuda" subtitle="Centro de ayuda para tu dashboard" />

      <div className="mx-auto w-full max-w-5xl space-y-5 px-6 py-8">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="inline-flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700">
              <Mail className="size-4" strokeWidth={1.75} />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-zinc-950">Email soporte</h2>
            <p className="mt-1 text-sm text-zinc-600">Te respondemos lo antes posible.</p>
            <a
              href="mailto:marlon.castro@thefndrs.com?subject=Soporte%204Tercios"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:underline"
            >
              marlon.castro@thefndrs.com <ExternalLinkIcon className="size-3.5" />
            </a>
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="inline-flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700">
              <MessageCircleMore className="size-4" strokeWidth={1.75} />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-zinc-950">Contacto general</h2>
            <p className="mt-1 text-sm text-zinc-600">Canal para dudas comerciales o alianzas.</p>
            <Link
              href="/contacto"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:underline"
            >
              Abrir contacto <ExternalLinkIcon className="size-3.5" />
            </Link>
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="inline-flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700">
              <LifeBuoy className="size-4" strokeWidth={1.75} />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-zinc-950">Legal y políticas</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Revisa términos y privacidad de la plataforma.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/terminos"
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Términos
              </Link>
              <Link
                href="/privacidad"
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Privacidad
              </Link>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-950">Preguntas frecuentes</h3>
          <div className="mt-3 divide-y divide-zinc-100">
            {FAQS.map((faq) => (
              <article key={faq.q} className="py-3">
                <p className="text-sm font-medium text-zinc-900">{faq.q}</p>
                <p className="mt-1 text-sm text-zinc-600">{faq.a}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
