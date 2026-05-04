"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Lock, LogIn, Mail } from "lucide-react";

import { Brand } from "@/components/brand";
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
    <div className="min-h-screen bg-white px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex items-center justify-center lg:hidden">
          <Link href="/" className="inline-flex items-center">
            <Image src="/brand/main-logo.png" alt="4Tercios" width={320} height={64} priority />
          </Link>
        </header>

        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm lg:grid lg:grid-cols-[1.05fr_1fr]">
          <aside className="hidden border-r border-zinc-200 bg-zinc-50 p-8 lg:flex lg:flex-col lg:justify-between lg:p-10">
            <div>
              <Brand href="/" className="mb-10" />
              <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.14),rgba(255,255,255,0)_62%)]"
                />
                <div className="relative z-10">
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
                    <CheckCircle2 className="size-4 text-zinc-900" />
                    Bienvenido de vuelta
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
                    Inicia sesión y continúa vendiendo.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                    Accede a tus eventos, revisa ventas y comparte tus galerías en minutos.
                  </p>
                </div>
              </div>
            </div>

            <ol className="mt-8 space-y-2 text-sm">
              {["Ingresa con tu correo", "Accede a tu dashboard", "Gestiona eventos y órdenes"].map(
                (item, idx) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-700"
                  >
                    <span className="grid size-6 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                      {idx + 1}
                    </span>
                    {item}
                  </li>
                )
              )}
            </ol>
          </aside>

          <main className="p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 lg:hidden">
                <Brand href="/" />
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
                Iniciar sesión
              </h1>
              <p className="mt-2 text-sm text-zinc-600">Entra a tu cuenta para continuar.</p>

              {!supabaseReady ? (
                <p className="mt-6 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-700">
                  Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para
                  activar autenticación.
                </p>
              ) : null}

              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-9"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link
                      href="/olvide-contrasena"
                      className="text-xs text-zinc-500 hover:text-zinc-900"
                    >
                      Olvidé mi contraseña
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-9"
                    />
                  </div>
                </div>

                {error ? <p className="text-sm text-zinc-700">{error}</p> : null}
                {success ? <p className="text-sm text-zinc-700">{success}</p> : null}

                <Button type="submit" className="h-11 w-full" disabled={loading || !supabaseReady}>
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 top-1/2 border-t border-zinc-200" />
                <span className="relative mx-auto block w-fit bg-white px-3 text-xs text-zinc-500">
                  o
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
                onClick={onGoogleSignIn}
                disabled={googleLoading || !supabaseReady}
              >
                <LogIn className="size-4" />
                {googleLoading ? "Redirigiendo..." : "Continuar con Google"}
              </Button>

              <p className="mt-6 text-sm text-zinc-600">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="font-medium text-zinc-900 hover:underline">
                  Regístrate
                </Link>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
