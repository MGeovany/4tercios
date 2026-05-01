"use client";

import * as React from "react";
import { CameraIcon, ReloadIcon, UploadIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SelfieResult = {
  blob: Blob;
  previewUrl: string;
};

type Props = {
  onCapture: (result: SelfieResult) => void;
  busy?: boolean;
};

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: "user",
    width: { ideal: 1280 },
    height: { ideal: 1280 },
  },
};

export function SelfieCapture({ onCapture, busy }: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const stopCamera = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  React.useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = React.useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Cámara no disponible en este navegador");
      }
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      setStreaming(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos abrir la cámara";
      setError(message);
      setStreaming(false);
    }
  }, []);

  const takeSnapshot = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 720;
    const h = video.videoHeight || 720;
    if (!w || !h) return;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror to match what user sees in the preview (cosmetic).
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        onCapture({ blob, previewUrl });
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  }, [onCapture, stopCamera]);

  const handleFile = React.useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      onCapture({ blob: file, previewUrl: url });
    },
    [onCapture]
  );

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950">
        {streaming ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full -scale-x-100 object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-100 text-zinc-700">
            <CameraIcon className="h-7 w-7" />
            <p className="text-sm">Activa tu cámara o sube una selfie</p>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10 ring-inset" />
      </div>

      {error ? <p className={cn("text-sm font-medium text-red-700")}>{error}</p> : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {streaming ? (
          <>
            <Button onClick={takeSnapshot} disabled={busy} size="lg">
              <CameraIcon /> Tomar selfie
            </Button>
            <Button onClick={stopCamera} disabled={busy} variant="secondary" size="lg">
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button onClick={startCamera} disabled={busy} size="lg">
              <CameraIcon /> Abrir cámara
            </Button>
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              variant="secondary"
              size="lg"
            >
              <UploadIcon /> Subir foto
            </Button>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <p className="rounded-lg bg-zinc-50 px-2.5 py-2 text-xs text-zinc-500">
        <ReloadIcon className="mr-1 inline h-3 w-3" />
        Tu selfie se elimina al terminar la búsqueda. No guardamos datos biométricos.
      </p>
    </div>
  );
}
