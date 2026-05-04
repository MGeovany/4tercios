"use client";

import { LandingBenefits } from "@/components/landing/landing-benefits";
import { LandingFinalCta } from "@/components/landing/landing-final-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { useHasSupabaseSession } from "@/hooks/use-has-supabase-session";

export default function LandingPage() {
  const hasSession = useHasSupabaseSession();
  const authCta = { href: "/login", label: "Iniciar sesión" };
  const primaryCta = hasSession
    ? { href: "/dashboard", label: "Ir al dashboard" }
    : { href: "/register", label: "Crear mi cuenta" };

  return (
    <div className="text-foreground font-manrope min-h-screen scroll-smooth bg-white">
      <LandingHeader authCta={authCta} primaryCta={primaryCta} hasSession={hasSession} />
      <LandingHero primaryCta={primaryCta} />
      <LandingHowItWorks />
      <LandingBenefits />
      {/* <LandingEventTypes /> */}
      <LandingPricing />
      <LandingFinalCta primaryCta={primaryCta} />
      <LandingFooter />
    </div>
  );
}
