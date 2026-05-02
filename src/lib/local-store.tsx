"use client";

import * as React from "react";

export type EventType = "Carrera" | "Graduacion" | "Boda" | "Torneo" | "Corporativo";

export type ProcessingStatus = "Borrador" | "Subiendo" | "Procesando" | "Listo" | "Con errores";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  websiteUrl?: string;
  bio?: string;
};

export type PayoutMethod = "none" | "bank" | "mobile-money" | "paypal";
export type WatermarkStyle = "none" | "subtle" | "bold";
export type SupportedLocale = "es-HN" | "es-MX" | "es-ES" | "en-US";

export type AppSettings = {
  brand: {
    primaryColor: string;
    watermarkStyle: WatermarkStyle;
    instagramHandle?: string;
  };
  payout: {
    method: PayoutMethod;
    currency: "HNL" | "USD";
    accountHolder?: string;
    rtn?: string;
    bankName?: string;
    accountNumber?: string;
    mobileProvider?: string;
    mobilePhone?: string;
    paypalEmail?: string;
  };
  notifications: {
    emailNewOrder: boolean;
    emailWeeklySummary: boolean;
    emailProductNews: boolean;
    whatsappNewOrder: boolean;
  };
  preferences: {
    locale: SupportedLocale;
    timezone: string;
    dateFormat: "short" | "long";
  };
};

export type AppEvent = {
  id: string;
  slug: string;
  name: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  city: string;
  venue?: string;
  description?: string;
  pricePerPhotoHnl: number;
  onlineDays: number;
  whatsapp: string;
  coverHint: string;

  status: ProcessingStatus;
  photosUploaded: number;
  photosProcessed: number;
  facesDetected: number;
  selfieSearches: number;
  orders: number;
  revenueGrossHnl: number;

  createdAt: string;
  updatedAt: string;
};

export type AppPhoto = {
  id: string;
  eventId: string;
  filename: string;
  status: "Uploaded" | "Processed" | "Error";
  facesDetected: number;
  createdAt: string;
};

export type OrderStatus = "Pendiente" | "Pagado" | "Entregado";

export type AppOrder = {
  id: string;
  eventId: string;
  clientName: string;
  whatsapp: string;
  createdAt: string;
  status: OrderStatus;
  photoIds: string[];
  grossTotalHnl: number;
};

export type AppState = {
  session: {
    userId: string;
  };
  users: AppUser[];
  events: AppEvent[];
  photos: AppPhoto[];
  orders: AppOrder[];
  settings: AppSettings;
};

function defaultSettings(): AppSettings {
  return {
    brand: {
      primaryColor: "#18181b",
      watermarkStyle: "subtle",
    },
    payout: {
      method: "none",
      currency: "HNL",
    },
    notifications: {
      emailNewOrder: true,
      emailWeeklySummary: false,
      emailProductNews: false,
      whatsappNewOrder: true,
    },
    preferences: {
      locale: "es-HN",
      timezone: "America/Tegucigalpa",
      dateFormat: "short",
    },
  };
}

const STORAGE_KEY = "4tercios:state:v2";
const COMMISSION_RATE = 0.2;

function nowIso() {
  return new Date().toISOString();
}

