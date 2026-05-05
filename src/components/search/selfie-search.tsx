"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons";

import { SelfieCapture, type SelfieResult } from "./selfie-capture";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatHnl } from "@/lib/currency";
import { type WatermarkFontId, type WatermarkStyle } from "@/lib/branding";
import { WatermarkOverlay } from "@/components/photo/watermark-overlay";

type Match = {
  photoId: string;
  score: number;
  facesCount: number;
  thumbUrl: string;
};

type SearchResponse = {
  queryId: string;
  matches: Match[];
  bestMatchScore: number | null;
  totalCandidates: number;
};

type Phase = "idle" | "uploading" | "matching" | "done" | "error";

export function SelfieSearch({
  slug,
  pricePerPhotoHnl,
  whatsapp,
  eventName,
  watermarkStyle = "subtle",
  watermarkColor = "#ffffff",
  watermarkLabel = "4Tercios",
  watermarkFont = "sans",
  watermarkOpacity = 0.08,
  watermarkDensity = 1,
}: {
  slug: string;
  pricePerPhotoHnl: number;
  whatsapp: string;
  eventName: string;
  watermarkStyle?: WatermarkStyle;
  watermarkColor?: string;
  watermarkLabel?: string;
  watermarkFont?: WatermarkFontId;
  watermarkOpacity?: number;
  watermarkDensity?: number;
}) {
  const [selfie, setSelfie] = React.useState<SelfieResult | null>(null);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SearchResponse | null>(null);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  const handleCapture = React.useCallback((s: SelfieResult) => {
    setSelfie(s);
    setError(null);
    setResult(null);
    setPhase("idle");
  }, []);

  const search = React.useCallback(async () => {
    if (!selfie) return;
    setPhase("uploading");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("selfie", selfie.blob, "selfie.jpg");
      setPhase("matching");
      const res = await fetch(`/api/events/${slug}/search`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || `Error ${res.status}`);
      }
      const data = (await res.json()) as SearchResponse;
      setResult(data);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setPhase("error");
    }
  }, [selfie, slug]);

  const reset = React.useCallback(() => {
    if (selfie) URL.revokeObjectURL(selfie.previewUrl);
    setSelfie(null);
    setResult(null);
    setSelected({});
    setError(null);
    setPhase("idle");
  }, [selfie]);

  const selectedIds = React.useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected]
  );
  const total = selectedIds.length * pricePerPhotoHnl;
  const busy = phase === "uploading" || phase === "matching";

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_1fr] xl:gap-8">
      <div className="space-y-4">
        {selfie ? (
          <Card className="overflow-hidden border-zinc-200/80 bg-white shadow-sm">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/70">
              <div className="flex items-center justify-between">
                <CardTitle>Tu selfie</CardTitle>
                <Badge variant="neutral">Paso 1</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-black">
                {/* Selfie preview is a local blob URL; keep <img> to avoid Next Image constraints. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selfie.previewUrl}
                  alt="Selfie"
                  className="aspect-square w-full -scale-x-100 object-cover"
                />
              </div>
              {phase === "idle" || phase === "error" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button onClick={search} disabled={busy} size="lg">
                    Buscar mis fotos <ArrowRightIcon />
                  </Button>
                  <Button onClick={reset} variant="secondary" size="lg">
                    Tomar otra
                  </Button>
                </div>
              ) : null}
              {busy ? (
                <div className="space-y-2">
                  <Progress value={phase === "uploading" ? 35 : 80} />
                  <p className="text-sm text-zinc-700">
                    {phase === "uploading"
                      ? "Subiendo selfie..."
                      : "Buscando coincidencias..."}
                  </p>
                </div>
              ) : null}
              {phase === "done" ? (
                <Button onClick={reset} variant="secondary" className="w-full">
                  Probar otra selfie
                </Button>
              ) : null}
              {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-zinc-200/80 bg-white shadow-sm">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/70">
              <div className="flex items-center justify-between">
                <CardTitle>Encuentra tus fotos</CardTitle>
                <Badge variant="neutral">Paso 1</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <SelfieCapture onCapture={handleCapture} busy={busy} />
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        {phase === "done" && result ? (
          result.matches.length === 0 ? (
            <EmptyState eventName={eventName} />
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant="success">Paso 2 · Coincidencias</Badge>
                  <p className="text-xs text-zinc-500">Selecciona tus fotos favoritas</p>
                </div>
                <p className="text-sm text-zinc-700">
                  Encontramos <strong>{result.matches.length}</strong> foto
                  {result.matches.length === 1 ? "" : "s"} que probablemente eres tú.
                </p>
                {result.bestMatchScore != null ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    Coincidencia más alta: {(result.bestMatchScore * 100).toFixed(0)}%
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {result.matches.map((m) => (
                  <MatchCard
                    key={m.photoId}
                    match={m}
                    selected={!!selected[m.photoId]}
                    onToggle={() =>
                      setSelected((s) => ({ ...s, [m.photoId]: !s[m.photoId] }))
                    }
                    watermarkStyle={watermarkStyle}
                    watermarkColor={watermarkColor}
                    watermarkLabel={watermarkLabel}
                    watermarkFont={watermarkFont}
                    watermarkOpacity={watermarkOpacity}
                    watermarkDensity={watermarkDensity}
                  />
                ))}
              </div>
              <SelectionBar
                count={selectedIds.length}
                total={total}
                pricePerPhotoHnl={pricePerPhotoHnl}
                whatsapp={whatsapp}
                eventSlug={slug}
                photoIds={selectedIds}
              />
            </div>
          )
        ) : (
          <Card className="overflow-hidden border-zinc-200/80 bg-white shadow-sm">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/70">
              <div className="flex items-center justify-between">
                <CardTitle>Cómo funciona</CardTitle>
                <Badge variant="neutral">Paso 2</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-zinc-700">
              <div className="space-y-2.5">
                <p>
                  <strong>1.</strong> Toma o sube una selfie clara, mirando al frente.
                </p>
                <p>
                  <strong>2.</strong> Comparamos tu rostro con cada foto del evento usando
                  IA.
                </p>
                <p>
                  <strong>3.</strong> Te mostramos las fotos donde apareces. Selecciona
                  las que quieras y solicítalas por WhatsApp o paga online.
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                Tu selfie nunca se publica y se elimina después de la búsqueda.
              </p>
              <p className="text-xs text-zinc-500">
                ¿No tienes cámara? Sube una foto desde tu galería con el botón
                &ldquo;Subir foto&rdquo;.
              </p>
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3">
                <Link
                  href={`/e/${slug}/results`}
                  className="text-sm font-medium text-zinc-950 underline underline-offset-4"
                >
                  O explora la galería completa →
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function EmptyState({ eventName }: { eventName: string }) {
  return (
    <Card className="border-zinc-200/80 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>No encontramos coincidencias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm leading-6 text-zinc-700">
        <p>
          No detectamos tu rostro en las fotos publicadas hasta el momento de{" "}
          <strong>{eventName}</strong>.
        </p>
        <p>
          Si el fotógrafo aún está subiendo, vuelve a intentar en unos minutos. También
          puedes probar con otra selfie de mejor iluminación.
        </p>
      </CardContent>
    </Card>
  );
}

function MatchCard({
  match,
  selected,
  onToggle,
  watermarkStyle,
  watermarkColor,
  watermarkLabel,
  watermarkFont,
  watermarkOpacity,
  watermarkDensity,
}: {
  match: Match;
  selected: boolean;
  onToggle: () => void;
  watermarkStyle: WatermarkStyle;
  watermarkColor: string;
  watermarkLabel: string;
  watermarkFont: WatermarkFontId;
  watermarkOpacity: number;
  watermarkDensity: number;
}) {
  const pct = Math.round(match.score * 100);
  const tier =
    match.score >= 0.7
      ? { label: "Muy probable", className: "bg-emerald-50 text-emerald-700" }
      : match.score >= 0.55
        ? { label: "Probable", className: "bg-sky-50 text-sky-700" }
        : { label: "Posible", className: "bg-amber-50 text-amber-700" };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition",
        selected
          ? "border-zinc-950 ring-2 ring-zinc-950"
          : "border-zinc-200/80 hover:border-zinc-300"
      )}
    >
      <div className="relative aspect-4/3 bg-zinc-100">
        <Image
          src={match.thumbUrl}
          alt="Foto del evento"
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        <WatermarkOverlay
          label={watermarkLabel}
          style={watermarkStyle}
          color={watermarkColor}
          font={watermarkFont}
          opacity={watermarkOpacity}
          tileDensity={watermarkDensity}
        />
        {selected ? (
          <span className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-zinc-950 text-white">
            <CheckIcon />
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
            tier.className
          )}
        >
          {tier.label} · {pct}%
        </span>
        <span className="text-xs text-zinc-500">
          {match.facesCount} rostro{match.facesCount === 1 ? "" : "s"}
        </span>
      </div>
    </button>
  );
}

function SelectionBar({
  count,
  total,
  pricePerPhotoHnl,
  whatsapp,
  eventSlug,
  photoIds,
}: {
  count: number;
  total: number;
  pricePerPhotoHnl: number;
  whatsapp: string;
  eventSlug: string;
  photoIds: string[];
}) {
  const [creating, setCreating] = React.useState(false);
  const [orderUrl, setOrderUrl] = React.useState<string | null>(null);
  const [orderError, setOrderError] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");

  const requestOrder = async (provider: "manual_whatsapp" | "clinpays") => {
    if (count === 0 || !name || !phone) return;
    setCreating(true);
    setOrderError(null);
    try {
      const res = await fetch(`/api/events/${eventSlug}/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          customer_whatsapp: phone,
          photo_ids: photoIds,
          payment_provider: provider,
        }),
      });
      const body = (await res.json()) as {
        error?: string;
        whatsapp_url?: string;
        payment_url?: string | null;
      };
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      setOrderUrl(body.payment_url || body.whatsapp_url || null);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "No pudimos crear la orden");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="sticky bottom-3 mt-6 rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-lg backdrop-blur">
      <div className="mb-2 flex items-center gap-2">
        <Badge variant="neutral">Paso 3 · Pedido</Badge>
        <p className="text-xs text-zinc-500">Confirma tus fotos y completa tu compra</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-700">
            {count} foto{count === 1 ? "" : "s"} seleccionada{count === 1 ? "" : "s"}
          </p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums">
            {formatHnl(total)}
          </p>
          <p className="text-xs text-zinc-500">
            Precio por foto: {formatHnl(pricePerPhotoHnl)}
          </p>
        </div>
        <div className="grid w-full gap-2 sm:max-w-md sm:grid-cols-2">
          <input
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <input
            type="tel"
            placeholder="Tu WhatsApp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Button
          disabled={creating || count === 0 || !name || !phone}
          onClick={() => requestOrder("manual_whatsapp")}
          variant="secondary"
        >
          Solicitar por WhatsApp
        </Button>
        <Button
          disabled={creating || count === 0 || !name || !phone}
          onClick={() => requestOrder("clinpays")}
        >
          Pagar online (Clinpays)
        </Button>
      </div>

      {orderError ? (
        <p className="mt-2 text-sm font-medium text-red-700">{orderError}</p>
      ) : null}
      {orderUrl ? (
        <a
          href={orderUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-zinc-950 underline"
        >
          Continuar a la siguiente pantalla <ArrowRightIcon />
        </a>
      ) : null}
      <p className="mt-2 text-[11px] text-zinc-500">
        Pago online via Clinpays (Honduras). El fotógrafo confirma la entrega.{" "}
        <span className="text-zinc-400">WhatsApp: {whatsapp}</span>
      </p>
    </div>
  );
}
