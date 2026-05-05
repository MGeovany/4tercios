"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function stripSensitiveHash() {
  if (typeof window === "undefined" || !window.location.hash) return;

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return;

  const hasAuthTokens =
    hash.includes("access_token=") ||
    hash.includes("refresh_token=") ||
    hash.includes("provider_token=");

  if (!hasAuthTokens) return;
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.search
  );
}

export default function RestablecerContrasenaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
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

  useEffect(() => {
    if (!supabaseReady) return;

    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    async function hydrate() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      stripSensitiveHash();
      if (!mounted) return;
      if (sessionError) {
        setError(sessionError.message);
      } else if (!session) {
        setError("El enlace de recuperación ya expiró o no es válido.");
      } else {
        setHasRecoverySession(true);
      }
      setSessionChecked(true);
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [supabaseReady]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setMessage("Contraseña actualizada. Redirigiendo al login...");
      setTimeout(() => router.replace("/login"), 900);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No se pudo actualizar la contraseña.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-md px-6 py-16">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Restablecer contraseña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!supabaseReady ? (
              <p className="text-sm text-red-600">
                Configura `NEXT_PUBLIC_SUPABASE_URL` y
                `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para activar autenticación.
              </p>
            ) : null}
            {supabaseReady && !sessionChecked ? (
              <p className="text-muted-foreground text-sm">
                Validando enlace de recuperación...
              </p>
            ) : null}

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  loading || !supabaseReady || !sessionChecked || !hasRecoverySession
                }
              >
                {loading ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </form>

            <p className="text-muted-foreground text-sm">
              ¿Necesitas volver?{" "}
              <Link
                href="/login"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Ir a login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
