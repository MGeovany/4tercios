"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  Heart,
  Menu,
  QrCode,
  Search,
  Shield,
  Trophy,
  Upload,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const LANDING_LOGO_SRC = "/brand/logo-landing.png";
const LANDING_LOGO_WIDTH = 695;
const LANDING_LOGO_HEIGHT = 97;

const NAV_LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#por-que", label: "Por qué 4Tercios" },
  { href: "#precio", label: "Precio" },
];

const STEPS = [
  {
    step: "01",
    icon: Upload,
    title: "Sube tu galería",
    description:
      "Arrastra la carpeta. 4Tercios organiza tus fotos, detecta caras y prepara todo para compartir.",
  },
  {
    step: "02",
    icon: QrCode,
    title: "Comparte el link",
    description:
      "Cada evento tiene un link único y un QR listo para WhatsApp, redes o imprimir en el venue.",
  },
  {
    step: "03",
    icon: Search,
    title: "Ellos encuentran, tú cobras",
    description:
      "Cada cliente sube una selfie y ve sus coincidencias. Tú recibes la solicitud y confirmas la venta.",
  },
];

const BENEFITS = [
  {
    icon: Zap,
    title: "Menos fricción, más ventas",
    description:
      "Cuando encontrar la foto es fácil, comprarla también. Deja de enviar álbumes por WhatsApp uno por uno.",
  },
  {
    icon: Check,
    title: "Cero configuración",
    description:
      "Si sabes compartir un link, sabes usar 4Tercios. Nada que instalar, nada que estudiar.",
  },
  {
    icon: Shield,
    title: "Privacidad por diseño",
    description:
      "Las selfies se usan solo para buscar y se eliminan al instante. No guardamos datos biométricos.",
  },
  {
    icon: Heart,
    title: "Tu marca, no la nuestra",
    description:
      "Galería personalizada con tus colores y logo. Los clientes te recuerdan a ti, no a una plataforma.",
  },
];

const EVENT_TYPES = [
  {
    icon: Trophy,
    name: "Carreras y maratones",
    tagline: "Miles de atletas, resultados en minutos.",
  },
  {
    icon: GraduationCap,
    name: "Graduaciones",
    tagline: "Cada familia encuentra su foto sola.",
  },
  {
    icon: Heart,
    name: "Bodas y celebraciones",
    tagline: "Invitados que no esperan el álbum.",
  },
  {
    icon: Building2,
    name: "Eventos corporativos",
    tagline: "Cobertura con entrega inmediata.",
  },
];

const PRICING_BULLETS = [
  "Sin contratos ni permanencia",
  "Sin costo de setup por evento",
  "Retiros cuando los pidas",
  "Tú controlas el tiempo online",
];

const IN_VIEW_ANIMATION = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

