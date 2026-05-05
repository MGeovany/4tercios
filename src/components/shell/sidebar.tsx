"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  HelpCircle,
  LayoutGrid,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { useAuthProfile } from "@/lib/auth-profile";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type LeafItem = {
  kind: "leaf";
  id: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (pathname: string) => boolean;
};

type GroupItem = {
  kind: "group";
  id: string;
  label: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  match: (pathname: string) => boolean;
  children: { id: string; href: string; label: string; match: (pathname: string) => boolean }[];
};

type NavItem = LeafItem | GroupItem;

const PRIMARY_NAV: NavItem[] = [
  {
    kind: "leaf",
    id: "home",
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutGrid className="size-[18px]" strokeWidth={1.75} />,
    match: (p) => p === "/dashboard",
  },
  {
    kind: "leaf",
    id: "orders",
    href: "/dashboard/orders",
    label: "Órdenes",
    icon: <ShoppingBag className="size-[18px]" strokeWidth={1.75} />,
    match: (p) => p.startsWith("/dashboard/orders"),
  },
  {
    kind: "group",
    id: "events",
    label: "Eventos",
    icon: <Truck className="size-[18px]" strokeWidth={1.75} />,
    defaultOpen: true,
    match: (p) => p.startsWith("/dashboard/events") && !p.startsWith("/dashboard/events/new"),
    children: [
      {
        id: "events-procesando",
        href: "/dashboard/events?status=Procesando",
        label: "Procesando",
        match: (p) => p.startsWith("/dashboard/events") && p.includes("status=Procesando"),
      },
      {
        id: "events-listo",
        href: "/dashboard/events?status=Listo",
        label: "Listos",
        match: (p) => p.startsWith("/dashboard/events") && p.includes("status=Listo"),
      },
      {
        id: "events-archivado",
        href: "/dashboard/events?status=Archivado",
        label: "Archivados",
        match: (p) => p.startsWith("/dashboard/events") && p.includes("status=Archivado"),
      },
      {
        id: "events-borrador",
        href: "/dashboard/events?status=Borrador",
        label: "Borradores",
        match: (p) => p.startsWith("/dashboard/events") && p.includes("status=Borrador"),
      },
    ],
  },
  {
    kind: "leaf",
    id: "new",
    href: "/dashboard/events/new",
    label: "Crear evento",
    icon: <Plus className="size-[18px]" strokeWidth={1.75} />,
    match: (p) => p.startsWith("/dashboard/events/new"),
  },
  {
    kind: "leaf",
    id: "payments",
    href: "/dashboard/orders?tab=pagos",
    label: "Pagos",
    icon: <CreditCard className="size-[18px]" strokeWidth={1.75} />,
    match: (p) => p.includes("tab=pagos"),
  },
];

const SECONDARY_NAV: LeafItem[] = [
  {
    kind: "leaf",
    id: "settings",
    href: "/dashboard/settings",
    label: "Configuración",
    icon: <Settings className="size-[18px]" strokeWidth={1.75} />,
    match: (p) => p.startsWith("/dashboard/settings"),
  },
  {
    kind: "leaf",
    id: "support",
    href: "/contacto",
    label: "Soporte y ayuda",
    icon: <HelpCircle className="size-[18px]" strokeWidth={1.75} />,
    match: () => false,
  },
  {
    kind: "leaf",
    id: "feedback",
    href: "/contacto?tipo=feedback",
    label: "Feedback",
    icon: <MessageSquare className="size-[18px]" strokeWidth={1.75} />,
    match: () => false,
  },
];

function NavLeaf({ item, active }: { item: LeafItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      prefetch
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors",
        "focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none",
        active
          ? "border border-zinc-200 bg-white text-zinc-950 shadow-[0_1px_0_rgba(24,24,27,0.04)]"
          : "border border-transparent text-zinc-600 hover:bg-white/60 hover:text-zinc-950"
      )}
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center",
          active ? "text-zinc-950" : "text-zinc-500"
        )}
      >
        {item.icon}
      </span>
      <span className="font-medium">{item.label}</span>
    </Link>
  );
}

