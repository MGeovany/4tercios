"use client";

import Link from "next/link";
import { ArrowLeftIcon, ExternalLinkIcon } from "@radix-ui/react-icons";

import { useAppStore } from "@/lib/local-store";
import { Topbar } from "@/components/shell/topbar";
import { Button } from "@/components/ui/button";

import { SideNav } from "./_components/settings-primitives";
import {
  BrandSection,
  DangerSection,
  NotificationsSection,
  PayoutSection,
  PreferencesSection,
  ProfileSection,
} from "./_components/settings-sections";

export default function SettingsPage() {
  const { session, users } = useAppStore();
  const me = users.find((u) => u.id === session.userId);

  return (
    <>
      <Topbar
        title="Configuración"
        subtitle="Tu cuenta, tu marca, tus pagos"
        right={
          me ? (
            <Button variant="ghost" size="sm" asChild>
              <a
                href={`mailto:${me.email}`}
                className="inline-flex items-center gap-1.5"
                aria-label="Contactar soporte"
              >
                Soporte
                <ExternalLinkIcon />
              </a>
            </Button>
          ) : null
        }
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-950"
        >
          <ArrowLeftIcon className="size-3" />
          Volver al dashboard
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
          <SideNav />
          <div className="flex flex-col gap-6">
            <ProfileSection />
            <BrandSection />
            <PayoutSection />
            <NotificationsSection />
            <PreferencesSection />
            <DangerSection />
          </div>
        </div>
      </div>
    </>
  );
}
