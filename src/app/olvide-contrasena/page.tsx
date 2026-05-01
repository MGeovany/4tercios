"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

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
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-md px-6 py-16">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Olvidé mi contraseña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!supabaseReady ? (
              <p className="text-sm text-red-600">
                Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para activar
                autenticación.
              </p>
            ) : null}

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

              <Button type="submit" className="w-full" disabled={loading || !supabaseReady}>
                {loading ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>

            <p className="text-muted-foreground text-sm">
              ¿Recordaste tu contraseña?{" "}
              <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
                Volver a iniciar sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
