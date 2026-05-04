import Link from "next/link";
import Image from "next/image";

import { Brand } from "@/components/brand";

export function Footer({ variant = "default" }: { variant?: "default" | "dashboard" }) {
  const year = new Date().getFullYear();

  if (variant === "dashboard") {
    return (
      <footer className="border-t border-zinc-100 bg-white">
        <div className="flex w-full flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-zinc-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <Brand href="/" size="sm" />
            <p>© {year} 4Tercios</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacidad" className="hover:text-zinc-900">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-zinc-900">
              Términos
            </Link>
            <Link href="/contacto" className="hover:text-zinc-900">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  const containerClassName = "mx-auto w-full max-w-6xl px-4 lg:px-8";

  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 text-white">
      <div className={`${containerClassName} py-14 lg:py-16`}>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Image
              src="/brand/main-logo-hq.png"
              alt="4Tercios"
              width={428}
              height={86}
              priority
              className="h-4 w-auto"
            />
            <p className="mt-3 text-sm font-medium text-white">
              Reconocimiento facial para búsqueda de fotos
            </p>
            <p className="mt-4 max-w-md text-sm leading-6 text-white">
              Búsqueda por selfie para fotos de eventos. Publica tu galería, comparte un link o QR y
              deja que tus clientes encuentren sus coincidencias.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {["Carreras", "Graduaciones", "Bodas", "Torneos", "Corporativo"].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-white">Producto</p>
              <div className="mt-4 space-y-2">
                <Link href="/dashboard" className="block text-sm text-white hover:underline">
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/events/new"
                  className="block text-sm text-white hover:underline"
                >
                  Crear evento
                </Link>
                <Link
                  href="/e/carrera-10k-san-pedro-sula"
                  className="block text-sm text-white hover:underline"
                >
                  Ver evento publico
                </Link>
                {variant === "default" ? (
                  <Link href="/#comision" className="block text-sm text-white hover:underline">
                    Comisión
                  </Link>
                ) : null}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Privacidad</p>
              <div className="mt-4 space-y-2">
                <p className="text-sm leading-6 text-white">
                  Selfies solo para coincidencias. No se publican en la galeria.
                </p>
                <p className="text-sm leading-6 text-white">
                  Controlas el tiempo online de cada evento.
                </p>
                <Link href="/privacidad" className="block text-sm text-white hover:underline">
                  Política de privacidad
                </Link>
                <Link href="/terminos" className="block text-sm text-white hover:underline">
                  Términos de servicio
                </Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Soporte</p>
              <div className="mt-4 space-y-2">
                <a
                  href="mailto:hola@4tercios.thefndrs.com"
                  className="block text-sm text-white hover:underline"
                >
                  hola@4tercios.thefndrs.com
                </a>
                <p className="text-sm text-white">20% por venta. Tu defines el precio.</p>
                <Link href="/contacto" className="block text-sm text-white hover:underline">
                  Contacto
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-white">Cobro</p>
            <p className="mt-2 text-sm text-white">Comision del 20% por venta</p>
            <p className="mt-1 text-xs text-white">Sin suscripciones por ahora</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Entrega</p>
            <p className="mt-2 text-sm text-white">Link y QR para compartir</p>
            <p className="mt-1 text-xs text-white">Galeria publica con watermark</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Confianza</p>
            <p className="mt-2 text-sm text-white">Selfie privada, solo coincidencias</p>
            <p className="mt-1 text-xs text-white">Control del tiempo online por evento</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs text-white">© {year} 4Tercios. Todos los derechos reservados.</p>
          <p className="text-xs text-white">Hecho para fotografos de eventos en Centroamerica.</p>
        </div>
      </div>
    </footer>
  );
}
