"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

      setSuccess("Ingreso exitoso. Redirigiendo...");
      router.replace("/dashboard");
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
    <div className="bg-background flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
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
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="/olvide-contrasena"
                    className="text-muted-foreground hover:text-foreground text-xs"
                  >
                    Olvidé mi contraseña
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
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

              <Button type="submit" className="w-full" disabled={loading || !supabaseReady}>
                {loading ? "Ingresando..." : "Continuar"}
              </Button>
            </form>

            <div className="relative py-1">
              <div className="border-border absolute inset-0 top-1/2 border-t" />
              <span className="bg-card text-muted-foreground relative mx-auto block w-fit px-2 text-xs">
                o
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onGoogleSignIn}
              disabled={googleLoading || !supabaseReady}
            >
              <LogIn className="size-4" />
              {googleLoading ? "Redirigiendo..." : "Continuar con Google"}
            </Button>

            <p className="text-muted-foreground text-sm">
              ¿No tienes cuenta?{" "}
              <Link href="/registro" className="text-foreground underline-offset-4 hover:underline">
                Regístrate
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
