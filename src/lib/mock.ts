export type EventType = "Carrera" | "Graduacion" | "Boda" | "Torneo" | "Corporativo";

export type ProcessingStatus = "Borrador" | "Subiendo" | "Procesando" | "Listo" | "Con errores";

export type Event = {
  id: string;
  slug: string;
  name: string;
  type: EventType;
  date: string;
  city: string;
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
  revenueHnl: number;
};

export type OrderStatus = "Pendiente" | "Pagado" | "Entregado";

export type Order = {
  id: string;
  eventId: string;
  clientName: string;
  whatsapp: string;
  createdAt: string;
  status: OrderStatus;
  photoIds: string[];
  estimatedTotalHnl: number;
};

export type Photo = {
  id: string;
  eventId: string;
  label: string;
  matchScore?: number; // 0..1
};

export const mockPhotographer = {
  name: "Sula Photo Studio",
  email: "hola@4tercios.thefndrs.com",
};

export const mockEvents: Event[] = [
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
    revenueHnl: 84240,
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
    revenueHnl: 35640,
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
    revenueHnl: 9480,
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
    revenueHnl: 0,
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
    revenueHnl: 42750,
  },
];

export const mockOrders: Order[] = [
  {
    id: "ord_1042",
    eventId: "evt_sps_10k_2026",
    clientName: "Karla Mejia",
    whatsapp: "+504 9888-2211",
    createdAt: "2026-02-16 18:32",
    status: "Pagado",
    photoIds: ["p_01", "p_04", "p_09"],
    estimatedTotalHnl: 240,
  },
  {
    id: "ord_1091",
    eventId: "evt_unitec_grad_2026",
    clientName: "Juan Pablo Rivera",
    whatsapp: "+504 9777-1122",
    createdAt: "2026-03-23 09:10",
    status: "Pendiente",
    photoIds: ["p_02", "p_07"],
    estimatedTotalHnl: 240,
  },
  {
    id: "ord_1103",
    eventId: "evt_intercolegial_tgu",
    clientName: "Madre de familia (Colegio Luz)",
    whatsapp: "+504 9666-3344",
    createdAt: "2026-01-10 16:55",
    status: "Entregado",
    photoIds: ["p_03"],
    estimatedTotalHnl: 60,
  },
];

export function getEventById(eventId: string) {
  return mockEvents.find((e) => e.id === eventId) ?? null;
}

export function getEventBySlug(slug: string) {
  return mockEvents.find((e) => e.slug === slug) ?? null;
}

export function getOrderById(orderId: string) {
  return mockOrders.find((o) => o.id === orderId) ?? null;
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

function hashToHue(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function photoGradient(id: string) {
  const hue = hashToHue(id);
  const a = `hsl(${hue} 70% 55%)`;
  const b = `hsl(${(hue + 28) % 360} 70% 45%)`;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export function mockSearchPhotos(eventId: string): Photo[] {
  const base: Photo[] = Array.from({ length: 24 }).map((_, i) => {
    const n = i + 1;
    const id = `p_${String(n).padStart(2, "0")}`;
    const score = n <= 8 ? 0.94 - n * 0.03 : n <= 14 ? 0.72 - (n - 8) * 0.03 : undefined;
    return {
      id,
      eventId,
      label: n <= 8 ? "Posible coincidencia" : n <= 14 ? "Similar" : "Explorar",
      matchScore: score,
    };
  });
  return base;
}