function NavGroup({ item, pathname }: { item: GroupItem; pathname: string }) {
  const groupActive = item.match(pathname);
  // `null` = not toggled by the user yet, follow defaults / route activity.
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const open = userToggled ?? item.defaultOpen ?? groupActive;
  const setOpen = (next: boolean | ((prev: boolean) => boolean)) =>
    setUserToggled(typeof next === "function" ? next(open) : next);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition-colors",
          "focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none",
          groupActive
            ? "border border-zinc-200 bg-white text-zinc-950 shadow-[0_1px_0_rgba(24,24,27,0.04)]"
            : "border border-transparent text-zinc-600 hover:bg-white/60 hover:text-zinc-950"
        )}
      >
        <span
          className={cn(
            "flex size-5 items-center justify-center",
            groupActive ? "text-zinc-950" : "text-zinc-500"
          )}
        >
          {item.icon}
        </span>
        <span className="flex-1 font-medium">{item.label}</span>
        <ChevronDown
          className={cn("size-4 text-zinc-400 transition-transform", open ? "rotate-180" : "")}
          strokeWidth={2}
        />
      </button>
      {open ? (
        <div className="relative mt-1 ml-[26px] flex flex-col gap-0.5 pl-4">
          <span className="absolute top-1 bottom-1 left-0 w-px bg-zinc-200" aria-hidden />
          {item.children.map((child) => {
            const active = child.match(pathname);
            return (
              <Link
                key={child.id}
                href={child.href}
                prefetch
                scroll={false}
                className={cn(
                  "relative rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none",
                  active ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1/2 -left-4 h-px w-3 -translate-y-1/2",
                    active ? "bg-zinc-300" : "bg-zinc-200"
                  )}
                  aria-hidden
                />
                {child.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function UserPill({ onSignOut, isSigningOut }: { onSignOut: () => void; isSigningOut: boolean }) {
  const { profile } = useAuthProfile();

  const initials = useMemo(() => {
    return (profile.name || profile.email || "4T")
      .split(/[\s@.]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }, [profile.name, profile.email]);

  const display = profile.name || (profile.email ? profile.email.split("@")[0] : "Tu cuenta");
  const email = profile.email || "—";

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_1px_0_rgba(24,24,27,0.04)]">
      <Link
        href="/dashboard/settings"
        prefetch
        scroll={false}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-[11px] font-semibold tracking-wide text-white">
          {initials || "4T"}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13px] font-semibold text-zinc-950">{display}</p>
          <p className="truncate text-[11.5px] text-zinc-500">{email}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onSignOut}
        disabled={isSigningOut}
        aria-label="Cerrar sesión"
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors",
          "hover:bg-zinc-100 hover:text-zinc-900",
          "focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
      >
        <LogOut className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

export function Sidebar() {
  const { prefetch, replace, refresh } = useRouter();
  const pathname = usePathname() ?? "";
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    for (const item of PRIMARY_NAV) {
      if (item.kind === "leaf") {
        prefetch(item.href);
      } else {
        for (const child of item.children) prefetch(child.href);
      }
    }
    for (const item of SECONDARY_NAV) prefetch(item.href);
  }, [prefetch]);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      replace("/login");
      refresh();
      setIsSigningOut(false);
    }
  }

  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[272px] lg:shrink-0 lg:flex-col lg:self-start lg:overflow-y-auto lg:border-r lg:border-zinc-200/80 lg:bg-zinc-50">
      <div className="flex items-center justify-between gap-3 px-5 pt-6 pb-5">
        <Link
          href="/dashboard"
          prefetch
          scroll={false}
          className="inline-flex items-center gap-2.5 rounded-xl focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
          aria-label="4Tercios"
        >
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-zinc-900 text-[15px] font-bold text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)]">
            4
          </span>
          <Image
            src="/brand/main-logo.png"
            alt="4Tercios"
            width={1024}
            height={216}
            className="h-[18px] w-auto"
            priority
          />
        </Link>
        <button
          type="button"
          aria-label="Colapsar barra lateral"
          className="hidden size-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:text-zinc-900 lg:inline-flex"
        >
          <PanelLeftClose className="size-4" strokeWidth={1.75} />
          <span className="sr-only">
            <PanelLeftOpen className="size-4" />
          </span>
        </button>
      </div>

      <div className="px-4 pt-1">
        <p className="px-2 pb-2 text-[10.5px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
          Main Menu
        </p>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {PRIMARY_NAV.map((item) =>
          item.kind === "leaf" ? (
            <NavLeaf key={item.id} item={item} active={item.match(pathname)} />
          ) : (
            <NavGroup key={item.id} item={item} pathname={pathname} />
          )
        )}
      </nav>

      <div className="mt-7 px-4">
        <p className="px-2 pb-2 text-[10.5px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
          Setting
        </p>
        <nav className="flex flex-col gap-1">
          {SECONDARY_NAV.map((item) => (
            <NavLeaf key={item.id} item={item} active={item.match(pathname)} />
          ))}
        </nav>
      </div>

      <div className="mt-auto p-3">
        <UserPill onSignOut={() => void handleSignOut()} isSigningOut={isSigningOut} />
      </div>
    </aside>
  );
}
