export type PhotographyType =
  | "bodas"
  | "graduaciones"
  | "carreras"
  | "corporativo"
  | "quinceanos"
  | "social"
  | "retrato"
  | "otros";

export type PayoutMethod = "transferencia" | "tigo_money" | "paypal" | "wire" | "otro";

export type OnboardingState = {
  business: {
    businessName: string;
    photographyTypes: PhotographyType[];
    bio: string;
  };
  contact: {
    phone: string;
    website: string;
    instagram: string;
  };
  brand: {
    primaryColor: string;
    welcomeMessage: string;
  };
  payments: {
    country: string;
    method: PayoutMethod | "";
  };
  notifications: {
    sales: boolean;
    matches: boolean;
    weeklyDigest: boolean;
  };
};

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  business: {
    businessName: "",
    photographyTypes: [],
    bio: "",
  },
  contact: {
    phone: "",
    website: "",
    instagram: "",
  },
  brand: {
    primaryColor: "#2563eb",
    welcomeMessage: "",
  },
  payments: {
    country: "",
    method: "transferencia",
  },
  notifications: {
    sales: true,
    matches: true,
    weeklyDigest: false,
  },
};

export type StepId = "business" | "contact" | "payments" | "notifications";

export type StepMeta = {
  id: StepId;
  label: string;
};

export const ONBOARDING_STEPS: StepMeta[] = [
  { id: "business", label: "Negocio" },
  { id: "contact", label: "Contacto" },
  { id: "payments", label: "Pagos" },
  { id: "notifications", label: "Notificaciones" },
];

export const PHOTOGRAPHY_OPTIONS: { value: PhotographyType; label: string }[] = [
  { value: "bodas", label: "Bodas" },
  { value: "graduaciones", label: "Graduaciones" },
  { value: "carreras", label: "Deportes y carreras" },
  { value: "corporativo", label: "Corporativo" },
  { value: "quinceanos", label: "XV años" },
  { value: "social", label: "Eventos sociales" },
  { value: "retrato", label: "Retrato" },
  { value: "otros", label: "Otros" },
];

export const BRAND_COLORS = [
  { value: "#2563eb", label: "Azul eléctrico" },
  { value: "#0f172a", label: "Medianoche" },
  { value: "#059669", label: "Esmeralda" },
  { value: "#7c3aed", label: "Violeta" },
  { value: "#ea580c", label: "Atardecer" },
];

export const COUNTRY_OPTIONS = [
  { value: "HN", label: "Honduras" },
  { value: "GT", label: "Guatemala" },
  { value: "SV", label: "El Salvador" },
  { value: "NI", label: "Nicaragua" },
  { value: "CR", label: "Costa Rica" },
  { value: "PA", label: "Panamá" },
  { value: "MX", label: "México" },
  { value: "CO", label: "Colombia" },
  { value: "OTRO", label: "Otro país" },
];

export const PAYOUT_METHODS: {
  value: PayoutMethod;
  label: string;
  description: string;
}[] = [
  {
    value: "transferencia",
    label: "Transferencia bancaria",
    description: "Recibe tus pagos en tu cuenta local. 24-72h, menor costo.",
  },
  {
    value: "tigo_money",
    label: "Billetera móvil (Tigo Money)",
    description: "Retiros rápidos desde el celular. Puede tener límites por cuenta.",
  },
  {
    value: "paypal",
    label: "PayPal",
    description: "Recibe pagos internacionales. Comisiones más altas.",
  },
  {
    value: "wire",
    label: "Transferencia internacional (SWIFT)",
    description: "Para cuentas en USD o fuera del país. Puede tardar varios días.",
  },
  {
    value: "otro",
    label: "Lo conversamos",
    description: "Te contactamos para definirlo contigo.",
  },
];
