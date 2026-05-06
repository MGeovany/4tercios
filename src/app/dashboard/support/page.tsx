import Link from "next/link";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { LifeBuoy, Mail, MessageCircleMore } from "lucide-react";

import { Topbar } from "@/components/shell/topbar";

const FAQS = [
  {
    q: "¿Cómo publico un evento?",
    a: "Crea el evento, sube tus fotos y, cuando todo esté revisado, cambia su estado a público desde Gestión.",
  },
  {
    q: "¿Cuál es el flujo recomendado para vender más rápido?",
    a: "Sube fotos en lotes, verifica miniaturas, publica el evento y comparte primero el enlace de selfie; luego comparte la galería completa.",
  },
  {
    q: "¿Cómo reabro un evento archivado?",
    a: "Ve a Eventos, abre el menú de acciones del evento archivado y selecciona “Reabrir” para extender su tiempo en línea.",
  },
  {
    q: "¿Cuánto tiempo dura un evento publicado?",
    a: "Depende de los días online configurados en el evento. Cuando ese periodo termina, el evento pasa a archivado.",
  },
  {
    q: "¿Qué diferencia hay entre búsqueda por selfie y galería completa?",
    a: "La selfie muestra fotos donde aparece el cliente; la galería completa permite explorar todas las imágenes del evento.",
  },
  {
    q: "¿Cómo confirma el cliente su compra?",
    a: "El cliente selecciona fotos, completa su nombre y WhatsApp, y finaliza por pago online o solicitud directa por WhatsApp.",
  },
  {
    q: "¿Dónde veo pagos y cobros?",
    a: "En la sección “Pagos” puedes revisar estado de pago, referencia, monto total y seguimiento de cada orden.",
  },
  {
    q: "¿Puedo editar precio o datos del evento después de publicarlo?",
    a: "Sí. Desde editar evento puedes ajustar precio, ubicación y contacto; los cambios se reflejan en el enlace público.",
  },
  {
    q: "¿Qué hago si un cliente no encuentra sus fotos?",
    a: "Pídele intentar con otra selfie, revisar la galería completa y verificar que esté usando el enlace correcto del evento.",
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
            <p className="mt-1 text-sm text-zinc-600">
              Canal para dudas comerciales o alianzas.
            </p>
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
            <h2 className="mt-3 text-sm font-semibold text-zinc-950">
              Legal y políticas
            </h2>
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
