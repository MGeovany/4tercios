export const ONBOARDING_STEP_IDS = [
  "business",
  "contact",
  "payments",
  "notifications",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

export function isOnboardingStepId(value: unknown): value is OnboardingStepId {
  return (
    typeof value === "string" && ONBOARDING_STEP_IDS.includes(value as OnboardingStepId)
  );
}

export function getOnboardingStepFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): OnboardingStepId {
  const savedStep = metadata?.onboarding_step;
  // Legacy step removed from the flow; move users forward to payments.
  if (savedStep === "brand") return "payments";
  return isOnboardingStepId(savedStep) ? savedStep : "business";
}

export function buildOnboardingPath(stepId: OnboardingStepId) {
  return `/onboarding?step=${stepId}`;
}
