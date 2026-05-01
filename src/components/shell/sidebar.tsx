"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarIcon, GearIcon, HomeIcon, PlusIcon, ReaderIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { useLensia } from "@/lib/local-store";
import { Brand } from "@/components/brand";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (pathname: string) => boolean;
};

const PRIMARY_NAV: NavItem[] = [
  {
    id: "home",
    href: "/dashboard",
    label: "Inicio",
    icon: <HomeIcon />,
    match: (p) => p === "/dashboard",
  },
  {
    id: "events",
    href: "/dashboard/events",
    label: "Eventos",
    icon: <CalendarIcon />,
    match: (p) => p.startsWith("/dashboard/events") && !p.startsWith("/dashboard/events/new"),
  },
  {
    id: "orders",
    href: "/dashboard/orders",
    label: "Órdenes",
    icon: <ReaderIcon />,
    match: (p) => p.startsWith("/dashboard/orders"),
  },
  {
    id: "new",
    href: "/dashboard/events/new",
    label: "Crear evento",
    icon: <PlusIcon />,
    match: (p) => p.startsWith("/dashboard/events/new"),
  },
];

const SECONDARY_NAV: NavItem[] = [
  {
    id: "settings",
    href: "/dashboard/settings",
    label: "Configuración",
    icon: <GearIcon />,
    match: (p) => p.startsWith("/dashboard/settings"),
  },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        "focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none",
        active ? "bg-zinc-100 text-zinc-950" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
      )}
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center transition-colors",
          active ? "text-zinc-950" : "text-zinc-400 group-hover:text-zinc-700"
        )}
      >
        {item.icon}
      </span>
      <span className="font-medium">{item.label}</span>
    </Link>
  );
}

function UserPill() {
  const { session, users } = useLensia();
  const me = users.find((u) => u.id === session.userId);
  if (!me) return null;

  const initials = me.name
    .split(" ")
    .flatMap((p) => (p[0] ? [p[0]] : []))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      href="/dashboard/settings"
      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-950">{me.name}</p>
        <p className="truncate text-xs text-zinc-500">{me.email}</p>
      </div>
    </Link>
  );
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
      setIsSigningOut(false);
    }
  }

  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col lg:self-start lg:overflow-y-auto lg:border-r lg:border-zinc-200 lg:bg-white">
      <div className="px-5 pt-6 pb-4">
        <Brand href="/dashboard" />
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.id} item={item} active={item.match(pathname)} />
        ))}
      </nav>

      <div className="mt-6 px-3">
        <p className="px-3 pb-2 text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
          Cuenta
        </p>
        <nav className="flex flex-col gap-0.5">
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.id} item={item} active={item.match(pathname)} />
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-zinc-100 p-3">
        <button
          type="button"
          onClick={() => {
            void handleSignOut();
          }}
          disabled={isSigningOut}
          className={cn(
            "mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            "focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none",
            "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </button>
        <UserPill />
      </div>
    </aside>
  );
}
