"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, LogIn, Mail, User } from "lucide-react";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
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

      setMessage("Cuenta creada. Si el email es válido podrás continuar...");
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
                    Crea tu cuenta
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
                    Empieza a vender tus fotos hoy.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                    Configura tu perfil, crea tu primer evento y comparte tu galería en minutos.
                  </p>
                </div>
              </div>
            </div>

            <ol className="mt-8 space-y-2 text-sm">
              {["Crea tu cuenta", "Configura tu onboarding", "Publica tu primer evento"].map(
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

              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Crear cuenta</h1>
              <p className="mt-2 text-sm text-zinc-600">
                Regístrate para activar tu dashboard y comenzar.
              </p>

              {!supabaseReady ? (
                <p className="mt-6 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-700">
                  Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para
                  activar autenticación.
                </p>
              ) : null}

              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">Nombre</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="first-name"
                        type="text"
                        placeholder="Ej. Juan"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-11 pl-9"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="last-name">Apellido</Label>
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="Ej. Pérez"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

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
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                  />
                </div>

                {error ? <p className="text-sm text-zinc-700">{error}</p> : null}
                {message ? <p className="text-sm text-zinc-700">{message}</p> : null}

                <Button type="submit" className="h-11 w-full" disabled={loading || !supabaseReady}>
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
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
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-medium text-zinc-900 hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
