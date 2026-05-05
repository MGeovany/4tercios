"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";
import Confetti from "react-confetti";

import {
  LANDING_LOGO_HEIGHT,
  LANDING_LOGO_SRC,
  LANDING_LOGO_WIDTH,
} from "@/components/landing/constants";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { OnboardingProgress } from "./_components/progress";
import {
  StepBusiness,
  StepContact,
  StepNotifications,
  StepPayments,
} from "./_components/steps";
import { ONBOARDING_STEPS, type OnboardingState, type StepId } from "./_components/types";

type SaveState = "idle" | "saving" | "error";

type PersistArgs = {
  state: OnboardingState;
  step: StepId;
  markCompleted: boolean;
};

function buildMetadataPatch({ state, step, markCompleted }: PersistArgs) {
  return {
    business_name: state.business.businessName.trim(),
    photography_types: state.business.photographyTypes,
    bio: state.business.bio.trim(),
    phone: state.contact.phone.trim(),
    website: state.contact.website.trim(),
    instagram: state.contact.instagram.trim(),
    brand_color: state.brand.primaryColor,
    welcome_message: state.brand.welcomeMessage.trim(),
    payments_country: state.payments.country.trim(),
    payments_method: state.payments.method.trim(),
    notif_sales: state.notifications.sales,
    notif_matches: state.notifications.matches,
    notif_weekly_digest: state.notifications.weeklyDigest,
    onboarding_step: step,
    ...(markCompleted ? { onboarding_completed: true } : {}),
  };
}

async function saveOnboarding(args: PersistArgs) {
  const supabase = getSupabaseBrowserClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error("No encontramos tu sesión.");

  const { error: updErr } = await supabase.auth.updateUser({
    data: buildMetadataPatch(args),
  });
  if (updErr) throw updErr;

  const businessName = args.state.business.businessName.trim();
  const phone = args.state.contact.phone.trim();
  const country = args.state.payments.country.trim();
  const method = args.state.payments.method.trim();
  const brandColor = args.state.brand.primaryColor;

  const fullPatch: Record<string, unknown> = {
    id: user.id,
    business_name: businessName || "Fotógrafo",
    whatsapp: phone || null,
    brand_color: brandColor || "#18181b",
    payout_country: country || null,
    payout_method: method || null,
  };

  const { error: photographerErr } = await supabase
    .from("photographers")
    .upsert(fullPatch, { onConflict: "id" });

  if (!photographerErr) return;

  const code = (photographerErr as { code?: string }).code;
  if (code !== "PGRST204") throw photographerErr;

  const { error: minimalErr } = await supabase.from("photographers").upsert(
    {
      id: user.id,
      business_name: businessName || "Fotógrafo",
      whatsapp: phone || null,
      brand_color: brandColor || "#18181b",
    },
    { onConflict: "id" }
  );
  if (minimalErr) throw minimalErr;
}

function getStepRequirementMessage(
  stepId: StepId,
  state: OnboardingState
): string | null {
  if (stepId === "business" && state.business.businessName.trim().length === 0) {
    return "Agrega el nombre de tu negocio para continuar.";
  }
  if (stepId === "payments" && state.payments.country.trim().length === 0) {
    return "Selecciona tu país para configurar pagos.";
  }
  return null;
}

