import Link from "next/link";
import Image from "next/image";

import { Brand } from "@/components/brand";
import {
  LANDING_LOGO_HEIGHT,
  LANDING_LOGO_SRC,
  LANDING_LOGO_WIDTH,
} from "@/components/landing/constants";

export function Footer({ variant = "default" }: { variant?: "default" | "dashboard" }) {
  const year = new Date().getFullYear();

  if (variant === "dashboard") {
    return (
      <footer className="border-t border-zinc-100 bg-white">
        <div className="flex w-full flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-zinc-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <Brand href="/" />
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
      <div className={`${containerClassName} py-14`}>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <Image
              src={LANDING_LOGO_SRC}
              alt="4Tercios"
              width={LANDING_LOGO_WIDTH}
              height={LANDING_LOGO_HEIGHT}
              priority
              className="h-7 w-auto"
            />
            <p className="mt-4 max-w-md text-sm leading-6 text-zinc-300">
              Encuentra fotos de eventos con selfie en segundos. Comparte tu enlace y deja
              que tus clientes se encuentren solos.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Navegación</p>
            <div className="mt-4 space-y-2.5">
              <Link
                href="/dashboard"
                className="block text-sm text-zinc-300 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/events/new"
                className="block text-sm text-zinc-300 hover:text-white"
              >
                Crear evento
              </Link>
              <Link
                href="/contacto"
                className="block text-sm text-zinc-300 hover:text-white"
              >
                Contacto
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Legal</p>
            <div className="mt-4 space-y-2.5">
              <Link
                href="/privacidad"
                className="block text-sm text-zinc-300 hover:text-white"
              >
                Privacidad
              </Link>
              <Link
                href="/terminos"
                className="block text-sm text-zinc-300 hover:text-white"
              >
                Términos
              </Link>
              <a
                href="mailto:marlon.castro@thefndrs.com"
                className="hove r:text-white block text-sm text-zinc-300"
              >
                marlon.castro@thefndrs.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} 4Tercios. Todos los derechos reservados.</p>
          <p>Hecho para fotógrafos en Honduras.</p>
        </div>
      </div>
    </footer>
  );
}