const LANDING_PHOTOS = [
  "/landing/fotos-webp/006.webp",
  "/landing/fotos-webp/010.webp",
  "/landing/fotos-webp/026.webp",
  "/landing/fotos-webp/DSC01013.webp",
  "/landing/fotos-webp/DSC01833.webp",
  "/landing/fotos-webp/DSC01955.webp",
  "/landing/fotos-webp/DSC02049.webp",
  "/landing/fotos-webp/DSC02128.webp",
  "/landing/fotos-webp/DSC02596-Edit.webp",
  "/landing/fotos-webp/DSC02911.webp",
  "/landing/fotos-webp/DSC02952.webp",
  "/landing/fotos-webp/DSC03069.webp",
  "/landing/fotos-webp/DSC03200.webp",
  "/landing/fotos-webp/DSC03351.webp",
  "/landing/fotos-webp/DSC04068.webp",
  "/landing/fotos-webp/DSC04256.webp",
  "/landing/fotos-webp/DSC04612.webp",
  "/landing/fotos-webp/DSC04708.webp",
  "/landing/fotos-webp/P1046125.webp",
  "/landing/fotos-webp/P1046317.webp",
  "/landing/fotos-webp/P1056759.webp",
  "/landing/fotos-webp/P1056924.webp",
  "/landing/fotos-webp/P1057106.webp",
  "/landing/fotos-webp/P1057123.webp",
  "/landing/fotos-webp/P1057168.webp",
  "/landing/fotos-webp/P1057441.webp",
  "/landing/fotos-webp/P1067578.webp",
  "/landing/fotos-webp/P1067975.webp",
  "/landing/fotos-webp/P1193250.webp",
  "/landing/fotos-webp/P1193349-2.webp",
  "/landing/fotos-webp/P1193505.webp",
  "/landing/fotos-webp/P1193954.webp",
  "/landing/fotos-webp/P1194056.webp",
  "/landing/fotos-webp/P1204437.webp",
  "/landing/fotos-webp/P1229717.webp",
  "/landing/fotos-webp/P1229728.webp",
  "/landing/fotos-webp/P1230078.webp",
  "/landing/fotos-webp/P1230214.webp",
  "/landing/fotos-webp/P1230966.webp",
  "/landing/fotos-webp/P1230983.webp",
  "/landing/fotos-webp/P1231134.webp",
  "/landing/fotos-webp/P1231504.webp",
  "/landing/fotos-webp/P1253094.webp",
  "/landing/fotos-webp/P1253116.webp",
  "/landing/fotos-webp/P1253229.webp",
  "/landing/fotos-webp/P1253254.webp",
  "/landing/fotos-webp/P1253263.webp",
  "/landing/fotos-webp/P1253465.webp",
  "/landing/fotos-webp/P1253566.webp",
  "/landing/fotos-webp/P1275434.webp",
  "/landing/fotos-webp/P1275648.webp",
  "/landing/fotos-webp/P1286035.webp",
  "/landing/fotos-webp/P1296893.webp",
];
const buildRow = (prefix: string, offset: number) =>
  LANDING_PHOTOS.filter((_, i) => i % 3 === offset).map((src, i) => ({
    id: `${prefix}-${i + 1}`,
    src,
  }));

const HERO_ROWS = [
  { id: "row-top", direction: "left" as const, speed: 0.35, items: buildRow("a", 0) },
  { id: "row-mid", direction: "right" as const, speed: 0.55, items: buildRow("b", 1) },
  { id: "row-bot", direction: "left" as const, speed: 0.45, items: buildRow("c", 2) },
];

