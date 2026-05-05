import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Check,
  GraduationCap,
  Heart,
  ScanFace,
  Shield,
  Trophy,
  Upload,
  Wallet,
  Zap,
} from "lucide-react";

export const LANDING_LOGO_SRC = "/brand/logo-landing.png";
export const LANDING_LOGO_WIDTH = 695;
export const LANDING_LOGO_HEIGHT = 97;

export const NAV_LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#por-que", label: "Por qué 4Tercios" },
  { href: "#precio", label: "Precio" },
] as const;

export type LandingStep = {
  step: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

export const STEPS: LandingStep[] = [
  {
    step: "01",
    icon: Upload,
    title: "Sube las fotos",
    description:
      "Arrastra carpetas enteras. Aceptamos RAW, JPEG, hasta 50.000 fotos por evento.",
  },
  {
    step: "02",
    icon: ScanFace,
    title: "La IA reconoce caras",
    description:
      "En segundos identifica a cada persona. Indexamos rasgos, no almacenamos rostros.",
  },
  {
    step: "03",
    icon: Wallet,
    title: "Cobras al instante",
    description:
      "Tus clientes buscan con un selfie y compran sus fotos. Tú recibes el pago al instante.",
  },
];

export type LandingBenefit = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const BENEFITS: LandingBenefit[] = [
  {
    icon: Zap,
    title: "Menos fricción, aumentas tus ventas",
    description:
      "Cuando encontrar la foto es fácil, comprarla también. Tus clientes prefieren una alternativa segura y fácil de usar.",
  },
  {
    icon: Check,
    title: "Cero configuración",
    description:
      "Configuración rapida: sube tu evento, establece tus precios y todo listo para compartir.",
  },
  {
    icon: Shield,
    title: "Privacidad por diseño",
    description:
      "Las selfies se usan solo para buscar y se eliminan al instante. No guardamos datos biométricos. No guardamos tus fotos.",
  },
  {
    icon: Heart,
    title: "Tu marca, tu identidad",
    description:
      "Haz que te recuerden: Comparte tu perfil de 4tercios en tus redes sociales para que tus clientes puedan encontrarte rapidamente.",
  },
];

export type LandingEventType = {
  icon: LucideIcon;
  name: string;
  tagline: string;
};

export const EVENT_TYPES: LandingEventType[] = [
  {
    icon: Trophy,
    name: "Carreras y maratones",
    tagline: "Miles de atletas, resultados en minutos.",
  },
  {
    icon: GraduationCap,
    name: "Graduaciones",
    tagline: "Cada familia encuentra su foto sola.",
  },
  {
    icon: Heart,
    name: "Bodas y celebraciones",
    tagline: "Invitados que no esperan el álbum.",
  },
  {
    icon: Building2,
    name: "Eventos corporativos",
    tagline: "Cobertura con entrega inmediata.",
  },
];

export const PRICING_BULLETS = [
  "Sin contratos ni permanencia",
  "Sin costo de setup por evento",
  "Retiros automaticos a tu cuenta",
  "Tú controlas el tiempo disponible",
] as const;

export const IN_VIEW_ANIMATION = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

/** Public paths under `public/landing/fotos-webp/` — used by hero marquees and other previews. */
export const LANDING_PHOTOS = [
  "/landing/fotos-webp/006.webp",
  "/landing/fotos-webp/010.webp",
  "/landing/fotos-webp/026.webp",
  "/landing/fotos-webp/DSC01013.webp",
  "/landing/fotos-webp/DSC01833.webp",
  "/landing/fotos-webp/DSC01955.webp",
  "/landing/fotos-webp/DSC02049.webp",
  "/landing/fotos-webp/DSC02128.webp",
  "/landing/fotos-webp/DSC02596-Edit.webp",
  "/landing/fotos-webp/DSC02911.webp",
  "/landing/fotos-webp/DSC02952.webp",
  "/landing/fotos-webp/DSC03069.webp",
  "/landing/fotos-webp/DSC03200.webp",
  "/landing/fotos-webp/DSC03351.webp",
  "/landing/fotos-webp/DSC04068.webp",
  "/landing/fotos-webp/DSC04256.webp",
  "/landing/fotos-webp/DSC04612.webp",
  "/landing/fotos-webp/DSC04708.webp",
  "/landing/fotos-webp/P1046125.webp",
  "/landing/fotos-webp/P1046317.webp",
  "/landing/fotos-webp/P1056759.webp",
  "/landing/fotos-webp/P1056924.webp",
  "/landing/fotos-webp/P1057106.webp",
  "/landing/fotos-webp/P1057123.webp",
  "/landing/fotos-webp/P1057168.webp",
  "/landing/fotos-webp/P1057441.webp",
  "/landing/fotos-webp/P1067578.webp",
  "/landing/fotos-webp/P1067975.webp",
  "/landing/fotos-webp/P1193250.webp",
  "/landing/fotos-webp/P1193349-2.webp",
  "/landing/fotos-webp/P1193505.webp",
  "/landing/fotos-webp/P1193954.webp",
  "/landing/fotos-webp/P1194056.webp",
  "/landing/fotos-webp/P1204437.webp",
  "/landing/fotos-webp/P1229717.webp",
  "/landing/fotos-webp/P1229728.webp",
  "/landing/fotos-webp/P1230078.webp",
  "/landing/fotos-webp/P1230214.webp",
  "/landing/fotos-webp/P1230966.webp",
  "/landing/fotos-webp/P1230983.webp",
  "/landing/fotos-webp/P1231134.webp",
  "/landing/fotos-webp/P1231504.webp",
  "/landing/fotos-webp/P1253094.webp",
  "/landing/fotos-webp/P1253116.webp",
  "/landing/fotos-webp/P1253229.webp",
  "/landing/fotos-webp/P1253254.webp",
  "/landing/fotos-webp/P1253263.webp",
  "/landing/fotos-webp/P1253465.webp",
  "/landing/fotos-webp/P1253566.webp",
  "/landing/fotos-webp/P1275434.webp",
  "/landing/fotos-webp/P1275648.webp",
  "/landing/fotos-webp/P1286035.webp",
  "/landing/fotos-webp/P1296893.webp",
] as const;

function buildMarqueeRowItems(prefix: string, offset: number) {
  return LANDING_PHOTOS.filter((_, i) => i % 3 === offset).map((src, i) => ({
    id: `${prefix}-${i + 1}`,
    src,
  }));
}

export const HERO_ROWS = [
  {
    id: "row-top",
    direction: "left" as const,
    speed: 0.35,
    items: buildMarqueeRowItems("a", 0),
  },
  {
    id: "row-mid",
    direction: "right" as const,
    speed: 0.55,
    items: buildMarqueeRowItems("b", 1),
  },
  {
    id: "row-bot",
    direction: "left" as const,
    speed: 0.45,
    items: buildMarqueeRowItems("c", 2),
  },
];
