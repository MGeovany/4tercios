import "server-only";

import sharp from "sharp";

export type RawImage = {
  data: Uint8ClampedArray; // RGB888
  width: number;
  height: number;
};

/** Decode arbitrary input (JPEG/PNG/WebP/HEIC) to a raw RGB buffer. */
export async function decodeImage(input: Buffer | ArrayBuffer | Uint8Array): Promise<RawImage> {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input as Uint8Array);
  const { data, info } = await sharp(buf, { failOn: "none" })
    .rotate()
    .removeAlpha()
    .toColorspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
  };
}

/**
 * Resize keeping aspect ratio, then pad to (target, target) with black.
 * Matches the SCRFD reference preprocessing: square pad to top-left.
 */
export function letterbox(
  src: RawImage,
  target: number
): { data: Uint8ClampedArray; scale: number; padX: number; padY: number } {
  const ratio = Math.min(target / src.width, target / src.height);
  const newW = Math.round(src.width * ratio);
  const newH = Math.round(src.height * ratio);

  const out = new Uint8ClampedArray(target * target * 3);
  // Fast nearest-neighbour resize in JS — good enough for 640px input.
  for (let y = 0; y < newH; y++) {
    const sy = Math.min(src.height - 1, Math.floor(y / ratio));
    for (let x = 0; x < newW; x++) {
      const sx = Math.min(src.width - 1, Math.floor(x / ratio));
      const srcIdx = (sy * src.width + sx) * 3;
      const dstIdx = (y * target + x) * 3;
      out[dstIdx] = src.data[srcIdx];
      out[dstIdx + 1] = src.data[srcIdx + 1];
      out[dstIdx + 2] = src.data[srcIdx + 2];
    }
  }
  return { data: out, scale: ratio, padX: 0, padY: 0 };
}

/** Convert HWC RGB Uint8 → CHW float32 normalised: (x - mean) / std. */
export function toCHWFloat32(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  mean: number,
  std: number
): Float32Array {
  const out = new Float32Array(3 * width * height);
  const plane = width * height;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 3;
      const dstIdx = y * width + x;
      out[dstIdx] = (data[srcIdx] - mean) / std;
      out[plane + dstIdx] = (data[srcIdx + 1] - mean) / std;
      out[2 * plane + dstIdx] = (data[srcIdx + 2] - mean) / std;
    }
  }
  return out;
}
