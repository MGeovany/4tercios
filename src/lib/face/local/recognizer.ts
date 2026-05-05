import "server-only";

import * as ort from "onnxruntime-node";

import { ALIGNED_FACE_SIZE } from "./aligner";
import { toCHWFloat32 } from "./preprocess";

export async function embedFace(
  session: ort.InferenceSession,
  alignedRgb: Uint8ClampedArray
): Promise<number[]> {
  const tensorData = toCHWFloat32(
    alignedRgb,
    ALIGNED_FACE_SIZE,
    ALIGNED_FACE_SIZE,
    127.5,
    127.5
  );
  const input = new ort.Tensor("float32", tensorData, [
    1,
    3,
    ALIGNED_FACE_SIZE,
    ALIGNED_FACE_SIZE,
  ]);
  const inputName = session.inputNames[0];
  const output = await session.run({ [inputName]: input });
  const tensor = output[session.outputNames[0]] as ort.Tensor;
  const data = tensor.data as Float32Array;

  // L2 normalise so cosine similarity = dot product.
  let mag = 0;
  for (let i = 0; i < data.length; i++) mag += data[i] * data[i];
  mag = Math.sqrt(mag) || 1;
  const out = new Array<number>(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] / mag;
  return out;
}
