import { createHash } from "node:crypto";

import { FACE_EMBEDDING_DIMENSION, type FaceDetection, type FaceProvider } from "./types";

/**
 * Deterministic mock provider used when REPLICATE_API_TOKEN is missing.
 * Same image URL always yields the same embedding, so the upload + selfie
 * flow can be exercised end-to-end in development without external calls.
 *
 * Not suitable for production: identity is derived from the URL string,
 * not from pixels.
 */
export const mockFaceProvider: FaceProvider = {
  name: "mock",
  dimension: FACE_EMBEDDING_DIMENSION,
  async detect({ imageUrl }) {
    return [makeFakeFace(imageUrl, 0)];
  },
  async embedBestFace({ imageUrl }) {
    return makeFakeFace(imageUrl, 0);
  },
};

function makeFakeFace(seed: string, idx: number): FaceDetection {
  const hash = createHash("sha512").update(`${seed}#${idx}`).digest();
  const dim = FACE_EMBEDDING_DIMENSION;
  const embedding = new Array<number>(dim);
  for (let i = 0; i < dim; i++) {
    const byte = hash[i % hash.length];
    embedding[i] = (byte / 127.5 - 1) * (1 + (i % 5) * 0.001);
  }
  // L2 normalise so cosine similarity matches what real ArcFace produces.
  let mag = 0;
  for (const v of embedding) mag += v * v;
  mag = Math.sqrt(mag) || 1;
  for (let i = 0; i < dim; i++) embedding[i] = embedding[i] / mag;

  return {
    bbox: { x: 0.25, y: 0.2, w: 0.5, h: 0.6 },
    embedding,
    quality: 0.9,
  };
}
