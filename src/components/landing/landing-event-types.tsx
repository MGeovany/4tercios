"use client";

import { motion } from "framer-motion";

import { EVENT_TYPES, IN_VIEW_ANIMATION } from "./constants";

export function LandingEventTypes() {
  return (
    <section id="eventos" className="border-border/60 bg-white border-y">
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
  );
}
