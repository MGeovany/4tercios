import "server-only";

import { mockFaceProvider } from "./mock-provider";
import { createReplicateFaceProvider } from "./replicate-provider";
import { localFaceProvider } from "./local-provider";
import { FACE_EMBEDDING_DIMENSION, type FaceProvider } from "./types";

export type { FaceDetection, FaceProvider, Bbox } from "./types";
export { FACE_EMBEDDING_DIMENSION };

let cached: FaceProvider | null = null;

export function getFaceProvider(): FaceProvider {
  if (cached) return cached;
  cached = pickProvider();
  return cached;
}

function pickProvider(): FaceProvider {
  // Explicit override always wins.
  const explicit = (process.env.LENSIA_FACE_PROVIDER || "").toLowerCase();
  if (explicit === "local") return localFaceProvider;
  if (explicit === "mock") return mockFaceProvider;
  if (explicit === "replicate") return makeReplicateOrThrow();

  // Auto-select.
  const apiToken = process.env.REPLICATE_API_TOKEN;
  const model = process.env.REPLICATE_FACE_MODEL;
  if (apiToken && model) {
    const provider = makeReplicateProvider({ apiToken, model });
    if (provider) return provider;
  }

  // Default: run InsightFace locally via onnxruntime. Free, no API key.
  return localFaceProvider;
}

function makeReplicateOrThrow(): FaceProvider {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  const model = process.env.REPLICATE_FACE_MODEL;
  if (!apiToken || !model) {
    throw new Error(
      "LENSIA_FACE_PROVIDER=replicate requires REPLICATE_API_TOKEN and REPLICATE_FACE_MODEL"
    );
  }
  const provider = makeReplicateProvider({ apiToken, model });
  if (!provider) throw new Error(`Invalid REPLICATE_FACE_MODEL: ${model}`);
  return provider;
}

function makeReplicateProvider(opts: { apiToken: string; model: string }): FaceProvider | null {
  if (!/^[\w.-]+\/[\w.-]+(:[\w.-]+)?$/.test(opts.model)) {
    console.warn(`[face] Invalid REPLICATE_FACE_MODEL "${opts.model}" — falling back to local.`);
    return null;
  }
  return createReplicateFaceProvider({
    apiToken: opts.apiToken,
    model: opts.model as `${string}/${string}` | `${string}/${string}:${string}`,
    dimension: Number(process.env.REPLICATE_FACE_DIMENSION) || FACE_EMBEDDING_DIMENSION,
  });
}

/** Convert the embedding into the literal pgvector input format: '[0.1,0.2,...]'. */
export function toPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
