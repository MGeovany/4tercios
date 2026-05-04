"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type LandingFinalCtaProps = {
  primaryCta: { href: string; label: string };
};

export function LandingFinalCta({ primaryCta }: LandingFinalCtaProps) {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-[radial-gradient(120%_120%_at_50%_-20%,#1a1a1a_0%,#080808_45%,#020202_100%)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-md -translate-x-1/2 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-1/3 -bottom-28 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
      />
      <LazyMotion features={domAnimation}>
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-5xl px-6 py-20"
        >
          <div className="relative mx-auto max-w-3xl rounded-3xl border border-white/15 bg-white/5 px-8 py-14 text-center shadow-[0_35px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:px-12">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Publica tu próximo evento en 5 minutos.
            </h2>
            <p className="mt-4 text-[15px] text-white/70">
              Crea la galería, comparte el link y deja que cada cliente haga el resto.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                asChild
                className="group rounded-full bg-white text-black transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/90"
              >
                <Link href={primaryCta.href}>
                  {primaryCta.label}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        </m.div>
      </LazyMotion>
    </section>
  );
}
