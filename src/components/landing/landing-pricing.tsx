"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

import { PRICING_BULLETS } from "./constants";

export function LandingPricing() {
  return (
    <section id="precio" className="mx-auto max-w-5xl px-6 py-20">
      <LazyMotion features={domAnimation}>
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl"
        >
          <div className="mx-auto max-w-xl text-center">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Precio
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Gratis hasta que vendas.
            </h2>
            <p className="text-muted-foreground mt-4 text-[15px] leading-relaxed">
              Sin suscripción, sin setup, sin mínimos. 4Tercios solo toma una comisión de
              tu venta. El resto, totalmente gratis.
            </p>
          </div>

          <m.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="border-border bg-card mt-10 rounded-xl border p-6 sm:p-8"
          >
            <p className="text-muted-foreground text-xs">Ejemplo por foto</p>
            <div className="sm:divide-border mt-4 grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x">
              <div className="sm:pr-8">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Tú defines
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">L 80</p>
                <p className="text-muted-foreground mt-1 text-xs">precio por foto</p>
              </div>
              <div className="sm:px-8">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Comisión
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">L 16</p>
                <p className="text-muted-foreground mt-1 text-xs">20% por venta</p>
              </div>
              <div className="sm:pl-8">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Recibes
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">L 64</p>
                <p className="text-muted-foreground mt-1 text-xs">directo a tu cuenta</p>
              </div>
            </div>

            <ul className="border-border mt-8 grid gap-3 border-t pt-6 sm:grid-cols-2">
              {PRICING_BULLETS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm transition-colors duration-300"
                >
                  <Check className="size-4 text-black" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="group transition-transform duration-300 hover:-translate-y-0.5"
              >
                <Link href="/dashboard">
                  Crear mi primer evento
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </m.div>
        </m.div>
      </LazyMotion>
    </section>
  );
}
