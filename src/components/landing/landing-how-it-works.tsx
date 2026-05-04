"use client";

import { motion } from "framer-motion";

import { IN_VIEW_ANIMATION, STEPS } from "./constants";

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="border-border/60 bg-white border-y font-manrope">
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
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
