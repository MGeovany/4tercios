"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";

import { IN_VIEW_ANIMATION, STEPS } from "./constants";

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="font-manrope bg-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
        <LazyMotion features={domAnimation}>
          <m.div {...IN_VIEW_ANIMATION} className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold tracking-[0.16em] text-black uppercase">
              Cómo funciona
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
              <span>Tres pasos.</span>{" "}
              <span className="font-extrabold text-gray-300">Cero fricción.</span>
            </h2>
          </m.div>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {STEPS.map((s, idx) => (
              <m.div
                key={s.step}
                {...IN_VIEW_ANIMATION}
                transition={{ ...IN_VIEW_ANIMATION.transition, delay: idx * 0.06 }}
                className="rounded-2xl border border-neutral-200 bg-white px-6 py-7 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-manrope text-[12px] leading-[1.4] font-normal tracking-[0.48px] text-[#0a0a0a]">
                    {s.step}
                  </span>
                  <s.icon className="size-5 text-neutral-700" strokeWidth={1.8} />
                </div>
                <h3 className="mt-5 text-3xl leading-tight font-semibold tracking-tight text-neutral-900">
                  {s.title}
                </h3>
                <p className="text-md mt-3 leading-relaxed text-neutral-500">{s.description}</p>
              </m.div>
            ))}
          </div>
        </LazyMotion>
      </div>
    </section>
  );
}
