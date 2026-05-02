"use client";

import * as React from "react";
import { UploadIcon } from "@radix-ui/react-icons";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { runWithConcurrency } from "@/lib/upload/concurrency";
import { STORAGE_BUCKETS } from "@/lib/storage/paths";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type UploadStage = "queued" | "uploading" | "processing" | "ready" | "error";

type Item = {
  localId: string;
  file: File;
  stage: UploadStage;
  progress: number;
  faces: number;
  photoId?: string;
  error?: string;
};

type UploaderProps = {
  eventId: string;
  onPhotoReady?: (photoId: string) => void;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic";
const MAX_BYTES = 25 * 1024 * 1024;
const CONCURRENCY = 4;

export function PhotoUploader({ eventId, onPhotoReady }: UploaderProps) {
  const [items, setItems] = React.useState<Item[]>([]);
  const [running, setRunning] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const update = React.useCallback((localId: string, patch: Partial<Item>) => {
    setItems((cur) => cur.map((i) => (i.localId === localId ? { ...i, ...patch } : i)));
  }, []);

  const start = React.useCallback(
    async (queue: Item[]) => {
      setRunning(true);
      try {
        const supabase = getSupabaseBrowserClient();

        // Ensure we have an authenticated session before attempting Storage uploads.
        // Without a session, uploads hit Storage as anon and will fail RLS.
        const session = await ensureUploadSession(supabase);
        if (!session) {
          throw new Error("Sesión no encontrada. Vuelve a iniciar sesión para subir fotos.");
        }

        await runWithConcurrency(queue, CONCURRENCY, async (item) => {
          try {
            update(item.localId, { stage: "uploading", progress: 5 });

            const registerRes = await fetch("/api/photos", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                event_id: eventId,
                filename: item.file.name,
                bytes: item.file.size,
              }),
            });
            if (!registerRes.ok) {
              const { error } = await safeJson(registerRes);
              throw new Error(error || `Register failed: ${registerRes.status}`);
            }
            const { photo, path, upload_token } = (await registerRes.json()) as {
              upload_token: string;
              photo: { id: string };
              bucket: string;
              path: string;
            };

            update(item.localId, { photoId: photo.id, progress: 15 });

            const uploadError = await uploadOriginalWithSignedUrl(
              supabase,
              path,
              item.file,
              upload_token
            );
            if (uploadError) {
              throw new Error(uploadError.message);
            }

            update(item.localId, { stage: "processing", progress: 60 });

            const procRes = await fetch(`/api/photos/${photo.id}/process`, {
              method: "POST",
            });
            if (!procRes.ok) {
              const { error } = await safeJson(procRes);
              throw new Error(error || `Processing failed: ${procRes.status}`);
            }
            const procBody = (await procRes.json()) as {
              photo: { id: string; faces_count: number; thumb_path: string | null };
            };

            update(item.localId, {
              stage: "ready",
              progress: 100,
              faces: procBody.photo.faces_count,
            });

            onPhotoReady?.(procBody.photo.id);
            return procBody.photo;
          } catch (err) {
            const message = err instanceof Error ? err.message : "Error desconocido";
            update(item.localId, { stage: "error", error: message });
            throw err;
          }
        });
      } finally {
        setRunning(false);
      }
    },
    [eventId, onPhotoReady, update]
  );

  const enqueue = React.useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.size > 0 && f.size <= MAX_BYTES);
      if (list.length === 0) return;
      const next: Item[] = list.map((file) => ({
        localId: crypto.randomUUID(),
        file,
        stage: "queued",
        progress: 0,
        faces: 0,
      }));
      setItems((cur) => [...next, ...cur]);
      void start(next);
    },
    [start]
  );

  const reset = React.useCallback(() => setItems([]), []);

  const totals = React.useMemo(() => {
    const ready = items.filter((i) => i.stage === "ready").length;
    const errored = items.filter((i) => i.stage === "error").length;
    const faces = items.reduce((acc, i) => acc + i.faces, 0);
    const overall =
      items.length === 0
        ? 0
        : Math.round(items.reduce((acc, i) => acc + i.progress, 0) / items.length);
    return { ready, errored, faces, overall };
  }, [items]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) enqueue(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-3xl border border-dashed p-6 text-center transition sm:p-10",
          dragOver ? "border-zinc-500 bg-zinc-100" : "border-zinc-300 bg-zinc-50"
        )}
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700">
          <UploadIcon />
        </div>
        <p className="mt-4 text-sm font-medium text-zinc-950">Arrastra y suelta tus fotos</p>
        <p className="mt-1 text-sm text-zinc-700">
          JPG, PNG, WEBP o HEIC. Máximo 25MB por foto. Suben en paralelo.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                enqueue(e.target.files);
                e.target.value = "";
              }
            }}
          />
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={running}
            className="w-full sm:w-auto"
          >
            Seleccionar fotos
          </Button>
          {items.length > 0 ? (
            <Button
              variant="secondary"
              onClick={reset}
              disabled={running}
              className="w-full sm:w-auto"
            >
              Limpiar lista
            </Button>
          ) : null}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex flex-col items-start gap-1 border-b border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-zinc-950">
              {items.length} foto{items.length === 1 ? "" : "s"} en cola
            </p>
            <p className="text-xs text-zinc-500">
              {totals.ready} listas · {totals.errored} con errores · {totals.faces} rostros
            </p>
          </div>
          <div className="px-4 py-3">
            <Progress value={totals.overall} />
            <p className="mt-2 text-xs text-zinc-500">{totals.overall}% completado</p>
          </div>
          <ul className="max-h-72 divide-y divide-zinc-100 overflow-auto sm:max-h-80">
            {items.map((item) => (
              <li
                key={item.localId}
                className="flex items-start gap-3 px-4 py-2.5 text-sm sm:items-center"
              >
                <StageIcon stage={item.stage} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-950">{item.file.name}</p>
                  <p className="text-xs wrap-break-word text-zinc-500">
                    {(item.file.size / 1024 / 1024).toFixed(1)} MB · {stageLabel(item.stage)}
                    {item.stage === "ready" ? ` · ${item.faces} rostros` : null}
                    {item.error ? ` · ${item.error}` : null}
                  </p>
                  <div className="mt-2 sm:hidden">
                    <Progress value={item.progress} />
                  </div>
                </div>
                <div className="hidden w-32 sm:block">
                  <Progress value={item.progress} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function safeJson(res: Response): Promise<{ error?: string }> {
  return res.json().catch(() => ({}));
}

async function ensureUploadSession(supabase: ReturnType<typeof getSupabaseBrowserClient>) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (error) {
    // Keep the current session if refresh fails transiently.
    return data.session;
  }
  return refreshed.session ?? data.session;
}

async function uploadOriginalWithSignedUrl(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
  path: string,
  file: File,
  token: string
) {
  if (!token) return { message: "Missing signed upload token" } as { message: string };

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const uploaded = await supabase.storage
      .from(STORAGE_BUCKETS.originals)
      .uploadToSignedUrl(path, token, file, {
        contentType: file.type || "image/jpeg",
        cacheControl: "31536000",
        upsert: false,
      });

    if (!uploaded.error) return null;

    const status = (uploaded.error as unknown as { statusCode?: number }).statusCode;
    const transient =
      status != null ? status >= 500 : /timeout|network|fetch/i.test(uploaded.error.message);
    if (!transient || attempt === maxAttempts) return uploaded.error;

    await new Promise((r) => setTimeout(r, 500 * attempt * attempt));
  }

  return { message: "Upload failed" } as { message: string };
}

function stageLabel(stage: UploadStage) {
  switch (stage) {
    case "queued":
      return "En cola";
    case "uploading":
      return "Subiendo";
    case "processing":
      return "Detectando rostros";
    case "ready":
      return "Lista";
    case "error":
      return "Error";
  }
}

function StageIcon({ stage }: { stage: UploadStage }) {
  const cls = "grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold";
  switch (stage) {
    case "ready":
      return <span className={cn(cls, "bg-emerald-50 text-emerald-700")}>OK</span>;
    case "error":
      return <span className={cn(cls, "bg-red-50 text-red-700")}>ER</span>;
    case "processing":
      return <span className={cn(cls, "bg-amber-50 text-amber-700")}>IA</span>;
    case "uploading":
      return <span className={cn(cls, "bg-sky-50 text-sky-700")}>UL</span>;
    default:
      return <span className={cn(cls, "bg-zinc-100 text-zinc-700")}>·</span>;
  }
}
