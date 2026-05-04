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
  const authCta = hasSession
    ? { href: "/dashboard", label: "Ir al dashboard" }
    : { href: "/login", label: "Iniciar sesión" };

  return (
    <div className="bg-white text-foreground min-h-screen font-manrope">
      <LandingHeader authCta={authCta} />
      <LandingHero />
      <LandingHowItWorks />
      <LandingBenefits />
      {/* <LandingEventTypes /> */}
      <LandingPricing />
      <LandingFinalCta />
      <LandingFooter />
    </div>
  );
}