export function OnboardingClient({
  initialStep,
  initialState,
}: {
  initialStep: StepId;
  initialState: OnboardingState;
}) {
  const router = useRouter();

  const initialIndex = Math.max(
    0,
    ONBOARDING_STEPS.findIndex((s) => s.id === initialStep)
  );
  const [stepIndex, setStepIndex] = useState(initialIndex);
  const [state, setState] = useState<OnboardingState>(initialState);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  // Per-call abortable persist: only the latest save's outcome wins.
  const lastSaveTokenRef = useRef(0);

  const total = ONBOARDING_STEPS.length;
  const currentStep = ONBOARDING_STEPS[stepIndex] ?? ONBOARDING_STEPS[0];
  const isLastStep = stepIndex === total - 1;

  const requirementMessage = getStepRequirementMessage(currentStep.id, state);
  const canContinue = !requirementMessage;

  function persistInBackground(args: PersistArgs) {
    const token = ++lastSaveTokenRef.current;
    setSaveState("saving");
    setErrorMessage(null);

    saveOnboarding(args)
      .then(() => {
        if (lastSaveTokenRef.current !== token) return;
        setSaveState("idle");
      })
      .catch((err: unknown) => {
        if (lastSaveTokenRef.current !== token) return;
        const message =
          err instanceof Error ? err.message : "No se pudo guardar tu avance.";
        console.error("[onboarding] persist error", err);
        setSaveState("error");
        setErrorMessage(message);
      });
  }

  function goBack() {
    if (stepIndex === 0) return;
    setErrorMessage(null);
    const prevIndex = stepIndex - 1;
    const prevStep = ONBOARDING_STEPS[prevIndex].id;
    setStepIndex(prevIndex);
    persistInBackground({ state, step: prevStep, markCompleted: false });
  }

  function goNext() {
    if (!canContinue) {
      setErrorMessage(requirementMessage);
      return;
    }
    setErrorMessage(null);

    if (!isLastStep) {
      const nextIndex = stepIndex + 1;
      const nextStep = ONBOARDING_STEPS[nextIndex].id;
      setStepIndex(nextIndex);
      persistInBackground({ state, step: nextStep, markCompleted: false });
      return;
    }

    finishOnboarding();
  }

  async function finishOnboarding() {
    setSaveState("saving");
    setErrorMessage(null);
    try {
      await saveOnboarding({ state, step: "notifications", markCompleted: true });
      setCompleted(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo guardar tu información.";
      console.error("[onboarding] finish error", err);
      setSaveState("error");
      setErrorMessage(message);
    } finally {
      setSaveState("idle");
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border/60 border-b">
        <div
          className={`mx-auto flex h-14 max-w-3xl items-center px-6 ${completed ? "justify-center" : "justify-start"}`}
        >
          <Link
            href="/"
            className="inline-flex rounded-xl focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
            aria-label="4Tercios"
          >
            <Image
              src={LANDING_LOGO_SRC}
              alt="4Tercios"
              width={LANDING_LOGO_WIDTH}
              height={LANDING_LOGO_HEIGHT}
              className="h-4 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      <main
        className={
          completed
            ? "mx-auto flex min-h-[calc(100dvh-3.5rem)] min-h-[calc(100vh-3.5rem)] w-full max-w-xl items-center justify-center px-6"
            : "mx-auto w-full max-w-xl px-6 py-10 sm:py-14"
        }
      >
        {completed ? (
          <CompletionView onContinue={() => router.replace("/dashboard")} />
        ) : (
          <>
            <OnboardingProgress steps={ONBOARDING_STEPS} currentIndex={stepIndex} />

            <div className="mt-10">
              {currentStep.id === "business" ? (
                <StepBusiness
                  value={state.business}
                  onChange={(v) => setState((prev) => ({ ...prev, business: v }))}
                />
              ) : null}
              {currentStep.id === "contact" ? (
                <StepContact
                  value={state.contact}
                  onChange={(v) => setState((prev) => ({ ...prev, contact: v }))}
                />
              ) : null}
              {currentStep.id === "payments" ? (
                <StepPayments
                  value={state.payments}
                  onChange={(v) => setState((prev) => ({ ...prev, payments: v }))}
                />
              ) : null}
              {currentStep.id === "notifications" ? (
                <StepNotifications
                  value={state.notifications}
                  onChange={(v) => setState((prev) => ({ ...prev, notifications: v }))}
                />
              ) : null}
            </div>

            {errorMessage ? (
              <p className="mt-6 text-sm text-red-600">{errorMessage}</p>
            ) : null}
            {!errorMessage && requirementMessage ? (
              <p className="text-muted-foreground mt-6 text-xs">{requirementMessage}</p>
            ) : null}

            <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {stepIndex > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goBack}
                    disabled={saveState === "saving"}
                  >
                    <ArrowLeft className="size-4" />
                    Atrás
                  </Button>
                ) : null}
              </div>

              <Button
                type="button"
                onClick={goNext}
                disabled={!canContinue || (isLastStep && saveState === "saving")}
                className="sm:min-w-[160px]"
              >
                {isLastStep && saveState === "saving"
                  ? "Guardando..."
                  : isLastStep
                    ? "Terminar"
                    : "Continuar"}
                {!isLastStep ? <ArrowRight className="size-4" /> : null}
                {isLastStep && saveState !== "saving" ? (
                  <Check className="size-4" />
                ) : null}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function CompletionView({ onContinue }: { onContinue: () => void }) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
          confettiSource={{ x: 0, y: 0, w: viewport.width, h: viewport.height }}
          numberOfPieces={300}
          recycle={false}
          gravity={0.12}
          className="pointer-events-none fixed inset-0 z-0"
        />
      ) : null}
      <div className="bg-muted mx-auto flex size-14 items-center justify-center rounded-full">
        <PartyPopper className="size-6" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-[28px]">
        ¡Todo listo!
      </h1>
      <p className="text-muted-foreground mx-auto mt-3 max-w-sm text-sm leading-relaxed">
        Tu cuenta está configurada. Ya puedes crear tu primer evento y compartir tu
        galería.
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
