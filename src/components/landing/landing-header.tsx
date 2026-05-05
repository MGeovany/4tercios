"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  LANDING_LOGO_HEIGHT,
  LANDING_LOGO_SRC,
  LANDING_LOGO_WIDTH,
  NAV_LINKS,
} from "./constants";

export type LandingAuthCta = { href: string; label: string };
export type LandingPrimaryCta = { href: string; label: string };

type LandingHeaderProps = {
  authCta: LandingAuthCta;
  primaryCta: LandingPrimaryCta;
  hasSession: boolean;
};

export function LandingHeader({ authCta, primaryCta, hasSession }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-border/60 sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-colors duration-300">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="inline-flex rounded-xl transition-transform duration-300 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
          aria-label="4Tercios"
        >
          <Image
            src={LANDING_LOGO_SRC}
            alt="4Tercios"
            width={LANDING_LOGO_WIDTH}
            height={LANDING_LOGO_HEIGHT}
            priority
            className="h-4 w-auto transition-opacity duration-300 hover:opacity-80"
          />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-300"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {!hasSession ? (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="transition-transform duration-300 hover:-translate-y-0.5"
            >
              <Link href={authCta.href}>{authCta.label}</Link>
            </Button>
          ) : null}
          <Button
            size="sm"
            asChild
            className="transition-transform duration-300 hover:-translate-y-0.5"
          >
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-md transition-all duration-300 md:hidden"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div className="border-border/60 border-t bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-300"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2">
              {!hasSession ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={authCta.href}>{authCta.label}</Link>
                </Button>
              ) : null}
              <Button size="sm" asChild>
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
