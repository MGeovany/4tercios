"use client";

import Link from "next/link";
import Image from "next/image";
import { LazyMotion, domAnimation, m } from "framer-motion";

import {
  LANDING_LOGO_HEIGHT,
  LANDING_LOGO_SRC,
  LANDING_LOGO_WIDTH,
} from "@/components/landing/constants";
import { Button } from "@/components/ui/button";

export default function ContactoPage() {
  return (
    <div className="font-manrope min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="inline-flex rounded-xl focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none"
            aria-label="4Tercios"
          >
            <Image
              src={LANDING_LOGO_SRC}
              alt="4Tercios"
              width={LANDING_LOGO_WIDTH}
              height={LANDING_LOGO_HEIGHT}
              className="h-4 w-auto invert"
              priority
            />
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="text-white hover:text-white/80">
              Volver
            </Link>
          </Button>
        </nav>
      </header>

      <LazyMotion features={domAnimation}>
        <main className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
          <m.header
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Contacto
            </h1>
            <p className="mt-4 text-base text-white/70">
              Escríbenos para soporte, preguntas o alianzas.
            </p>
          </m.header>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
            <m.section
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-white/15 bg-white/5 p-6 sm:p-7"
            >
              <h2 className="text-sm font-semibold text-white">Email</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Responderemos lo antes posible.
              </p>
              <div className="mt-5">
                <Button asChild className="bg-white text-black hover:bg-white/90">
                  <a href="mailto:hola@4tercios.thefndrs.com">
                    marlon.castro@thefndrs.com
                  </a>
                </Button>
              </div>
            </m.section>

            <m.section
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-white/15 bg-white/5 p-6 sm:p-7"
            >
              <h2 className="text-sm font-semibold text-white">Legal</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Políticas y documentos.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  asChild
                  className="border-white/20 bg-transparent text-white hover:bg-white hover:text-black"
                >
                  <Link href="/terminos">Términos</Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-white/20 bg-transparent text-white hover:bg-white hover:text-black"
                >
                  <Link href="/privacidad">Privacidad</Link>
                </Button>
              </div>
            </m.section>
          </div>
        </main>
      </LazyMotion>
    </div>
  );
}
