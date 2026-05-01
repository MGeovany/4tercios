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
    method: "",
  },
  notifications: {
    sales: true,
    matches: true,
    weeklyDigest: false,
  },
};

export type StepId = "business" | "contact" | "brand" | "payments" | "notifications";

export type StepMeta = {
  id: StepId;
  label: string;
};

export const ONBOARDING_STEPS: StepMeta[] = [
  { id: "business", label: "Negocio" },
  { id: "contact", label: "Contacto" },
  { id: "brand", label: "Marca" },
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

export const PAYOUT_METHODS: { value: PayoutMethod; label: string; description: string }[] = [
  {
    value: "transferencia",
    label: "Transferencia bancaria",
    description: "Recibe directo en tu banco local.",
  },
  {
    value: "tigo_money",
    label: "Tigo Money / billetera móvil",
    description: "Ideal si manejas pagos por celular.",
  },
  {
    value: "paypal",
    label: "PayPal",
    description: "Para retiros internacionales rápidos.",
  },
  {
    value: "wire",
    label: "Wire / SWIFT",
    description: "Para cuentas en USD u otras monedas.",
  },
  {
    value: "otro",
    label: "Lo conversamos",
    description: "Te contactamos para definirlo contigo.",
  },
];
