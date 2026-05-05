"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  LANDING_LOGO_HEIGHT,
  LANDING_LOGO_SRC,
  LANDING_LOGO_WIDTH,
} from "@/components/landing/constants";
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

export default function TerminosPage() {
  const [activeSection, setActiveSection] = useState("definiciones");

  useEffect(() => {
    const sectionIds = [
      "definiciones",
      "aceptacion",
      "cuentas",
      "uso",
      "contenido",
      "privacidad",
      "ventas",
      "pagos",
      "suspension",
      "propiedad",
      "responsabilidad",
      "indemnizacion",
      "ley",
      "cambios",
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

      // Cuando llegas al final del documento, fuerza el último item.
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
            Términos de servicio
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            Última actualización: 2026-04-21
          </p>
          <p className="text-muted-foreground mt-6 leading-7">
            Estos términos regulan el uso de 4Tercios. Son un borrador y deben revisarse
            con asesoría legal antes de publicarse.
          </p>
        </header>

        <div className="mt-10 grid gap-10 md:grid-cols-[240px_1fr]">
          <aside className="hidden md:block">
            <div className="border-border/50 bg-card sticky top-24 rounded-xl border p-5">
              <p className="text-sm font-semibold">Contenido</p>
              <nav className="mt-4 space-y-2 text-sm">
                <TocLink href="#definiciones" active={activeSection === "definiciones"}>
                  1. Definiciones
                </TocLink>
                <TocLink href="#aceptacion" active={activeSection === "aceptacion"}>
                  2. Aceptación
                </TocLink>
                <TocLink href="#cuentas" active={activeSection === "cuentas"}>
                  3. Registro y cuentas
                </TocLink>
                <TocLink href="#uso" active={activeSection === "uso"}>
                  4. Uso permitido
                </TocLink>
                <TocLink href="#contenido" active={activeSection === "contenido"}>
                  5. Contenido y permisos
                </TocLink>
                <TocLink href="#privacidad" active={activeSection === "privacidad"}>
                  6. Privacidad
                </TocLink>
                <TocLink href="#ventas" active={activeSection === "ventas"}>
                  7. Ventas y comisión
                </TocLink>
                <TocLink href="#pagos" active={activeSection === "pagos"}>
                  8. Pagos, reembolsos y contracargos
                </TocLink>
                <TocLink href="#suspension" active={activeSection === "suspension"}>
                  9. Suspensión y terminación
                </TocLink>
                <TocLink href="#propiedad" active={activeSection === "propiedad"}>
                  10. Propiedad intelectual
                </TocLink>
                <TocLink
                  href="#responsabilidad"
                  active={activeSection === "responsabilidad"}
                >
                  11. Garantías y responsabilidad
                </TocLink>
                <TocLink href="#indemnizacion" active={activeSection === "indemnizacion"}>
                  12. Indemnización
                </TocLink>
                <TocLink href="#ley" active={activeSection === "ley"}>
                  13. Ley aplicable
                </TocLink>
                <TocLink href="#cambios" active={activeSection === "cambios"}>
                  14. Cambios
                </TocLink>
                <TocLink href="#contacto" active={activeSection === "contacto"}>
                  15. Contacto
                </TocLink>
              </nav>
            </div>
          </aside>

          <article className="mx-auto w-full max-w-3xl pb-28">
            <section id="definiciones" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">1. Definiciones</h2>
              <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5">
                <li>
                  <span className="text-foreground font-medium">“4Tercios”</span>: la
                  plataforma, sitio web y funcionalidades relacionadas.
                </li>
                <li>
                  <span className="text-foreground font-medium">“Fotógrafo”</span>: la
                  persona que crea eventos y sube fotos.
                </li>
                <li>
                  <span className="text-foreground font-medium">“Cliente”</span>: la
                  persona que accede al link del evento para ver y comprar fotos.
                </li>
                <li>
                  <span className="text-foreground font-medium">“Evento”</span>: galería y
                  página pública creada por el fotógrafo.
                </li>
                <li>
                  <span className="text-foreground font-medium">“Venta completada”</span>:
                  una transacción confirmada y no revertida.
                </li>
              </ul>
            </section>

            <Hr />

            <section id="aceptacion" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">2. Aceptación</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Al usar 4Tercios aceptas estos términos. Si no estás de acuerdo, no uses
                la plataforma.
              </p>
              <p className="text-muted-foreground mt-3 leading-7">
                Debes tener edad suficiente para celebrar contratos en tu país o contar
                con autorización de un representante legal.
              </p>
            </section>

            <Hr />

            <section id="cuentas" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">3. Registro y cuentas</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Eres responsable de mantener la seguridad de tu cuenta y de la información
                que compartes desde ella.
              </p>
              <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5">
                <li>No compartas tus credenciales con terceros.</li>
                <li>Nos notificarás si sospechas un acceso no autorizado.</li>
                <li>Podemos limitar o bloquear cuentas ante uso abusivo.</li>
              </ul>
            </section>

            <Hr />

            <section id="uso" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">4. Uso permitido</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Puedes usar 4Tercios para publicar galerías de eventos y facilitar la
                compra de fotos.
              </p>
              <p className="text-muted-foreground mt-3 leading-7">No está permitido:</p>
              <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5">
                <li>Usar 4Tercios para actividades ilegales o fraudulentas.</li>
                <li>
                  Subir malware, intentar acceder sin autorización o degradar el servicio.
                </li>
                <li>Suplantar identidad o crear eventos engañosos.</li>
                <li>Recolectar datos de otros usuarios sin consentimiento.</li>
              </ul>
              <p className="text-muted-foreground mt-3 leading-7">
                Podemos aplicar medidas razonables para prevenir abuso, como limitaciones
                de tráfico, bloqueo de IPs o suspensión temporal.
              </p>
            </section>

            <Hr />

            <section id="contenido" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">5. Contenido y permisos</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Eres responsable de las fotos que subes y de contar con permisos para
                publicarlas y venderlas. No debes subir contenido ilegal, infractor o que
                viole derechos de terceros.
              </p>
              <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5">
                <li>
                  Garantizas que tienes derechos de autor o licencias necesarias para el
                  contenido.
                </li>
                <li>
                  Si recibimos una reclamación razonable, podemos ocultar o retirar
                  contenido.
                </li>
                <li>
                  Mantienes 4Tercios indemne ante reclamos derivados de tu contenido.
                </li>
              </ul>
            </section>

            <Hr />

            <section id="privacidad" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">6. Privacidad</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                El tratamiento de datos se rige por nuestra política de privacidad.
              </p>
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/privacidad">Ver política de privacidad</Link>
                </Button>
              </div>
            </section>

            <Hr />

            <section id="ventas" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">7. Ventas y comisión</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Tú defines el precio por foto. 4Tercios cobra una comisión del 20%
                únicamente sobre ventas completadas. No hay mensualidades ni cargos
                adicionales.
              </p>
              <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5">
                <li>
                  La comisión se calcula sobre el monto de la venta (antes de impuestos,
                  si aplica), salvo que se indique lo contrario.
                </li>
                <li>
                  Puedes cambiar precios por evento, y dichos cambios aplican a futuras
                  compras.
                </li>
                <li>
                  4Tercios puede ofrecer promociones solo si tú las habilitas o si se
                  acuerda por escrito.
                </li>
              </ul>
            </section>

            <Hr />

            <section id="pagos" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">
                8. Pagos, reembolsos y contracargos
              </h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Los pagos pueden procesarse mediante proveedores externos. La
                disponibilidad de métodos de pago puede variar por país.
              </p>
              <p className="text-muted-foreground mt-3 leading-7">
                Reembolsos y contracargos:
              </p>
              <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5">
                <li>
                  Si se revierte una venta (reembolso o contracargo), esa venta puede
                  dejar de considerarse “completada”.
                </li>
                <li>
                  Podemos ajustar saldos o reportes para reflejar ventas revertidas.
                </li>
                <li>
                  Eres responsable de definir tu política de entrega y soporte al cliente
                  final.
                </li>
              </ul>
              <p className="text-muted-foreground mt-3 leading-7">
                Impuestos: eres responsable de determinar y cumplir tus obligaciones
                fiscales.
              </p>
            </section>

            <Hr />

            <section id="suspension" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">9. Suspensión y terminación</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Podemos suspender o terminar el acceso a 4Tercios si:
              </p>
              <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5">
                <li>Incumples estos términos.</li>
                <li>Tu contenido genera reclamaciones reiteradas o riesgos legales.</li>
                <li>Detectamos fraude, abuso o intentos de comprometer el servicio.</li>
              </ul>
              <p className="text-muted-foreground mt-3 leading-7">
                También puedes dejar de usar 4Tercios en cualquier momento.
              </p>
            </section>

            <Hr />

            <section id="propiedad" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">10. Propiedad intelectual</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                4Tercios y su marca, diseño y software pertenecen a sus respectivos
                titulares.
              </p>
              <p className="text-muted-foreground mt-3 leading-7">
                El fotógrafo conserva los derechos sobre sus fotos. Al subir contenido,
                nos otorgas una licencia limitada para alojarlo, mostrarlo y distribuirlo
                según sea necesario para operar el servicio.
              </p>
            </section>

            <Hr />

            <section id="responsabilidad" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">11. Garantías y responsabilidad</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                4Tercios se ofrece “tal cual”. No garantizamos disponibilidad
                ininterrumpida. En la medida permitida por ley, no seremos responsables
                por pérdidas indirectas derivadas del uso de la plataforma.
              </p>
              <p className="text-muted-foreground mt-3 leading-7">
                No garantizamos que el servicio cumpla con necesidades específicas, ni que
                esté libre de errores. El uso es bajo tu propio riesgo.
              </p>
            </section>

            <Hr />

            <section id="indemnizacion" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">12. Indemnización</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Aceptas defender e indemnizar a 4Tercios ante reclamaciones derivadas de
                tu uso del servicio, tu contenido, o tu incumplimiento de estos términos.
              </p>
            </section>

            <Hr />

            <section id="ley" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">13. Ley aplicable</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Estos términos se regirán por las leyes aplicables. Cualquier disputa se
                resolverá en los tribunales competentes, salvo que la normativa aplicable
                disponga otra cosa.
              </p>
            </section>

            <Hr />

            <section id="cambios" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">14. Cambios</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Podemos actualizar estos términos. Publicaremos la fecha de actualización
                en esta misma página.
              </p>
            </section>

            <Hr />

            <section id="contacto" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">15. Contacto</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Para preguntas sobre estos términos, contáctanos.
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
