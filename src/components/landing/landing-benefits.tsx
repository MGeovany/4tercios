"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";

import { BENEFITS, IN_VIEW_ANIMATION } from "./constants";

export function LandingBenefits() {
  return (
    <section id="por-que" className="mx-auto max-w-5xl px-6 py-20">
      <LazyMotion features={domAnimation}>
        <m.div {...IN_VIEW_ANIMATION} className="max-w-xl">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Por qué 4Tercios
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Te ahorramos el trabajo de búsqueda y organización manual de tus fotos.{" "}
            <span className="text-gray-500">
              Tu te ocupas de las fotos y nosotros de procesarlas para la venta a tus
              clientes.
            </span>
          </h2>
        </m.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((b, idx) => (
            <m.div
              key={b.title}
              {...IN_VIEW_ANIMATION}
              transition={{ ...IN_VIEW_ANIMATION.transition, delay: idx * 0.06 }}
              className="group border-border/70 bg-card hover:border-border rounded-xl border p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
                <b.icon className="size-4" />
              </div>
              <h3 className="mt-4 font-semibold">{b.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {b.description}
              </p>
            </m.div>
          ))}
        </div>
      </LazyMotion>
    </section>
  );
}