function MarqueeRow({
  items,
  direction,
  speed,
}: {
  items: { id: string; src: string }[];
  direction: "left" | "right";
  speed: number;
}) {
  const stripRef = useRef<HTMLDivElement>(null);

  const loop = [
    ...items.map((item) => ({ ...item, key: `${item.id}-a` })),
    ...items.map((item) => ({ ...item, key: `${item.id}-b` })),
  ];

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let stripHalf = strip.scrollWidth / 2;
    let frame = 0;

    const apply = () => {
      frame = 0;
      if (stripHalf <= 0) return;
      const distance = (((window.scrollY * speed) % stripHalf) + stripHalf) % stripHalf;
      const x = direction === "left" ? -distance : distance - stripHalf;
      strip.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(apply);
    };

    const ro = new ResizeObserver(() => {
      stripHalf = strip.scrollWidth / 2;
      apply();
    });
    ro.observe(strip);

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [direction, speed]);

  return (
    <div className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div ref={stripRef} className="marquee-strip flex w-max gap-4">
        {loop.map((item) => (
          <div
            key={item.key}
            className="h-28 w-40 shrink-0 overflow-hidden rounded-xl bg-[#dce6ee] ring-1 ring-[#0b2545]/5 sm:h-32 sm:w-48 lg:h-36 lg:w-56"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt=""
              loading="lazy"
              decoding="async"
              aria-hidden
              className="size-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing-deep-blue bg-background text-foreground min-h-screen">
      {/* Nav */}
      <header className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
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
              priority
              className="h-4 w-auto"
            />
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard">Empezar</Link>
            </Button>
          </div>

          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-md transition-colors md:hidden"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        {mobileMenuOpen ? (
          <div className="border-border/60 bg-background border-t px-6 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="text-muted-foreground text-sm">
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 grid gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/dashboard">Empezar</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="border-border text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <span className="bg-primary size-1.5 rounded-full" />
            Búsqueda por selfie · Resultados en segundos
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Una selfie. Sus fotos.
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-pretty sm:text-base">
            Publica la galería de tu evento, comparte un link y deja que cada persona encuentre sus
            coincidencias. Tú fotografías; 4Tercios se encarga del resto.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Empezar gratis
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#como-funciona">Cómo funciona</Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-4 text-xs sm:text-sm">
            Sin tarjeta · Sin suscripción · Solo 20% cuando vendes
          </p>
        </div>

        {/* Hero visual — 3 carruseles infinitos, limpios sobre el fondo */}
        <div className="mx-auto mt-20 w-full max-w-6xl space-y-4 sm:space-y-5">
          {HERO_ROWS.map((row) => (
            <MarqueeRow
              key={row.id}
              items={row.items}
              direction={row.direction}
              speed={row.speed}
            />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="border-border/60 bg-muted/30 border-y">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="max-w-xl">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Cómo funciona
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Tres pasos. Cero fricción.
            </h2>
          </div>

          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {STEPS.map((s, idx) => (
              <motion.div
                key={s.step}
                {...IN_VIEW_ANIMATION}
                transition={{ ...IN_VIEW_ANIMATION.transition, delay: idx * 0.06 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-mono text-xs tracking-wider">
                    {s.step}
                  </span>
                  <span className="bg-border h-px flex-1" />
                </div>
                <div className="bg-foreground mt-6 flex size-10 items-center justify-center rounded-lg">
                  <s.icon className="text-background size-5" />
                </div>
                <h3 className="mt-5 font-semibold">{s.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {s.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why 4Tercios */}
      <section id="por-que" className="mx-auto max-w-5xl px-6 py-20">
        <div className="max-w-xl">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Por qué 4Tercios
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Menos envíos manuales. Más ventas.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((b, idx) => (
            <motion.div
              key={b.title}
              {...IN_VIEW_ANIMATION}
              transition={{ ...IN_VIEW_ANIMATION.transition, delay: idx * 0.06 }}
              whileHover={{ y: -4 }}
              className="border-border/70 bg-card hover:border-border rounded-xl border p-6 transition-colors"
            >
              <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
                <b.icon className="size-4" />
              </div>
              <h3 className="mt-4 font-semibold">{b.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{b.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Event types */}
      <section id="eventos" className="border-border/60 bg-muted/30 border-y">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="max-w-xl">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Para cualquier evento
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              De un 10K a una boda.
            </h2>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {EVENT_TYPES.map((e, idx) => (
              <motion.div
                key={e.name}
                {...IN_VIEW_ANIMATION}
                transition={{ ...IN_VIEW_ANIMATION.transition, delay: idx * 0.06 }}
                whileHover={{ y: -4 }}
                className="border-border/70 bg-card hover:border-border rounded-xl border p-5 transition-colors"
              >
                <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
                  <e.icon className="size-4" />
                </div>
                <p className="mt-4 leading-tight font-semibold">{e.name}</p>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{e.tagline}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precio" className="mx-auto max-w-5xl px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Precio
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Gratis hasta que vendas.
            </h2>
            <p className="text-muted-foreground mt-4 text-[15px] leading-relaxed">
              20% sobre cada venta confirmada. Sin suscripción, sin setup, sin mínimos. Si no
              vendes, no pagas.
            </p>
          </div>

          <div className="border-border bg-card mt-10 rounded-xl border p-6 sm:p-8">
            <p className="text-muted-foreground text-xs">Ejemplo por foto</p>
            <div className="sm:divide-border mt-4 grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x">
              <div className="sm:pr-8">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Tú defines</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">L 80</p>
                <p className="text-muted-foreground mt-1 text-xs">precio por foto</p>
              </div>
              <div className="sm:px-8">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Comisión</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">L 16</p>
                <p className="text-muted-foreground mt-1 text-xs">20% por venta</p>
              </div>
              <div className="sm:pl-8">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Recibes</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">L 64</p>
                <p className="text-muted-foreground mt-1 text-xs">directo a tu cuenta</p>
              </div>
            </div>

            <ul className="border-border mt-8 grid gap-3 border-t pt-6 sm:grid-cols-2">
              {PRICING_BULLETS.map((i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="text-primary size-4" />
                  <span>{i}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/dashboard">
                  Crear mi primer evento
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="#como-funciona">Ver cómo funciona</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-border/60 border-t">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Publica tu próximo evento en 5 minutos.
          </h2>
          <p className="text-muted-foreground mt-4 text-[15px]">
            Crea la galería, comparte el link y deja que cada cliente haga el resto.
          </p>
          <div className="mt-8 flex justify-center">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Empezar gratis
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
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
    </div>
  );
}
