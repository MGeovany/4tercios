import "server-only";

import { mkdir, writeFile, access, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as ort from "onnxruntime-node";

const DEFAULT_DETECTION_URL =
  "https://huggingface.co/immich-app/buffalo_s/resolve/main/detection/model.onnx";
const DEFAULT_RECOGNITION_URL =
  "https://huggingface.co/immich-app/buffalo_s/resolve/main/recognition/model.onnx";

export type LoadedModels = {
  detection: ort.InferenceSession;
  recognition: ort.InferenceSession;
};

let cached: Promise<LoadedModels> | null = null;

export function loadModels(): Promise<LoadedModels> {
  if (cached) return cached;
  cached = (async () => {
    const cacheDir = nonEmptyEnv("FACE_MODELS_DIR") ?? join(tmpdir(), "4tercios-face-models");
    await mkdir(cacheDir, { recursive: true });

    const detectionPath = join(cacheDir, "detection.onnx");
    const recognitionPath = join(cacheDir, "recognition.onnx");

    await Promise.all([
      ensureFile(detectionPath, nonEmptyEnv("FACE_DETECTION_URL") ?? DEFAULT_DETECTION_URL),
      ensureFile(recognitionPath, nonEmptyEnv("FACE_RECOGNITION_URL") ?? DEFAULT_RECOGNITION_URL),
    ]);

    const sessionOpts: ort.InferenceSession.SessionOptions = {
      executionProviders: ["cpu"],
      graphOptimizationLevel: "all",
    };

    const [detection, recognition] = await Promise.all([
      ort.InferenceSession.create(detectionPath, sessionOpts),
      ort.InferenceSession.create(recognitionPath, sessionOpts),
    ]);

    return { detection, recognition };
  })().catch((err) => {
    cached = null;
    throw err;
  });

  return cached;
}

function nonEmptyEnv(name: string) {
  const raw = process.env[name];
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}

async function ensureFile(path: string, url: string) {
  try {
    const info = await stat(path);
    if (info.size > 1024) return; // already cached
  } catch {
    // not present, fall through to download
  }
  await access(path).catch(async () => {
    // ignore — handled below
  });

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 1024) {
    throw new Error(`Downloaded file ${url} is suspiciously small (${buf.byteLength} bytes)`);
  }
  await writeFile(path, buf);
}
