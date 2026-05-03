"use client";

import { motion } from "framer-motion";

import { BENEFITS, IN_VIEW_ANIMATION } from "./constants";

export function LandingBenefits() {
  return (
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
  );
}
