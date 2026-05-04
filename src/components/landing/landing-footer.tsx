import Link from "next/link";
import Image from "next/image";

import { LANDING_LOGO_HEIGHT, LANDING_LOGO_SRC, LANDING_LOGO_WIDTH } from "./constants";

export function LandingFooter() {
  return (
    <footer className="border-border/60 border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex rounded-xl transition-transform duration-200 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
            aria-label="4Tercios"
          >
            <Image
              src={LANDING_LOGO_SRC}
              alt="4Tercios"
              width={LANDING_LOGO_WIDTH}
              height={LANDING_LOGO_HEIGHT}
              className="h-3 w-auto transition-opacity duration-200 hover:opacity-80"
            />
          </Link>
          <span className="text-muted-foreground text-xs transition-colors duration-200 hover:text-foreground">
            · Reconocimiento facial para búsqueda de fotos
          </span>
        </div>
        <div className="text-muted-foreground flex gap-6 text-xs">
          <Link href="/terminos" className="transition-colors duration-200 hover:text-foreground">
            Términos
          </Link>
          <Link href="/privacidad" className="transition-colors duration-200 hover:text-foreground">
            Privacidad
          </Link>
          <Link href="/contacto" className="transition-colors duration-200 hover:text-foreground">
            Contacto
          </Link>
        </div>
        <p className="text-muted-foreground text-xs transition-colors duration-200 hover:text-foreground">
          © 2026 4Tercios
        </p>
      </div>
    </footer>
  );
}
