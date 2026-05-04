"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { HERO_ROWS } from "./constants";
import { LandingMarqueeRow } from "./landing-marquee-row";

export function LandingHero() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <div className="inline-flex">
          <span className="landing-pill relative flex cursor-pointer overflow-hidden rounded-full p-px">
            <span
              aria-hidden
              className="pill-ring-spin absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]"
            />
            <span className="font-manrope text-gray-700 tracking-wide relative inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs whitespace-nowrap">
            <span className="dot-blink bg-green-500 size-1.5 rounded-full" />
              <span className="pill-text transition-colors duration-300 ease-out">
                Búsqueda por reconocimiento facial
              </span>
              <ChevronRight className="chevron-slide size-3 text-gray-500 transition-colors duration-300 ease-out" />
            </span>
          </span>
        </div>
        <h1 className="mt-6 font-literata text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Nunca ha sido tan fácil vender tus fotos
        </h1>
        <p className="text-gray-600 font-manrope mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-pretty sm:text-base">
          Diseñado para fotógrafos que cubren cientos de personas en un solo evento. Precisión de coincidencia actual del 99.7% 
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/dashboard">
              Empezar gratis
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
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
      <style jsx global>{`
        @keyframes chevronSlide {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(6px);
          }
        }

        .chevron-slide {
          animation: chevronSlide 1.1s ease-in-out infinite;
        }

        @keyframes dotBlink {
          0%,
          100% {
            opacity: 0.45;
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
          }
        }

        .dot-blink {
          animation: dotBlink 1.4s ease-in-out infinite;
        }

        .landing-pill:hover .pill-ring-spin,
        .landing-pill:hover .dot-blink,
        .landing-pill:hover .chevron-slide {
          animation-play-state: paused;
        }

        .landing-pill:hover .chevron-slide {
          color: #000;
        }

        .landing-pill:hover .pill-text {
          color: #000;
        }
      `}</style>
    </section>
  );
}
