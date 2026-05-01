// Shared shape of rows in the Lensia/Huella database.
// Keep in sync with supabase/migrations/0001_initial_schema.sql.

export type EventType = "Carrera" | "Graduacion" | "Boda" | "Torneo" | "Corporativo" | "Otro";
export type EventStatus =
  | "Borrador"
  | "Subiendo"
  | "Procesando"
  | "Listo"
  | "Con errores"
  | "Archivado";

export type PhotoStatus = "uploaded" | "processing" | "ready" | "error";
export type OrderStatus = "pending" | "paid" | "delivered" | "cancelled";
export type PaymentProvider = "manual_whatsapp" | "clinpays";

export type Photographer = {
  id: string;
  business_name: string;
  whatsapp: string | null;
  brand_color: string | null;
  payout_country: string | null;
  payout_method: string | null;
  created_at: string;
  updated_at: string;
};

export type EventRow = {
  id: string;
  photographer_id: string;
  slug: string;
  name: string;
  type: EventType;
  date: string;
  city: string | null;
  venue: string | null;
  description: string | null;
  cover_photo_id: string | null;
  price_per_photo_hnl: number;
  online_days: number;
  whatsapp: string | null;
  status: EventStatus;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type PhotoRow = {
  id: string;
  event_id: string;
  storage_path: string;
  thumb_path: string | null;
  filename: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
  taken_at: string | null;
  status: PhotoStatus;
  faces_count: number;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
};

export type FaceRow = {
  id: string;
  photo_id: string;
  event_id: string;
  bbox: { x: number; y: number; w: number; h: number };
  quality: number | null;
  embedding: number[];
  created_at: string;
};

export type SelfieQueryRow = {
  id: string;
  event_id: string;
  embedding: number[];
  ip_hash: string | null;
  created_at: string;
  expires_at: string;
};

export type OrderRow = {
  id: string;
  event_id: string;
  customer_name: string;
  customer_whatsapp: string;
  customer_email: string | null;
  selfie_query_id: string | null;
  photo_ids: string[];
  total_hnl: number;
  status: OrderStatus;
  payment_provider: PaymentProvider;
  payment_reference: string | null;
  payment_url: string | null;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
};
