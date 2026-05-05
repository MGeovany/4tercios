"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  History,
  HelpCircle,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  ShoppingBag,
  Calendar,
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
  href: string;
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
    href: "/dashboard/events",
    label: "Eventos",
    icon: <Calendar className="size-[18px]" strokeWidth={1.75} />,
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
  {
    kind: "leaf",
    id: "history",
    href: "/dashboard/history",
    label: "Historial",
    icon: <History className="size-[18px]" strokeWidth={1.75} />,
    match: (p) => p.startsWith("/dashboard/history"),
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

function NavLeaf({
  item,
  active,
  collapsed = false,
  loading = false,
  onNavigate,
}: {
  item: LeafItem;
  active: boolean;
  collapsed?: boolean;
  loading?: boolean;
  onNavigate?: (href: string) => void;
}) {
  return (
    <Link
      href={item.href}
      prefetch
      scroll={false}
      onClick={() => onNavigate?.(item.href)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center rounded-xl py-2.5 text-[13.5px] transition-colors",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
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
        {loading ? <Loader2 className="size-[18px] animate-spin" strokeWidth={2} /> : item.icon}
      </span>
      {!collapsed ? <span className="font-medium">{item.label}</span> : null}
    </Link>
  );
}

function NavGroup({
  item,
  pathname,
  collapsed = false,
  loading = false,
  loadingChildHref,
  pendingHref,
  onNavigate,
}: {
  item: GroupItem;
  pathname: string;
  collapsed?: boolean;
  loading?: boolean;
  loadingChildHref?: string | null;
  pendingHref?: string | null;
  onNavigate?: (href: string) => void;
}) {
  const groupActive =
    item.match(pathname) ||
    pendingHref === item.href ||
    item.children.some((child) => child.href === pendingHref);
  // `null` = not toggled by the user yet, follow defaults / route activity.
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const open = userToggled ?? item.defaultOpen ?? groupActive;
  const setOpen = (next: boolean | ((prev: boolean) => boolean)) =>
    setUserToggled(typeof next === "function" ? next(open) : next);

  if (collapsed) {
    return (
      <Link
        href={item.href}
        prefetch
        scroll={false}
        onClick={() => onNavigate?.(item.href)}
        aria-current={groupActive ? "page" : undefined}
        className={cn(
          "group flex items-center justify-center rounded-xl border py-2.5 transition-colors",
          "focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none",
          groupActive
            ? "border-zinc-200 bg-white text-zinc-950 shadow-[0_1px_0_rgba(24,24,27,0.04)]"
            : "border-transparent text-zinc-500 hover:bg-white/60 hover:text-zinc-950"
        )}
      >
        {loading ? <Loader2 className="size-[18px] animate-spin" strokeWidth={2} /> : item.icon}
      </Link>
    );
  }

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition-colors",
          "focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none",
          groupActive
            ? "border border-zinc-200 bg-white text-zinc-950 shadow-[0_1px_0_rgba(24,24,27,0.04)]"
            : "border border-transparent text-zinc-600 hover:bg-white/60 hover:text-zinc-950"
        )}
      >
        <Link
          href={item.href}
          prefetch
          scroll={false}
          onClick={() => onNavigate?.(item.href)}
          aria-current={groupActive ? "page" : undefined}
          className="flex min-w-0 flex-1 items-center gap-3 focus-visible:outline-none"
        >
          <span
            className={cn(
              "flex size-5 items-center justify-center",
              groupActive ? "text-zinc-950" : "text-zinc-500"
            )}
          >
            {loading ? <Loader2 className="size-[18px] animate-spin" strokeWidth={2} /> : item.icon}
          </span>
          <span className="truncate font-medium">{item.label}</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Colapsar submenú" : "Expandir submenú"}
          className="inline-flex size-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        >
          <ChevronDown
            className={cn("size-4 transition-transform", open ? "rotate-180" : "")}
            strokeWidth={2}
          />
        </button>
      </div>
      {open ? (
        <div className="relative mt-1 ml-[26px] flex flex-col gap-0.5 pl-4">
          <span className="absolute top-1 bottom-1 left-0 w-px bg-zinc-200" aria-hidden />
          {item.children.map((child) => {
            const active = child.match(pathname) || pendingHref === child.href;
            return (
              <Link
                key={child.id}
                href={child.href}
                prefetch
                scroll={false}
                onClick={() => onNavigate?.(child.href)}
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
                <span className="inline-flex items-center gap-1.5">
                  {loadingChildHref === child.href ? (
                    <Loader2 className="size-3.5 animate-spin text-zinc-400" strokeWidth={2} />
                  ) : null}
                  {child.label}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function UserPill({
  onSignOut,
  isSigningOut,
  collapsed = false,
  initialName = "",
  initialEmail = "",
}: {
  onSignOut: () => void;
  isSigningOut: boolean;
  collapsed?: boolean;
  initialName?: string;
  initialEmail?: string;
}) {
  const { profile } = useAuthProfile();
  const resolvedName = profile.name || initialName;
  const resolvedEmail = profile.email || initialEmail;

  const initials = useMemo(() => {
    return (resolvedName || resolvedEmail || "4T")
      .split(/[\s@.]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }, [resolvedName, resolvedEmail]);

  const display = resolvedName || (resolvedEmail ? resolvedEmail.split("@")[0] : "Tu cuenta");
  const email = resolvedEmail || "—";

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_1px_0_rgba(24,24,27,0.04)]">
        <Link
          href="/dashboard/settings"
          prefetch
          scroll={false}
          className="inline-flex size-9 items-center justify-center rounded-xl bg-zinc-900 text-[11px] font-semibold tracking-wide text-white focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
          aria-label={display}
          title={display}
        >
          {initials || "4T"}
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

const SIDEBAR_STATE_KEY = "dashboard.sidebar.collapsed";
type PendingNav = { href: string; routeKey: string } | null;

export function Sidebar({
  initialName = "",
  initialEmail = "",
}: {
  initialName?: string;
  initialEmail?: string;
}) {
  const { prefetch, replace, refresh } = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [pendingNav, setPendingNav] = useState<PendingNav>(null);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_STATE_KEY) === "1";
  });
  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;
  const showLoading = pendingNav?.routeKey === routeKey;

  function handleNavigate(href: string) {
    const next = new URL(href, window.location.origin);
    const targetKey = `${next.pathname}${next.search}`;
    if (targetKey === routeKey) return;
    setPendingNav({ href, routeKey });
  }

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

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
    <aside
      className={cn(
        "hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0 lg:flex-col lg:self-start lg:overflow-y-auto lg:border-r lg:border-zinc-200/80 lg:bg-zinc-50",
        "transition-[width] duration-200",
        collapsed ? "lg:w-[72px]" : "lg:w-[232px]"
      )}
    >
      <div
        className={cn(
          "pt-6 pb-5",
          collapsed
            ? "flex flex-col items-center gap-3 px-2"
            : "flex items-center justify-between gap-3 px-5"
        )}
      >
        <Link
          href="/dashboard"
          prefetch
          scroll={false}
          className="inline-flex items-center gap-2.5 rounded-xl focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
          aria-label="4Tercios"
        >
          {!collapsed ? (
            <>
              {/*  <Image
              src="/brand/main-logo.png"
              alt="4Tercios"
              width={1024}
              height={216}
              className="h-8 w-auto"
              priority
              /> */}
              <span className="font-manrope text-2xl font-bold">4Tercios</span>
            </>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          className={cn(
            "hidden size-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:text-zinc-900 lg:inline-flex"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="size-4" strokeWidth={1.75} />
          )}
        </button>
      </div>

      {!collapsed ? (
        <div className="px-4 pt-1">
          <p className="px-2 pb-2 text-[10.5px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
            Main Menu
          </p>
        </div>
      ) : null}
      <nav className={cn("flex flex-col gap-1", collapsed ? "px-2" : "px-3")}>
        {PRIMARY_NAV.map((item) =>
          item.kind === "leaf" ? (
            <NavLeaf
              key={item.id}
              item={item}
              active={item.match(pathname) || (showLoading && pendingNav?.href === item.href)}
              collapsed={collapsed}
              loading={showLoading && pendingNav?.href === item.href}
              onNavigate={handleNavigate}
            />
          ) : (
            <NavGroup
              key={item.id}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              loading={showLoading && pendingNav?.href === item.href}
              loadingChildHref={showLoading ? pendingNav?.href : null}
              pendingHref={showLoading ? pendingNav?.href : null}
              onNavigate={handleNavigate}
            />
          )
        )}
      </nav>

      <div className={cn("mt-7", collapsed ? "px-2" : "px-4")}>
        {!collapsed ? (
          <p className="px-2 pb-2 text-[10.5px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
            Setting
          </p>
        ) : null}
        <nav className="flex flex-col gap-1">
          {SECONDARY_NAV.map((item) => (
            <NavLeaf
              key={item.id}
              item={item}
              active={item.match(pathname) || (showLoading && pendingNav?.href === item.href)}
              collapsed={collapsed}
              loading={showLoading && pendingNav?.href === item.href}
              onNavigate={handleNavigate}
            />
          ))}
        </nav>
      </div>

      <div className="mt-auto p-3">
        <UserPill
          onSignOut={() => void handleSignOut()}
          isSigningOut={isSigningOut}
          collapsed={collapsed}
          initialName={initialName}
          initialEmail={initialEmail}
        />
      </div>
    </aside>
  );
}
