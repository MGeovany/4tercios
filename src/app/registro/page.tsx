"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";

import {
  LANDING_LOGO_HEIGHT,
  LANDING_LOGO_SRC,
  LANDING_LOGO_WIDTH,
} from "@/components/landing/constants";
import { GoogleIcon } from "@/components/icons/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const PASSWORD_RULES = [
  {
    id: "length",
    label: "Mínimo 8 caracteres",
    test: (value: string) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "Al menos una mayúscula",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "Al menos una minúscula",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "Al menos un número",
    test: (value: string) => /\d/.test(value),
  },
  {
    id: "symbol",
    label: "Al menos un caracter especial",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
] as const;

export default function RegistroPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabaseReady = useMemo(() => {
    try {
      getSupabaseBrowserClient();
      return true;
    } catch {
      return false;
    }
  }, []);

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, valid: rule.test(password) })),
    [password]
  );
  const passwordValid = passwordChecks.every((rule) => rule.valid);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!passwordValid) {
      setError("La contraseña no cumple con los requisitos de seguridad.");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const normalizedEmail = email.trim();
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const { error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?next=/onboarding`
              : undefined,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) {
          setError(
            "Cuenta creada, pero no pudimos iniciar sesión automáticamente. Inicia sesión para continuar con el onboarding."
          );
          return;
        }
      }

      setMessage("Cuenta creada. Redirigiendo al onboarding...");
      router.replace("/onboarding");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo crear la cuenta.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleSignIn() {
    setError(null);
    setMessage(null);
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
      const msg = err instanceof Error ? err.message : "No se pudo continuar con Google.";
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="font-manrope min-h-screen bg-white text-zinc-950">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
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
        <Link
          href="/login"
          className="text-sm font-semibold text-zinc-700 hover:text-zinc-950"
        >
          Iniciar sesión
        </Link>
      </header>

      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">
          <h1 className="text-center text-4xl font-semibold tracking-tight">
            Crear una cuenta
          </h1>
          <p className="mt-3 text-center text-lg text-zinc-500">
            Ingresa tus datos para crear tu cuenta
          </p>

          {!supabaseReady ? (
            <p className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              Configura `NEXT_PUBLIC_SUPABASE_URL` y
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para activar autenticación.
            </p>
          ) : null}

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">Nombre</Label>
                <Input
                  id="first-name"
                  type="text"
                  placeholder="Juan"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 rounded-xl border-zinc-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Apellido</Label>
                <Input
                  id="last-name"
                  type="text"
                  placeholder="Pérez"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-12 rounded-xl border-zinc-200"
                />
              </div>
            </div>

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
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-zinc-200 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-800"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <ul className="space-y-1 pt-1 text-xs text-zinc-500">
                {passwordChecks.map((rule) => (
                  <li key={rule.id} className="flex items-center gap-2">
                    <CheckCircle2
                      className={cn(
                        "size-3.5",
                        rule.valid ? "text-green-600" : "text-zinc-300"
                      )}
                    />
                    <span className={cn(rule.valid ? "text-zinc-700" : "text-zinc-500")}>
                      {rule.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {error ? <p className="text-sm text-zinc-700">{error}</p> : null}
            {message ? <p className="text-sm text-zinc-700">{message}</p> : null}

            <Button
              type="submit"
              className="h-12 w-full rounded-xl"
              disabled={loading || !supabaseReady}
            >
              {loading ? "Creando cuenta..." : "Registrarme con email"}
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
            <GoogleIcon className="size-4" />
            {googleLoading ? "Redirigiendo..." : "Registrarme con Google"}
          </Button>

          <p className="mt-8 text-center text-sm leading-relaxed text-zinc-500">
            Al continuar, aceptas nuestros{" "}
            <Link
              href="/terminos"
              className="underline underline-offset-4 hover:text-zinc-900"
            >
              Términos de servicio
            </Link>{" "}
            y la{" "}
            <Link
              href="/privacidad"
              className="underline underline-offset-4 hover:text-zinc-900"
            >
              Política de privacidad
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
