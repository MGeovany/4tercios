"use client";

import * as React from "react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PhotographerLikeButton({
  username,
  initialTotalClaps,
  initialMyClaps,
}: {
  username: string;
  initialTotalClaps: number;
  initialMyClaps: number;
}) {
  const [totalClaps, setTotalClaps] = React.useState(initialTotalClaps);
  const [myClaps, setMyClaps] = React.useState(initialMyClaps);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reachedLimit = myClaps >= 50;

  const clap = React.useCallback(async () => {
    if (pending || reachedLimit) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/photographers/${username}/likes`, {
        method: "POST",
      });
      const body = (await res.json()) as {
        error?: string;
        totalClaps?: number;
        myClaps?: number;
      };
      if (!res.ok) {
        throw new Error(body.error || "No se pudo guardar tu like");
      }
      setTotalClaps(body.totalClaps ?? totalClaps);
      setMyClaps(body.myClaps ?? myClaps);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setPending(false);
    }
  }, [myClaps, pending, reachedLimit, totalClaps, username]);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={clap}
        disabled={pending || reachedLimit}
        variant={myClaps > 0 ? "default" : "secondary"}
        className="h-10 rounded-full px-5"
      >
        <Heart className="size-4" strokeWidth={2} />
        {pending ? "Enviando..." : "Like"}
      </Button>
      <p className="text-xs text-zinc-500">
        {totalClaps.toLocaleString("es-HN")} likes · Tus likes: {myClaps}/50
      </p>
      {reachedLimit ? (
        <p className="text-xs text-zinc-500">Llegaste al máximo de 50 likes en este perfil.</p>
      ) : null}
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}

