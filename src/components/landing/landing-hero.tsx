import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { HERO_ROWS } from "./constants";
import { LandingMarqueeRow } from "./landing-marquee-row";

export function LandingHero() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-8 z-0 h-72 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.06)_35%,rgba(255,255,255,0)_75%)] blur-3xl sm:top-10 sm:h-80"
      />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <span className="border-gray-300 font-manrope text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <span className="bg-primary size-1.5 rounded-full" />
          Búsqueda por reconocimiento facial
        </span>
        <h1 className="mt-6 font-literata text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Nunca ha sido tan fácil vender tus fotos
        </h1>
        <p className="text-gray-600 font-manrope mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-pretty sm:text-base">
          Hecho para fotógrafos que cubren multitudes.
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

      <div className="mx-auto mt-20 w-full max-w-6xl space-y-4 sm:space-y-5">
        {HERO_ROWS.map((row) => (
          <LandingMarqueeRow
            key={row.id}
            items={row.items}
            direction={row.direction}
            speed={row.speed}
          />
        ))}
      </div>
    </section>
  );
}
