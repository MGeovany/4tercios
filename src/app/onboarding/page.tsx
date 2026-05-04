import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ step?: string | string[] }>;
}) {
  const params = (await searchParams) ?? {};
  const rawStep = Array.isArray(params.step) ? params.step[0] : params.step;
  return <OnboardingClient initialStep={rawStep ?? null} />;
}
