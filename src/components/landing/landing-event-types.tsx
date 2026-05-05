"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";

import { EVENT_TYPES, IN_VIEW_ANIMATION } from "./constants";

export function LandingEventTypes() {
  return (
    <section id="eventos" className="border-border/60 border-y bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <LazyMotion features={domAnimation}>
          <m.div {...IN_VIEW_ANIMATION} className="max-w-xl">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Para cualquier evento
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              De un 10K a una boda.
            </h2>
          </m.div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {EVENT_TYPES.map((e, idx) => (
              <m.div
                key={e.name}
                {...IN_VIEW_ANIMATION}
                transition={{ ...IN_VIEW_ANIMATION.transition, delay: idx * 0.06 }}
                className="group border-border/70 bg-card hover:border-border rounded-xl border p-5 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
                  <e.icon className="size-4" />
                </div>
                <p className="mt-4 leading-tight font-semibold">{e.name}</p>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {e.tagline}
                </p>
              </m.div>
            ))}
          </div>
        </LazyMotion>
      </div>
    </section>
  );
}
