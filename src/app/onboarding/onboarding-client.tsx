"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";
import Confetti from "react-confetti";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  buildOnboardingPath,
  getOnboardingStepFromMetadata,
  isOnboardingStepId,
  type OnboardingStepId,
} from "@/lib/onboarding";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { OnboardingProgress } from "./_components/progress";
import {
  StepBrand,
  StepBusiness,
  StepContact,
  StepNotifications,
  StepPayments,
} from "./_components/steps";
import {
  DEFAULT_ONBOARDING_STATE,
  ONBOARDING_STEPS,
  type OnboardingState,
} from "./_components/types";

export function OnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStepRef = useRef<string | null>(searchParams.get("step"));
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  const [authChecked, setAuthChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const supabaseReady = useMemo(() => {
    try {
      getSupabaseBrowserClient();
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!supabaseReady) return;

    let mounted = true;

    async function bootstrap() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error: userErr } = await supabase.auth.getUser();
        if (!mounted) return;

        if (userErr || !data.user) {
          router.replace("/login");
          return;
        }

        const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
        if (meta.onboarding_completed === true) {
          router.replace("/dashboard");
          return;
        }

        const stepFromUrl = initialStepRef.current;
        const resolvedStep = isOnboardingStepId(stepFromUrl)
          ? stepFromUrl
          : getOnboardingStepFromMetadata(meta);
        const resolvedIndex = ONBOARDING_STEPS.findIndex((step) => step.id === resolvedStep);
        setStepIndex(resolvedIndex >= 0 ? resolvedIndex : 0);

        setState((prev) => ({
          ...prev,
          business: {
            businessName:
              typeof meta.business_name === "string"
                ? meta.business_name
                : prev.business.businessName,
            photographyTypes: Array.isArray(meta.photography_types)
              ? (meta.photography_types as OnboardingState["business"]["photographyTypes"])
              : prev.business.photographyTypes,
            bio: typeof meta.bio === "string" ? meta.bio : prev.business.bio,
          },
          contact: {
            phone: typeof meta.phone === "string" ? meta.phone : prev.contact.phone,
            website: typeof meta.website === "string" ? meta.website : prev.contact.website,
            instagram: typeof meta.instagram === "string" ? meta.instagram : prev.contact.instagram,
          },
          brand: {
            primaryColor:
              typeof meta.brand_color === "string" ? meta.brand_color : prev.brand.primaryColor,
            welcomeMessage:
              typeof meta.welcome_message === "string"
                ? meta.welcome_message
                : prev.brand.welcomeMessage,
          },
          payments: {
            country:
              typeof meta.payments_country === "string"
                ? meta.payments_country
                : prev.payments.country,
            method:
              typeof meta.payments_method === "string"
                ? (meta.payments_method as OnboardingState["payments"]["method"])
                : prev.payments.method,
          },
          notifications: {
            sales:
              typeof meta.notif_sales === "boolean" ? meta.notif_sales : prev.notifications.sales,
            matches:
              typeof meta.notif_matches === "boolean"
                ? meta.notif_matches
                : prev.notifications.matches,
            weeklyDigest:
              typeof meta.notif_weekly_digest === "boolean"
                ? meta.notif_weekly_digest
                : prev.notifications.weeklyDigest,
          },
        }));
        setAuthChecked(true);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar tu cuenta.");
        setAuthChecked(true);
      }
    }

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [router, supabaseReady]);

  const total = ONBOARDING_STEPS.length;
  const isLastStep = stepIndex === total - 1;
  const currentStep = ONBOARDING_STEPS[stepIndex];

  const stepRequirementMessage = getStepRequirementMessage(currentStep?.id, state);
  const canContinue = !stepRequirementMessage;

  function goBack() {
    setError(null);
    setStepIndex((i) => {
      const prevIndex = Math.max(0, i - 1);
      const prevStep = ONBOARDING_STEPS[prevIndex]?.id;
      if (prevStep) {
        router.replace(buildOnboardingPath(prevStep));
      }
      return prevIndex;
    });
  }

  async function persist(
    payload: OnboardingState,
    markCompleted: boolean,
    stepToSave: OnboardingStepId
  ) {
    const supabase = getSupabaseBrowserClient();
    const { error: updErr } = await supabase.auth.updateUser({
      data: {
        business_name: payload.business.businessName.trim(),
        photography_types: payload.business.photographyTypes,
        bio: payload.business.bio.trim(),
        phone: payload.contact.phone.trim(),
        website: payload.contact.website.trim(),
        instagram: payload.contact.instagram.trim(),
        brand_color: payload.brand.primaryColor,
        welcome_message: payload.brand.welcomeMessage.trim(),
        payments_country: payload.payments.country,
        payments_method: payload.payments.method,
        notif_sales: payload.notifications.sales,
        notif_matches: payload.notifications.matches,
        notif_weekly_digest: payload.notifications.weeklyDigest,
        onboarding_step: stepToSave,
        ...(markCompleted ? { onboarding_completed: true } : {}),
      },
    });

    if (updErr) throw updErr;
  }

  async function goNext() {
    if (!canContinue) {
      setError(stepRequirementMessage);
      return;
    }
    setError(null);

    if (!isLastStep) {
      const nextIndex = Math.min(total - 1, stepIndex + 1);
      const nextStep = ONBOARDING_STEPS[nextIndex]?.id;
      if (!nextStep) return;

      setSaving(true);
      try {
        await persist(state, false, nextStep);
        setStepIndex(nextIndex);
        router.replace(buildOnboardingPath(nextStep));
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar tu avance.");
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    try {
      await persist(state, true, "notifications");
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar tu información.");
    } finally {
      setSaving(false);
    }
  }

  if (!supabaseReady) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-6">
        <p className="max-w-md text-center text-sm text-red-600">
          Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para activar el
          onboarding.
        </p>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-6">
        <p className="text-muted-foreground text-sm">Preparando tu cuenta...</p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border/60 border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Brand href="/" size="sm" />
          <span className="text-muted-foreground text-xs">Configuración inicial</span>
        </div>
      </header>

      <main
        className={
          completed
            ? "mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-xl items-center justify-center px-6"
            : "mx-auto w-full max-w-xl px-6 py-10 sm:py-14"
        }
      >
        {completed ? (
          <CompletionView onContinue={() => router.replace("/dashboard")} />
        ) : (
          <>
            <OnboardingProgress steps={ONBOARDING_STEPS} currentIndex={stepIndex} />

            <div className="mt-10">
              {currentStep?.id === "business" ? (
                <StepBusiness
                  value={state.business}
                  onChange={(v) => setState({ ...state, business: v })}
                />
              ) : null}
              {currentStep?.id === "contact" ? (
                <StepContact
                  value={state.contact}
                  onChange={(v) => setState({ ...state, contact: v })}
                />
              ) : null}
              {currentStep?.id === "brand" ? (
                <StepBrand value={state.brand} onChange={(v) => setState({ ...state, brand: v })} />
              ) : null}
              {currentStep?.id === "payments" ? (
                <StepPayments
                  value={state.payments}
                  onChange={(v) => setState({ ...state, payments: v })}
                />
              ) : null}
              {currentStep?.id === "notifications" ? (
                <StepNotifications
                  value={state.notifications}
                  onChange={(v) => setState({ ...state, notifications: v })}
                />
              ) : null}
            </div>

            {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
            {!error && stepRequirementMessage ? (
              <p className="text-muted-foreground mt-6 text-xs">{stepRequirementMessage}</p>
            ) : null}

            <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {stepIndex > 0 ? (
                  <Button type="button" variant="ghost" onClick={goBack} disabled={saving}>
                    <ArrowLeft className="size-4" />
                    Atrás
                  </Button>
                ) : null}
              </div>

              <Button
                type="button"
                onClick={goNext}
                disabled={!canContinue || saving}
                className="sm:min-w-[160px]"
              >
                {saving ? "Guardando..." : isLastStep ? "Terminar" : "Continuar"}
                {!saving && !isLastStep ? <ArrowRight className="size-4" /> : null}
                {!saving && isLastStep ? <Check className="size-4" /> : null}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function getStepRequirementMessage(stepId: string | undefined, state: OnboardingState) {
  if (stepId === "business" && state.business.businessName.trim().length === 0) {
    return "Agrega el nombre de tu negocio para continuar.";
  }

  if (stepId === "payments" && state.payments.country.trim().length === 0) {
    return "Selecciona tu país para configurar pagos.";
  }

  if (stepId === "payments" && state.payments.method.trim().length === 0) {
    return "Elige un método de pago preferido.";
  }

  return null;
}

function CompletionView({ onContinue }: { onContinue: () => void }) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setShowConfetti(false);
      return;
    }

    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    const timeout = window.setTimeout(() => setShowConfetti(false), 5000);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="relative text-center">
      {showConfetti && viewport.width > 0 ? (
        <Confetti
          width={viewport.width}
          height={viewport.height}
          numberOfPieces={220}
          recycle={false}
          gravity={0.12}
          className="pointer-events-none fixed inset-0 z-0"
        />
      ) : null}
      <div className="bg-muted mx-auto flex size-14 items-center justify-center rounded-full">
        <PartyPopper className="size-6" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-[28px]">¡Todo listo!</h1>
      <p className="text-muted-foreground mx-auto mt-3 max-w-sm text-sm leading-relaxed">
        Tu cuenta está configurada. Ya puedes crear tu primer evento y compartir tu galería.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button onClick={onContinue} className="sm:min-w-[200px]">
          Ir al dashboard
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
