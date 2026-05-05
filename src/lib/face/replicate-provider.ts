import Replicate from "replicate";

import {
  FACE_EMBEDDING_DIMENSION,
  type Bbox,
  type FaceDetection,
  type FaceProvider,
} from "./types";

/**
 * Replicate-backed face provider.
 *
 * Configurable via env:
 *   REPLICATE_API_TOKEN     required
 *   REPLICATE_FACE_MODEL    e.g. "owner/name" or "owner/name:version-hash"
 *
 * Replicate face models do not share a single response shape, so the parser
 * accepts the most common variants:
 *   1. Array of { bbox|box: [x1,y1,x2,y2] | {x,y,w,h}, embedding|embeddings|features|vector: number[], score|confidence|quality? }
 *   2. { faces: [...] }
 *   3. { detections: [...] }
 *   4. Single object with { embedding, bbox, ... } (selfie path)
 *
 * If the model returns pixel-space bboxes, pass `image_width` / `image_height`
 * via the model output so we can normalise — otherwise we assume already
 * normalised 0..1.
 */
export function createReplicateFaceProvider(opts: {
  apiToken: string;
  model: `${string}/${string}` | `${string}/${string}:${string}`;
  dimension?: number;
}): FaceProvider {
  const replicate = new Replicate({ auth: opts.apiToken });
  const dimension = opts.dimension ?? FACE_EMBEDDING_DIMENSION;

  async function run(imageUrl: string, signal?: AbortSignal) {
    const output = await replicate.run(opts.model, {
      input: { image: imageUrl },
      signal,
    });
    return parseModelOutput(output, dimension);
  }

  return {
    name: `replicate:${opts.model}`,
    dimension,
    async detect({ imageUrl, signal }) {
      return run(imageUrl, signal);
    },
    async embedBestFace({ imageUrl, signal }) {
      const faces = await run(imageUrl, signal);
      if (faces.length === 0) return null;
      faces.sort((a, b) => b.quality - a.quality);
      return faces[0];
    },
  };
}

function parseModelOutput(output: unknown, dim: number): FaceDetection[] {
  const candidates = collectCandidates(output);
  const faces: FaceDetection[] = [];
  let imageW: number | undefined;
  let imageH: number | undefined;

  if (output && typeof output === "object") {
    const o = output as Record<string, unknown>;
    if (typeof o.image_width === "number") imageW = o.image_width;
    if (typeof o.image_height === "number") imageH = o.image_height;
    if (typeof o.width === "number") imageW = o.width;
    if (typeof o.height === "number") imageH = o.height;
  }

  for (const item of candidates) {
    const face = parseFace(item, dim, imageW, imageH);
    if (face) faces.push(face);
  }
  return faces;
}

function collectCandidates(output: unknown): unknown[] {
  if (!output) return [];
  if (Array.isArray(output)) return output;
  if (typeof output !== "object") return [];
  const o = output as Record<string, unknown>;
  for (const key of ["faces", "detections", "results", "output"] as const) {
    const val = o[key];
    if (Array.isArray(val)) return val;
  }
  // Single-face object (selfie embedding endpoints).
  if ("embedding" in o || "embeddings" in o || "features" in o || "vector" in o) {
    return [o];
  }
  return [];
}

function parseFace(
  raw: unknown,
  dim: number,
  imageW: number | undefined,
  imageH: number | undefined
): FaceDetection | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const embeddingRaw =
    r.embedding ?? r.embeddings ?? r.features ?? r.vector ?? r.descriptor;
  const embedding = toNumberArray(embeddingRaw);
  if (!embedding || embedding.length === 0) return null;
  // Some providers return 128-d, 192-d or 512-d. Truncate or pad to expected dim.
  const normalisedEmbedding = normaliseEmbedding(embedding, dim);

  const bbox = parseBbox(r, imageW, imageH) ?? { x: 0, y: 0, w: 1, h: 1 };
  const quality = toNumber(r.score ?? r.confidence ?? r.quality ?? r.det_score) ?? 0.9;

  return { bbox, embedding: normalisedEmbedding, quality };
}

function parseBbox(
  r: Record<string, unknown>,
  imageW: number | undefined,
  imageH: number | undefined
): Bbox | null {
  const candidate = r.bbox ?? r.box ?? r.bounding_box ?? r.face_box;
  if (!candidate) return null;

  if (Array.isArray(candidate) && candidate.length >= 4) {
    const [a, b, c, d] = candidate.map((v) => Number(v));
    if ([a, b, c, d].some((n) => !Number.isFinite(n))) return null;
    // Heuristic: 4 numbers are typically [x1,y1,x2,y2] in pixels.
    const isNormalised = [a, b, c, d].every((n) => n >= 0 && n <= 1);
    if (isNormalised) {
      return { x: a, y: b, w: Math.max(0, c - a), h: Math.max(0, d - b) };
    }
    if (imageW && imageH) {
      return {
        x: a / imageW,
        y: b / imageH,
        w: Math.max(0, (c - a) / imageW),
        h: Math.max(0, (d - b) / imageH),
      };
    }
    // Pixel bbox without size hint: store as-is; consumer can convert later.
    return { x: a, y: b, w: c - a, h: d - b };
  }

  if (typeof candidate === "object") {
    const c = candidate as Record<string, unknown>;
    const x = toNumber(c.x);
    const y = toNumber(c.y);
    const w = toNumber(c.w ?? c.width);
    const h = toNumber(c.h ?? c.height);
    if (x == null || y == null || w == null || h == null) return null;
    const isNormalised = x <= 1 && y <= 1 && w <= 1 && h <= 1;
    if (isNormalised) return { x, y, w, h };
    if (imageW && imageH) {
      return { x: x / imageW, y: y / imageH, w: w / imageW, h: h / imageH };
    }
    return { x, y, w, h };
  }

  return null;
}

function toNumberArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const out: number[] = new Array(value.length);
  for (let i = 0; i < value.length; i++) {
    const n = Number(value[i]);
    if (!Number.isFinite(n)) return null;
    out[i] = n;
  }
  return out;
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normaliseEmbedding(embedding: number[], dim: number): number[] {
  let v = embedding;
  if (v.length !== dim) {
    if (v.length > dim) v = v.slice(0, dim);
    else v = [...v, ...new Array(dim - v.length).fill(0)];
  }
  let mag = 0;
  for (const x of v) mag += x * x;
  mag = Math.sqrt(mag) || 1;
  return v.map((x) => x / mag);
}
