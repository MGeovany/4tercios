"use client";

import * as React from "react";
import { Cross2Icon, UploadIcon } from "@radix-ui/react-icons";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { runWithConcurrency } from "@/lib/upload/concurrency";
import { STORAGE_BUCKETS } from "@/lib/storage/paths";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type UploadStage = "queued" | "uploading" | "processing" | "ready" | "error" | "canceled";

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
  const controllersRef = React.useRef<Map<string, AbortController>>(new Map());
  const canceledIdsRef = React.useRef<Set<string>>(new Set());
  const activeBatchesRef = React.useRef(0);

  const update = React.useCallback((localId: string, patch: Partial<Item>) => {
    setItems((cur) => cur.map((i) => (i.localId === localId ? { ...i, ...patch } : i)));
  }, []);

  const isTerminal = React.useCallback(
    (stage: UploadStage) =>
      stage === "ready" || stage === "error" || stage === "canceled",
    []
  );

  const isCanceled = React.useCallback((localId: string) => {
    return canceledIdsRef.current.has(localId);
  }, []);

  const cleanupRegisteredPhoto = React.useCallback(async (photoId?: string) => {
    if (!photoId) return;
    await fetch(`/api/photos/${photoId}`, { method: "DELETE" }).catch(() => {});
  }, []);

  const cancelItem = React.useCallback(
    (localId: string) => {
      canceledIdsRef.current.add(localId);
      const controller = controllersRef.current.get(localId);
      controller?.abort();
      update(localId, {
        stage: "canceled",
        progress: 100,
        error: "Cancelada por el usuario",
      });
    },
    [update]
  );

  const cancelAll = React.useCallback(() => {
    items
      .filter((item) => !isTerminal(item.stage))
      .forEach((item) => {
        cancelItem(item.localId);
      });
  }, [cancelItem, isTerminal, items]);

  const start = React.useCallback(
    async (queue: Item[]) => {
      activeBatchesRef.current += 1;
      setRunning(true);
      try {
        const supabase = getSupabaseBrowserClient();

        // Ensure we have an authenticated session before attempting Storage uploads.
        // Without a session, uploads hit Storage as anon and will fail RLS.
        const session = await ensureUploadSession(supabase);
        if (!session) {
          throw new Error(
            "Sesión no encontrada. Vuelve a iniciar sesión para subir fotos."
          );
        }

        await runWithConcurrency(queue, CONCURRENCY, async (item) => {
          const controller = new AbortController();
          controllersRef.current.set(item.localId, controller);
          let currentPhotoId: string | undefined;

          try {
            if (isCanceled(item.localId)) return null;
            update(item.localId, { stage: "uploading", progress: 5 });

            const registerRes = await fetch("/api/photos", {
              method: "POST",
              headers: { "content-type": "application/json" },
              signal: controller.signal,
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

            currentPhotoId = photo.id;
            update(item.localId, { photoId: photo.id, progress: 15 });

            if (isCanceled(item.localId)) {
              await cleanupRegisteredPhoto(photo.id);
              return null;
            }

            const uploadError = await uploadOriginalWithSignedUrl(
              supabase,
              path,
              item.file,
              upload_token
            );
            if (uploadError) {
              throw new Error(uploadError.message);
            }

            if (isCanceled(item.localId)) {
              await cleanupRegisteredPhoto(photo.id);
              return null;
            }

            update(item.localId, { stage: "processing", progress: 60 });

            const procRes = await fetch(`/api/photos/${photo.id}/process`, {
              method: "POST",
              signal: controller.signal,
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
            if (isAbortError(err) || isCanceled(item.localId)) {
              await cleanupRegisteredPhoto(currentPhotoId);
              update(item.localId, {
                stage: "canceled",
                progress: 100,
                error: "Cancelada por el usuario",
              });
              return null;
            }
            const message = err instanceof Error ? err.message : "Error desconocido";
            update(item.localId, { stage: "error", error: message });
            throw err;
          } finally {
            controllersRef.current.delete(item.localId);
          }
        });
      } finally {
        activeBatchesRef.current = Math.max(0, activeBatchesRef.current - 1);
        if (activeBatchesRef.current === 0) {
          setRunning(false);
        }
      }
    },
    [cleanupRegisteredPhoto, eventId, isCanceled, onPhotoReady, update]
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

  const reset = React.useCallback(() => {
    cancelAll();
    setItems([]);
  }, [cancelAll]);

  const totals = React.useMemo(() => {
    const ready = items.filter((i) => i.stage === "ready").length;
    const errored = items.filter((i) => i.stage === "error").length;
    const canceled = items.filter((i) => i.stage === "canceled").length;
    const active = items.filter((i) => !isTerminal(i.stage)).length;
    const faces = items.reduce((acc, i) => acc + i.faces, 0);
    const overall =
      items.length === 0
        ? 0
        : Math.round(items.reduce((acc, i) => acc + i.progress, 0) / items.length);
    return { ready, errored, canceled, active, faces, overall };
  }, [isTerminal, items]);

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
        <p className="mt-4 text-sm font-medium text-zinc-950">
          Arrastra y suelta tus fotos
        </p>
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
            disabled={false}
            className="w-full sm:w-auto"
          >
            Seleccionar fotos
          </Button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-4 py-3">
            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-zinc-950">
                {items.length} foto{items.length === 1 ? "" : "s"} en cola
              </p>
              <p className="text-xs text-zinc-500">
                {totals.ready} listas · {totals.errored} con errores · {totals.canceled}{" "}
                canceladas · {totals.faces} rostros
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {running ? (
                <Button
                  variant="outline"
                  onClick={cancelAll}
                  className="h-8 border-red-200 px-3 text-xs text-red-700 hover:bg-red-50"
                >
                  <Cross2Icon />
                  Cancelar subidas
                </Button>
              ) : null}
              <Button
                variant="secondary"
                onClick={reset}
                disabled={running}
                className="h-8 px-3 text-xs"
              >
                Limpiar lista
              </Button>
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-700">
                {running ? `${totals.active} subiendo ahora` : "Carga finalizada"}
              </p>
              <p className="text-xs font-semibold text-emerald-700">{totals.overall}%</p>
            </div>
            <Progress
              value={totals.overall}
              className="h-3 rounded-full bg-linear-to-r from-emerald-100 to-green-100"
              indicatorClassName="bg-linear-to-r from-emerald-500 via-green-500 to-emerald-600 shadow-[0_0_18px_rgba(16,185,129,0.45)]"
            />
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
                    {(item.file.size / 1024 / 1024).toFixed(1)} MB ·{" "}
                    {stageLabel(item.stage)}
                    {item.stage === "ready" ? ` · ${item.faces} rostros` : null}
                    {item.error ? ` · ${item.error}` : null}
                  </p>
                  <div className="mt-2 sm:hidden">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={item.progress}
                        className="h-2.5 rounded-full bg-emerald-100/70"
                        indicatorClassName="bg-linear-to-r from-emerald-500 to-green-500"
                      />
                      <span className="text-[11px] font-medium text-zinc-500 tabular-nums">
                        {item.progress}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="hidden w-40 items-center gap-2 sm:flex">
                  <Progress
                    value={item.progress}
                    className="h-2.5 rounded-full bg-emerald-100/70"
                    indicatorClassName="bg-linear-to-r from-emerald-500 to-green-500"
                  />
                  <span className="text-[11px] font-medium text-zinc-500 tabular-nums">
                    {item.progress}%
                  </span>
                </div>
                {!isTerminal(item.stage) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-red-700 hover:bg-red-50 hover:text-red-800"
                    onClick={() => cancelItem(item.localId)}
                  >
                    <Cross2Icon />
                    Cancelar
                  </Button>
                ) : null}
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

async function ensureUploadSession(
  supabase: ReturnType<typeof getSupabaseBrowserClient>
) {
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
      status != null
        ? status >= 500
        : /timeout|network|fetch/i.test(uploaded.error.message);
    if (!transient || attempt === maxAttempts) return uploaded.error;

    await new Promise((r) => setTimeout(r, 500 * attempt * attempt));
  }

  return { message: "Upload failed" } as { message: string };
}

function isAbortError(err: unknown) {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof Error && err.name === "AbortError") return true;
  return false;
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
    case "canceled":
      return "Cancelada";
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
    case "canceled":
      return <span className={cn(cls, "bg-zinc-100 text-zinc-700")}>CA</span>;
    default:
      return <span className={cn(cls, "bg-zinc-100 text-zinc-700")}>·</span>;
  }
}
