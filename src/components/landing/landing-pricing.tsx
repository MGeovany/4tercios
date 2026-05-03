import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

import { PRICING_BULLETS } from "./constants";

export function LandingPricing() {
  return (
    <section id="precio" className="mx-auto max-w-5xl px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Precio</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Gratis hasta que vendas.
          </h2>
          <p className="text-muted-foreground mt-4 text-[15px] leading-relaxed">
            20% sobre cada venta confirmada. Sin suscripción, sin setup, sin mínimos. Si no vendes,
            no pagas.
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
            {PRICING_BULLETS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <Check className="text-primary size-4" />
                <span>{item}</span>
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
  );
}
