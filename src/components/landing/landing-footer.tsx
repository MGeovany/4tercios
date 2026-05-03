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
            className="inline-flex rounded-xl focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
            aria-label="4Tercios"
          >
            <Image
              src={LANDING_LOGO_SRC}
              alt="4Tercios"
              width={LANDING_LOGO_WIDTH}
              height={LANDING_LOGO_HEIGHT}
              className="h-5 w-auto"
            />
          </Link>
          <span className="text-muted-foreground text-xs">· Una selfie. Sus fotos.</span>
        </div>
        <div className="text-muted-foreground flex gap-6 text-xs">
          <Link href="/terminos" className="hover:text-foreground transition-colors">
            Términos
          </Link>
          <Link href="/privacidad" className="hover:text-foreground transition-colors">
            Privacidad
          </Link>
          <Link href="/contacto" className="hover:text-foreground transition-colors">
            Contacto
          </Link>
        </div>
        <p className="text-muted-foreground text-xs">© 2026 4Tercios</p>
      </div>
    </footer>
  );
}