function safeUUID(prefix: string) {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch {
    // ignore
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function seedState(): AppState {
  const user: AppUser = {
    id: "usr_photographer_01",
    name: "",
    email: "",
  };

  return {
    session: { userId: user.id },
    users: [user],
    events: [],
    photos: [],
    orders: [],
    settings: defaultSettings(),
  };
}

function readStorage(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

function migrate(stored: Partial<AppState>): AppState {
  const seed = seedState();
  const s = stored.settings ?? ({} as Partial<AppSettings>);
  return {
    session: stored.session ?? seed.session,
    users: stored.users ?? seed.users,
    events: stored.events ?? seed.events,
    photos: stored.photos ?? seed.photos,
    orders: stored.orders ?? seed.orders,
    settings: {
      brand: { ...seed.settings.brand, ...(s.brand ?? {}) },
      payout: { ...seed.settings.payout, ...(s.payout ?? {}) },
      notifications: { ...seed.settings.notifications, ...(s.notifications ?? {}) },
      preferences: { ...seed.settings.preferences, ...(s.preferences ?? {}) },
    },
  };
}

function writeStorage(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

type AppActions = {
  reset(): void;
  createEvent(
    input: Omit<
      AppEvent,
      | "id"
      | "slug"
      | "createdAt"
      | "updatedAt"
      | "status"
      | "photosUploaded"
      | "photosProcessed"
      | "facesDetected"
      | "selfieSearches"
      | "orders"
      | "revenueGrossHnl"
    > & { slug?: string }
  ): string;
  updateEvent(eventId: string, patch: Partial<Omit<AppEvent, "id" | "createdAt">>): void;
  deleteEvent(eventId: string): void;
  addPhotos(eventId: string, files: FileList | File[]): void;
  markProcessed(eventId: string): void;
  incrementSelfieSearch(eventId: string): void;
  createOrder(input: {
    eventId: string;
    clientName: string;
    whatsapp: string;
    photoIds: string[];
  }): string;
  updateOrder(
    orderId: string,
    patch: Partial<Omit<AppOrder, "id" | "eventId" | "createdAt">>
  ): void;
  updateUser(patch: Partial<Omit<AppUser, "id">>): void;
  updateSettings<K extends keyof AppSettings>(
    section: K,
    patch: Partial<AppSettings[K]>
  ): void;
};

const AppStoreContext = React.createContext<(AppState & { actions: AppActions }) | null>(
  null
);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AppState>(() => {
    const stored = readStorage();
    if (!stored) {
      const seeded = seedState();
      writeStorage(seeded);
      return seeded;
    }
    const migrated = migrate(stored);
    writeStorage(migrated);
    return migrated;
  });

  React.useEffect(() => {
    writeStorage(state);
  }, [state]);

  const actions = React.useMemo<AppActions>(() => {
    return {
      reset() {
        const next = seedState();
        setState(next);
        writeStorage(next);
      },
      createEvent(input) {
        const id = safeUUID("evt");
        const t = nowIso();
        const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);

        setState((s) => ({
          ...s,
          events: [
            {
              id,
              slug,
              name: input.name,
              type: input.type,
              date: input.date,
              city: input.city,
              venue: input.venue,
              description: input.description,
              pricePerPhotoHnl: input.pricePerPhotoHnl,
              onlineDays: input.onlineDays,
              whatsapp: input.whatsapp,
              coverHint: input.coverHint,
              status: "Borrador",
              photosUploaded: 0,
              photosProcessed: 0,
              facesDetected: 0,
              selfieSearches: 0,
              orders: 0,
              revenueGrossHnl: 0,
              createdAt: t,
              updatedAt: t,
            },
            ...s.events,
          ],
        }));

        return id;
      },
      updateEvent(eventId, patch) {
        setState((s) => ({
          ...s,
          events: s.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  ...patch,
                  slug: patch.slug ? slugify(patch.slug) : e.slug,
                  updatedAt: nowIso(),
                }
              : e
          ),
        }));
      },
      deleteEvent(eventId) {
        setState((s) => ({
          ...s,
          events: s.events.filter((e) => e.id !== eventId),
          photos: s.photos.filter((p) => p.eventId !== eventId),
          orders: s.orders.filter((o) => o.eventId !== eventId),
        }));
      },
      addPhotos(eventId, files) {
        const list = Array.isArray(files) ? files : Array.from(files);
        const t = nowIso();
        const newPhotos: AppPhoto[] = list.map((f) => ({
          id: safeUUID("p"),
          eventId,
          filename: f.name || "foto.jpg",
          status: "Uploaded",
          facesDetected: 0,
          createdAt: t,
        }));

        setState((s) => ({
          ...s,
          photos: [...newPhotos, ...s.photos],
          events: s.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  status: "Subiendo",
                  photosUploaded: e.photosUploaded + newPhotos.length,
                  updatedAt: t,
                }
              : e
          ),
        }));
      },
      markProcessed(eventId) {
        setState((s) => {
          const photos: AppPhoto[] = s.photos.map((p): AppPhoto => {
            if (p.eventId !== eventId) return p;
            if (p.status === "Processed") return p;
            const faces = Math.max(0, Math.round(1 + Math.random() * 4));
            return { ...p, status: "Processed", facesDetected: faces };
          });

          const eventPhotos = photos.filter((p) => p.eventId === eventId);
          const processed = eventPhotos.filter((p) => p.status === "Processed").length;
          const uploaded = eventPhotos.length;
          const faces = eventPhotos.reduce((acc, p) => acc + p.facesDetected, 0);

          return {
            ...s,
            photos,
            events: s.events.map((e) =>
              e.id === eventId
                ? {
                    ...e,
                    status: uploaded > 0 && processed === uploaded ? "Listo" : "Procesando",
                    photosUploaded: Math.max(e.photosUploaded, uploaded),
                    photosProcessed: processed,
                    facesDetected: faces,
                    updatedAt: nowIso(),
                  }
                : e
            ),
          };
        });
      },
      incrementSelfieSearch(eventId) {
        setState((s) => ({
          ...s,
          events: s.events.map((e) =>
            e.id === eventId
              ? { ...e, selfieSearches: e.selfieSearches + 1, updatedAt: nowIso() }
              : e
          ),
        }));
      },
      createOrder({ eventId, clientName, whatsapp, photoIds }) {
        const id = safeUUID("ord");
        const createdAt = nowIso();

        setState((s) => {
          const event = s.events.find((e) => e.id === eventId);
          const gross = (event?.pricePerPhotoHnl ?? 0) * photoIds.length;

          return {
            ...s,
            orders: [
              {
                id,
                eventId,
                clientName,
                whatsapp,
                createdAt,
                status: "Pendiente",
                photoIds,
                grossTotalHnl: gross,
              },
              ...s.orders,
            ],
            events: s.events.map((e) =>
              e.id === eventId
                ? {
                    ...e,
                    orders: e.orders + 1,
                    revenueGrossHnl: e.revenueGrossHnl + gross,
                    updatedAt: createdAt,
                  }
                : e
            ),
          };
        });

        return id;
      },
      updateOrder(orderId, patch) {
        setState((s) => ({
          ...s,
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, ...patch } : o)),
        }));
      },
      updateUser(patch) {
        setState((s) => ({
          ...s,
          users: s.users.map((u) => (u.id === s.session.userId ? { ...u, ...patch } : u)),
        }));
      },
      updateSettings(section, patch) {
        setState((s) => ({
          ...s,
          settings: {
            ...s.settings,
            [section]: { ...s.settings[section], ...patch },
          },
        }));
      },
    };
  }, []);

  return (
    <AppStoreContext.Provider value={{ ...state, actions }}>{children}</AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = React.useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}

export function formatHnl(amount: number) {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateISO(dateIso: string) {
  const d = new Date(dateIso + "T00:00:00");
  return new Intl.DateTimeFormat("es-HN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export function commissionHnl(gross: number) {
  return Math.round(gross * COMMISSION_RATE);
}
