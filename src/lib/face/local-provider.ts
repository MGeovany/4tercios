import "server-only";

import { loadModels } from "./local/models";
import { decodeImage } from "./local/preprocess";
import { detectFaces } from "./local/detector";
import { estimateSimilarity, warpAffineToFace } from "./local/aligner";
import { embedFace } from "./local/recognizer";
import { FACE_EMBEDDING_DIMENSION, type FaceDetection, type FaceProvider } from "./types";

const TARGET_DIM = FACE_EMBEDDING_DIMENSION;

export const localFaceProvider: FaceProvider = {
  name: "local-onnx",
  dimension: TARGET_DIM,

  async detect({ imageUrl }): Promise<FaceDetection[]> {
    const models = await loadModels();
    const buffer = await fetchBytes(imageUrl);
    const image = await decodeImage(buffer);

    const detections = await detectFaces(models.detection, image);
    if (detections.length === 0) return [];

    const out: FaceDetection[] = [];
    for (const det of detections) {
      const affine = estimateSimilarity(det.keypoints);
      const aligned = warpAffineToFace(image, affine);
      const embedding = await embedFace(models.recognition, aligned);
      out.push({
        bbox: {
          x: clamp01(det.bbox.x1 / image.width),
          y: clamp01(det.bbox.y1 / image.height),
          w: clamp01((det.bbox.x2 - det.bbox.x1) / image.width),
          h: clamp01((det.bbox.y2 - det.bbox.y1) / image.height),
        },
        embedding: padTo(embedding, TARGET_DIM),
        quality: det.score,
      });
    }
    return out;
  },

  async embedBestFace(input) {
    const faces = await this.detect(input);
    if (faces.length === 0) return null;
    faces.sort((a, b) => b.quality - a.quality);
    return faces[0];
  },
};

async function fetchBytes(imageUrl: string): Promise<Buffer> {
  const res = await fetch(imageUrl, { redirect: "follow" });
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function padTo(vec: number[], dim: number): number[] {
  if (vec.length === dim) return vec;
  if (vec.length > dim) return vec.slice(0, dim);
  // Pad with zeros — doesn't affect cosine similarity since L2 norm preserved.
  const out = new Array<number>(dim).fill(0);
  for (let i = 0; i < vec.length; i++) out[i] = vec[i];
  return out;
}
