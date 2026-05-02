import "server-only";

import * as ort from "onnxruntime-node";

import { letterbox, toCHWFloat32, type RawImage } from "./preprocess";

const INPUT_SIZE = 640;
const SCORE_THRESHOLD = 0.5;
const NMS_THRESHOLD = 0.4;
const STRIDES = [8, 16, 32] as const;
const NUM_ANCHORS = 2; // SCRFD-500MF uses 2 anchors per location

export type DetectedFace = {
  bbox: { x1: number; y1: number; x2: number; y2: number }; // pixel coords on original image
  score: number;
  keypoints: Array<{ x: number; y: number }>; // 5 keypoints (eyes, nose, mouth corners)
};

const anchorCache = new Map<string, Float32Array>();

function getAnchorCenters(height: number, width: number, stride: number): Float32Array {
  const key = `${height}x${width}x${stride}`;
  const cached = anchorCache.get(key);
  if (cached) return cached;

  const centers = new Float32Array(height * width * NUM_ANCHORS * 2);
  let idx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cx = x * stride;
      const cy = y * stride;
      for (let a = 0; a < NUM_ANCHORS; a++) {
        centers[idx++] = cx;
        centers[idx++] = cy;
      }
    }
  }
  anchorCache.set(key, centers);
  return centers;
}

export async function detectFaces(
  session: ort.InferenceSession,
  image: RawImage
): Promise<DetectedFace[]> {
  const { data: padded, scale } = letterbox(image, INPUT_SIZE);
  const tensorData = toCHWFloat32(padded, INPUT_SIZE, INPUT_SIZE, 127.5, 128);
  const input = new ort.Tensor("float32", tensorData, [1, 3, INPUT_SIZE, INPUT_SIZE]);

  const inputName = session.inputNames[0];
  const outputs = await session.run({ [inputName]: input });

  // Output naming convention from SCRFD ONNX export:
  //   indices 0..2  → scores at strides 8/16/32
  //   indices 3..5  → bbox preds at strides 8/16/32
  //   indices 6..8  → keypoint preds at strides 8/16/32
  const outNames = session.outputNames;
  if (outNames.length < 9) {
    throw new Error(`Unexpected SCRFD output count: ${outNames.length}`);
  }

  const detections: DetectedFace[] = [];

  for (let s = 0; s < STRIDES.length; s++) {
    const stride = STRIDES[s];
    const scores = outputs[outNames[s]] as ort.Tensor;
    const bboxPreds = outputs[outNames[s + 3]] as ort.Tensor;
    const kpsPreds = outputs[outNames[s + 6]] as ort.Tensor;

    const scoreData = scores.data as Float32Array;
    const bboxData = bboxPreds.data as Float32Array;
    const kpsData = kpsPreds.data as Float32Array;

    const fmHeight = Math.ceil(INPUT_SIZE / stride);
    const fmWidth = Math.ceil(INPUT_SIZE / stride);
    const numAnchors = fmHeight * fmWidth * NUM_ANCHORS;
    const centers = getAnchorCenters(fmHeight, fmWidth, stride);

    for (let i = 0; i < numAnchors; i++) {
      const score = scoreData[i];
      if (score < SCORE_THRESHOLD) continue;

      const cx = centers[i * 2];
      const cy = centers[i * 2 + 1];

      const dx1 = bboxData[i * 4] * stride;
      const dy1 = bboxData[i * 4 + 1] * stride;
      const dx2 = bboxData[i * 4 + 2] * stride;
      const dy2 = bboxData[i * 4 + 3] * stride;

      // distance2bbox: (cx-dx1, cy-dy1, cx+dx2, cy+dy2) on padded image
      const x1 = (cx - dx1) / scale;
      const y1 = (cy - dy1) / scale;
      const x2 = (cx + dx2) / scale;
      const y2 = (cy + dy2) / scale;

      // 5 keypoints
      const kp: Array<{ x: number; y: number }> = [];
      for (let k = 0; k < 5; k++) {
        const kx = (cx + kpsData[i * 10 + k * 2] * stride) / scale;
        const ky = (cy + kpsData[i * 10 + k * 2 + 1] * stride) / scale;
        kp.push({ x: kx, y: ky });
      }

      detections.push({ bbox: { x1, y1, x2, y2 }, score, keypoints: kp });
    }
  }

  return nms(detections, NMS_THRESHOLD);
}

function nms(detections: DetectedFace[], threshold: number): DetectedFace[] {
  if (detections.length <= 1) return detections;
  const sorted = detections.slice().sort((a, b) => b.score - a.score);
  const keep: DetectedFace[] = [];
  const suppressed = new Array(sorted.length).fill(false);

  for (let i = 0; i < sorted.length; i++) {
    if (suppressed[i]) continue;
    keep.push(sorted[i]);
    for (let j = i + 1; j < sorted.length; j++) {
      if (suppressed[j]) continue;
      if (iou(sorted[i].bbox, sorted[j].bbox) > threshold) {
        suppressed[j] = true;
      }
    }
  }
  return keep;
}

function iou(a: DetectedFace["bbox"], b: DetectedFace["bbox"]) {
  const x1 = Math.max(a.x1, b.x1);
  const y1 = Math.max(a.y1, b.y1);
  const x2 = Math.min(a.x2, b.x2);
  const y2 = Math.min(a.y2, b.y2);
  const w = Math.max(0, x2 - x1);
  const h = Math.max(0, y2 - y1);
  const inter = w * h;
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  return inter / (areaA + areaB - inter + 1e-9);
}
