"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";

import {
  LANDING_LOGO_HEIGHT,
  LANDING_LOGO_SRC,
  LANDING_LOGO_WIDTH,
} from "@/components/landing/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function OlvideContrasenaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
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
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/restablecer-contrasena`
          : undefined;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage("Te enviamos un enlace para restablecer tu contraseña.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo enviar el correo.";
      setError(msg);
    } finally {
      setLoading(false);
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
          Login
        </Link>
      </header>

      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-center text-4xl font-semibold tracking-tight">
            Olvidé mi contraseña
          </h1>
          <p className="mt-3 text-center text-lg text-zinc-500">
            Ingresa tu email para recibir el enlace de recuperación.
          </p>

          {!supabaseReady ? (
            <p className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              Configura `NEXT_PUBLIC_SUPABASE_URL` y
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para activar autenticación.
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

            {error ? <p className="text-sm text-zinc-700">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

            <Button
              type="submit"
              className="h-12 w-full rounded-xl"
              disabled={loading || !supabaseReady}
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
