"use client";

import * as React from "react";

export type EventType = "Carrera" | "Graduacion" | "Boda" | "Torneo" | "Corporativo";

export type ProcessingStatus = "Borrador" | "Subiendo" | "Procesando" | "Listo" | "Con errores";

export type LensiaUser = {
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

export type LensiaSettings = {
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

export type LensiaEvent = {
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

export type LensiaPhoto = {
  id: string;
  eventId: string;
  filename: string;
  status: "Uploaded" | "Processed" | "Error";
  facesDetected: number;
  createdAt: string;
};

export type OrderStatus = "Pendiente" | "Pagado" | "Entregado";

export type LensiaOrder = {
  id: string;
  eventId: string;
  clientName: string;
  whatsapp: string;
  createdAt: string;
  status: OrderStatus;
  photoIds: string[];
  grossTotalHnl: number;
};

export type LensiaState = {
  session: {
    userId: string;
  };
  users: LensiaUser[];
  events: LensiaEvent[];
  photos: LensiaPhoto[];
  orders: LensiaOrder[];
  settings: LensiaSettings;
};

function defaultSettings(): LensiaSettings {
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

const STORAGE_KEY = "lensia:state:v1";
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

function seedState(): LensiaState {
  const t = nowIso();
  const user: LensiaUser = {
    id: "usr_photographer_01",
    name: "Sula Photo Studio",
    email: "hola@4tercios.thefndrs.com",
  };

  const events: LensiaEvent[] = [
    {
      id: "evt_sps_10k_2026",
      slug: "carrera-10k-san-pedro-sula",
      name: "Carrera 10K San Pedro Sula",
      type: "Carrera",
      date: "2026-02-16",
      city: "San Pedro Sula",
      pricePerPhotoHnl: 80,
      onlineDays: 14,
      whatsapp: "+504 9999-1234",
      coverHint: "atletas en meta",
      status: "Listo",
      photosUploaded: 1842,
      photosProcessed: 1842,
      facesDetected: 6120,
      selfieSearches: 438,
      orders: 96,
      revenueGrossHnl: 105300,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "evt_unitec_grad_2026",
      slug: "graduacion-unitec-2026",
      name: "Graduacion Unitec 2026",
      type: "Graduacion",
      date: "2026-03-22",
      city: "Tegucigalpa",
      pricePerPhotoHnl: 120,
      onlineDays: 21,
      whatsapp: "+504 9999-1234",
      coverHint: "toga y birrete",
      status: "Procesando",
      photosUploaded: 980,
      photosProcessed: 611,
      facesDetected: 1980,
      selfieSearches: 212,
      orders: 44,
      revenueGrossHnl: 44550,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "evt_intercolegial_tgu",
      slug: "torneo-intercolegial-tegucigalpa",
      name: "Torneo Intercolegial Tegucigalpa",
      type: "Torneo",
      date: "2026-01-10",
      city: "Tegucigalpa",
      pricePerPhotoHnl: 60,
      onlineDays: 10,
      whatsapp: "+504 9999-1234",
      coverHint: "equipo celebrando",
      status: "Listo",
      photosUploaded: 612,
      photosProcessed: 612,
      facesDetected: 1244,
      selfieSearches: 129,
      orders: 21,
      revenueGrossHnl: 11850,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "evt_boda_ana_luis",
      slug: "boda-ana-y-luis",
      name: "Boda Ana & Luis",
      type: "Boda",
      date: "2026-04-05",
      city: "Comayagua",
      pricePerPhotoHnl: 150,
      onlineDays: 30,
      whatsapp: "+504 9999-1234",
      coverHint: "primer baile",
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
    {
      id: "evt_maraton_ceiba",
      slug: "maraton-la-ceiba",
      name: "Maraton La Ceiba",
      type: "Carrera",
      date: "2026-03-02",
      city: "La Ceiba",
      pricePerPhotoHnl: 75,
      onlineDays: 14,
      whatsapp: "+504 9999-1234",
      coverHint: "atardecer en malecon",
      status: "Con errores",
      photosUploaded: 1240,
      photosProcessed: 1179,
      facesDetected: 3880,
      selfieSearches: 301,
      orders: 58,
      revenueGrossHnl: 53400,
      createdAt: t,
      updatedAt: t,
    },
  ];

  const orders: LensiaOrder[] = [
    {
      id: "ord_1042",
      eventId: "evt_sps_10k_2026",
      clientName: "Karla Mejia",
      whatsapp: "+504 9888-2211",
      createdAt: "2026-02-16T18:32:00.000Z",
      status: "Pagado",
      photoIds: ["p_01", "p_04", "p_09"],
      grossTotalHnl: 240,
    },
    {
      id: "ord_1091",
      eventId: "evt_unitec_grad_2026",
      clientName: "Juan Pablo Rivera",
      whatsapp: "+504 9777-1122",
      createdAt: "2026-03-23T09:10:00.000Z",
      status: "Pendiente",
      photoIds: ["p_02", "p_07"],
      grossTotalHnl: 240,
    },
  ];

  return {
    session: { userId: user.id },
    users: [user],
    events,
    photos: [],
    orders,
    settings: defaultSettings(),
  };
}

function readStorage(): LensiaState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LensiaState;
  } catch {
    return null;
  }
}

function migrate(stored: Partial<LensiaState>): LensiaState {
  const seed = seedState();
  const s = stored.settings ?? ({} as Partial<LensiaSettings>);
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

function writeStorage(state: LensiaState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

type LensiaActions = {
  reset(): void;
  createEvent(
    input: Omit<
      LensiaEvent,
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
  updateEvent(eventId: string, patch: Partial<Omit<LensiaEvent, "id" | "createdAt">>): void;
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
    patch: Partial<Omit<LensiaOrder, "id" | "eventId" | "createdAt">>
  ): void;
  updateUser(patch: Partial<Omit<LensiaUser, "id">>): void;
  updateSettings<K extends keyof LensiaSettings>(
    section: K,
    patch: Partial<LensiaSettings[K]>
  ): void;
};

const LensiaContext = React.createContext<(LensiaState & { actions: LensiaActions }) | null>(null);

export function LensiaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<LensiaState>(() => {
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

  const actions = React.useMemo<LensiaActions>(() => {
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
        const newPhotos: LensiaPhoto[] = list.map((f) => ({
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
          const photos: LensiaPhoto[] = s.photos.map((p): LensiaPhoto => {
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

  return <LensiaContext.Provider value={{ ...state, actions }}>{children}</LensiaContext.Provider>;
}

export function useLensia() {
  const ctx = React.useContext(LensiaContext);
  if (!ctx) throw new Error("useLensia must be used within LensiaProvider");
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
