import "server-only";

import { mockFaceProvider } from "./mock-provider";
import { createReplicateFaceProvider } from "./replicate-provider";
import { FACE_EMBEDDING_DIMENSION, type FaceProvider } from "./types";

export type { FaceDetection, FaceProvider, Bbox } from "./types";
export { FACE_EMBEDDING_DIMENSION };

let cached: FaceProvider | null = null;

export function getFaceProvider(): FaceProvider {
  if (cached) return cached;

  const apiToken = process.env.REPLICATE_API_TOKEN;
  const model = process.env.REPLICATE_FACE_MODEL;

  if (apiToken && model && /^[\w.-]+\/[\w.-]+(:[\w.-]+)?$/.test(model)) {
    cached = createReplicateFaceProvider({
      apiToken,
      model: model as `${string}/${string}` | `${string}/${string}:${string}`,
      dimension: Number(process.env.REPLICATE_FACE_DIMENSION) || FACE_EMBEDDING_DIMENSION,
    });
  } else {
    if (apiToken && !model) {
      console.warn(
        "[face] REPLICATE_API_TOKEN set but REPLICATE_FACE_MODEL missing — using mock provider."
      );
    }
    cached = mockFaceProvider;
  }
  return cached;
}

/** Convert the embedding into the literal pgvector input format: '[0.1,0.2,...]'. */
export function toPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
