"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import {
  LANDING_LOGO_HEIGHT,
  LANDING_LOGO_SRC,
  LANDING_LOGO_WIDTH,
} from "@/components/landing/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function TocLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      className={cn(
        "text-muted-foreground hover:text-foreground block transition-colors",
        active && "text-foreground font-semibold"
      )}
      href={href}
    >
      {children}
    </a>
  );
}

function Hr() {
  return <div className="bg-border/60 my-10 h-px" />;
}

export default function PrivacidadPage() {
  const [activeSection, setActiveSection] = useState("que-recopilamos");

  useEffect(() => {
    const sectionIds = [
      "que-recopilamos",
      "como-usamos",
      "compartimos",
      "retencion",
      "seguridad",
      "derechos",
      "contacto",
    ];

    const updateActiveSection = () => {
      const activationLine = window.innerHeight * 0.36;
      let current = sectionIds[0];

      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (!section) continue;
        const { top } = section.getBoundingClientRect();
        if (top <= activationLine) {
          current = id;
        }
      }

      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
      ) {
        current = sectionIds[sectionIds.length - 1];
      }

      setActiveSection(current);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  return (
    <div className="bg-background font-manrope min-h-screen">
      <header className="border-border/40 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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
              className="h-4 w-auto"
              priority
            />
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Volver</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <header className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Política de privacidad
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            Última actualización: 2026-04-21
          </p>
          <p className="text-muted-foreground mt-6 leading-7">
            Esta política explica qué información usamos para operar 4Tercios y cómo la
            protegemos. Es un borrador y debe revisarse con asesoría legal antes de
            publicarse.
          </p>
        </header>

        <div className="mt-10 grid gap-10 md:grid-cols-[240px_1fr]">
          <aside className="hidden md:block">
            <div className="border-border/50 bg-card sticky top-24 rounded-xl border p-5">
              <p className="text-sm font-semibold">Contenido</p>
              <nav className="mt-4 space-y-2 text-sm">
                <TocLink
                  href="#que-recopilamos"
                  active={activeSection === "que-recopilamos"}
                >
                  1. Qué recopilamos
                </TocLink>
                <TocLink href="#como-usamos" active={activeSection === "como-usamos"}>
                  2. Cómo la usamos
                </TocLink>
                <TocLink href="#compartimos" active={activeSection === "compartimos"}>
                  3. Con quién compartimos
                </TocLink>
                <TocLink href="#retencion" active={activeSection === "retencion"}>
                  4. Retención
                </TocLink>
                <TocLink href="#seguridad" active={activeSection === "seguridad"}>
                  5. Seguridad
                </TocLink>
                <TocLink href="#derechos" active={activeSection === "derechos"}>
                  6. Tus derechos
                </TocLink>
                <TocLink href="#contacto" active={activeSection === "contacto"}>
                  7. Contacto
                </TocLink>
              </nav>
            </div>
          </aside>

          <article className="mx-auto w-full max-w-3xl pb-28">
            <section id="que-recopilamos" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">1. Qué recopilamos</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Dependiendo de cómo uses 4Tercios, podemos recopilar:
              </p>
              <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5">
                <li>Datos del evento (nombre, fecha, ubicación, link público).</li>
                <li>Fotos que subes para tu galería.</li>
                <li>
                  Datos básicos de solicitudes de compra (por ejemplo, selección de
                  fotos).
                </li>
                <li>Datos de soporte cuando nos contactas.</li>
              </ul>
              <p className="text-muted-foreground mt-4 leading-7">
                La selfie se usa para la búsqueda dentro del evento. No la usamos para
                publicidad.
              </p>
            </section>

            <Hr />

            <section id="como-usamos" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">2. Cómo la usamos</h2>
              <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5">
                <li>Para mostrar tu galería y habilitar solicitudes de compra.</li>
                <li>Para mejorar la experiencia y prevenir abusos.</li>
                <li>Para soporte y comunicación relacionada con el servicio.</li>
              </ul>
            </section>

            <Hr />

            <section id="compartimos" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">3. Con quién compartimos</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                No vendemos tu información. Podemos compartir datos únicamente cuando sea
                necesario para operar el servicio (por ejemplo, proveedores de
                infraestructura) o si la ley lo exige.
              </p>
            </section>

            <Hr />

            <section id="retencion" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">4. Retención</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Conservamos la información el tiempo necesario para prestar el servicio y
                cumplir obligaciones legales. Puedes solicitar eliminación.
              </p>
            </section>

            <Hr />

            <section id="seguridad" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">5. Seguridad</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Aplicamos medidas razonables para proteger la información. Ningún sistema
                es 100% seguro.
              </p>
            </section>

            <Hr />

            <section id="derechos" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">6. Tus derechos</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Puedes solicitar acceso, corrección o eliminación de información
                relacionada con tu evento.
              </p>
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/contacto">Solicitar ayuda</Link>
                </Button>
              </div>
            </section>

            <Hr />

            <section id="contacto" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">7. Contacto</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Para preguntas sobre privacidad, contáctanos.
              </p>
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/contacto">Ir a contacto</Link>
                </Button>
              </div>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}
