import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingFinalCta() {
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Publica tu próximo evento en 5 minutos.
        </h2>
        <p className="text-muted-foreground mt-4 text-[15px]">
          Crea la galería, comparte el link y deja que cada cliente haga el resto.
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" asChild>
            <Link href="/dashboard">
              Empezar gratis
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
