import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";

import { OnboardingClient } from "./onboarding-client";
import {
  DEFAULT_ONBOARDING_STATE,
  ONBOARDING_STEPS,
  type OnboardingState,
  type PayoutMethod,
  type PhotographyType,
  type StepId,
} from "./_components/types";

const STEP_IDS = new Set<StepId>(ONBOARDING_STEPS.map((s) => s.id));

function isStepId(value: unknown): value is StepId {
  return typeof value === "string" && STEP_IDS.has(value as StepId);
}

function hydrateState(meta: Record<string, unknown>): OnboardingState {
  return {
    business: {
      businessName:
        typeof meta.business_name === "string"
          ? meta.business_name
          : DEFAULT_ONBOARDING_STATE.business.businessName,
      photographyTypes: Array.isArray(meta.photography_types)
        ? (meta.photography_types as PhotographyType[])
        : DEFAULT_ONBOARDING_STATE.business.photographyTypes,
      bio:
        typeof meta.bio === "string" ? meta.bio : DEFAULT_ONBOARDING_STATE.business.bio,
    },
    contact: {
      phone:
        typeof meta.phone === "string"
          ? meta.phone
          : DEFAULT_ONBOARDING_STATE.contact.phone,
      website:
        typeof meta.website === "string"
          ? meta.website
          : DEFAULT_ONBOARDING_STATE.contact.website,
      instagram:
        typeof meta.instagram === "string"
          ? meta.instagram
          : DEFAULT_ONBOARDING_STATE.contact.instagram,
    },
    brand: {
      primaryColor:
        typeof meta.brand_color === "string"
          ? meta.brand_color
          : DEFAULT_ONBOARDING_STATE.brand.primaryColor,
      welcomeMessage:
        typeof meta.welcome_message === "string"
          ? meta.welcome_message
          : DEFAULT_ONBOARDING_STATE.brand.welcomeMessage,
    },
    payments: {
      country:
        typeof meta.payments_country === "string"
          ? meta.payments_country
          : DEFAULT_ONBOARDING_STATE.payments.country,
      method: (() => {
        if (typeof meta.payments_method !== "string") {
          return DEFAULT_ONBOARDING_STATE.payments.method;
        }
        const saved = meta.payments_method.trim();
        return saved.length > 0
          ? (saved as PayoutMethod | "")
          : DEFAULT_ONBOARDING_STATE.payments.method;
      })(),
    },
    notifications: {
      sales:
        typeof meta.notif_sales === "boolean"
          ? meta.notif_sales
          : DEFAULT_ONBOARDING_STATE.notifications.sales,
      matches:
        typeof meta.notif_matches === "boolean"
          ? meta.notif_matches
          : DEFAULT_ONBOARDING_STATE.notifications.matches,
      weeklyDigest:
        typeof meta.notif_weekly_digest === "boolean"
          ? meta.notif_weekly_digest
          : DEFAULT_ONBOARDING_STATE.notifications.weeklyDigest,
    },
  };
}

function resolveInitialStep(
  searchStep: string | undefined,
  meta: Record<string, unknown>
): StepId {
  if (searchStep === "brand") return "payments";
  if (isStepId(searchStep)) return searchStep;
  if (meta.onboarding_step === "brand") return "payments";
  if (isStepId(meta.onboarding_step)) return meta.onboarding_step as StepId;
  return "business";
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ step?: string | string[] }>;
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    redirect("/login");
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.onboarding_completed === true) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const rawStep = Array.isArray(params.step) ? params.step[0] : params.step;
  const initialStep = resolveInitialStep(rawStep, meta);
  const initialState = hydrateState(meta);

  return <OnboardingClient initialStep={initialStep} initialState={initialState} />;
}
