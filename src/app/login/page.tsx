"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { LogIn } from "lucide-react";

import {
  LANDING_LOGO_HEIGHT,
  LANDING_LOGO_SRC,
  LANDING_LOGO_WIDTH,
} from "@/components/landing/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildOnboardingPath, getOnboardingStepFromMetadata } from "@/lib/onboarding";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabaseReady = useMemo(() => {
    try {
      getSupabaseBrowserClient();
      return true;
    } catch {
      return false;
    }
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const meta = (userData.user?.user_metadata ?? {}) as Record<string, unknown>;
      const onboardingCompleted = meta.onboarding_completed === true;
      const onboardingStep = getOnboardingStepFromMetadata(meta);

      setSuccess("Ingreso exitoso. Redirigiendo...");
      router.replace(onboardingCompleted ? "/dashboard" : buildOnboardingPath(onboardingStep));
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesión.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleSignIn() {
    setError(null);
    setSuccess(null);
    setGoogleLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/dashboard`
          : undefined;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (oauthError) {
        setError(oauthError.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar con Google.";
      setError(message);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="font-manrope min-h-screen bg-white text-zinc-950">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-6 py-6">
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
        <Link href="/register" className="text-sm font-semibold text-zinc-700 hover:text-zinc-950">
          Registrarse
        </Link>
      </header>

      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-center text-4xl font-semibold tracking-tight">Iniciar sesión</h1>
          <p className="mt-3 text-center text-lg text-zinc-500">
            Ingresa tus credenciales para continuar.
          </p>

          {!supabaseReady ? (
            <p className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para activar
              autenticación.
            </p>
          ) : null}

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-zinc-200"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="/olvide-contrasena"
                  className="text-xs text-zinc-500 hover:text-zinc-900"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-zinc-200"
              />
            </div>

            {error ? <p className="text-sm text-zinc-700">{error}</p> : null}
            {success ? <p className="text-sm text-zinc-700">{success}</p> : null}

            <Button
              type="submit"
              className="h-12 w-full rounded-xl"
              disabled={loading || !supabaseReady}
            >
              {loading ? "Ingresando..." : "Ingresar con email"}
            </Button>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-0 top-1/2 border-t border-zinc-200" />
            <span className="relative mx-auto block w-fit bg-white px-3 text-xs font-medium tracking-wide text-zinc-500 uppercase">
              O continúa con
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-xl border-zinc-200"
            onClick={onGoogleSignIn}
            disabled={googleLoading || !supabaseReady}
          >
            <LogIn className="size-4" />
            {googleLoading ? "Redirigiendo..." : "Iniciar sesión con Google"}
          </Button>

          <p className="mt-8 text-center text-sm leading-relaxed text-zinc-500">
            Al continuar, aceptas nuestros{" "}
            <Link href="/terminos" className="underline underline-offset-4 hover:text-zinc-900">
              Términos de servicio
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" className="underline underline-offset-4 hover:text-zinc-900">
              Política de privacidad
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
