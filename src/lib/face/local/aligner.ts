import "server-only";

import type { RawImage } from "./preprocess";

// Standard ArcFace 5-point reference for 112x112 aligned faces.
const REF_POINTS: Array<[number, number]> = [
  [38.2946, 51.6963], // left eye
  [73.5318, 51.5014], // right eye
  [56.0252, 71.7366], // nose
  [41.5493, 92.3655], // mouth left
  [70.7299, 92.2041], // mouth right
];

const TARGET_SIZE = 112;

export type Affine = { a: number; b: number; c: number; d: number; tx: number; ty: number };

/**
 * Estimate similarity transform (Umeyama) mapping `src` keypoints onto `REF_POINTS`.
 * Returns matrix [[a b tx][c d ty]] such that ref = M · src + t.
 */
export function estimateSimilarity(src: Array<{ x: number; y: number }>): Affine {
  if (src.length !== 5) throw new Error("Need exactly 5 source keypoints");

  // Compute means
  let sx = 0,
    sy = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < 5; i++) {
    sx += src[i].x;
    sy += src[i].y;
    dx += REF_POINTS[i][0];
    dy += REF_POINTS[i][1];
  }
  sx /= 5;
  sy /= 5;
  dx /= 5;
  dy /= 5;

  // Compute variance and cross-covariance
  let varSrc = 0;
  let cov00 = 0,
    cov01 = 0,
    cov10 = 0,
    cov11 = 0;
  for (let i = 0; i < 5; i++) {
    const sxd = src[i].x - sx;
    const syd = src[i].y - sy;
    const dxd = REF_POINTS[i][0] - dx;
    const dyd = REF_POINTS[i][1] - dy;
    varSrc += sxd * sxd + syd * syd;
    cov00 += dxd * sxd;
    cov01 += dxd * syd;
    cov10 += dyd * sxd;
    cov11 += dyd * syd;
  }
  varSrc /= 5;
  cov00 /= 5;
  cov01 /= 5;
  cov10 /= 5;
  cov11 /= 5;

  // SVD of 2x2 covariance via direct formulas.
  const { u, s, v } = svd2x2(cov00, cov01, cov10, cov11);
  // Determinant sign correction
  const detUV =
    (u[0] * v[0] + u[1] * v[2]) * (u[2] * v[1] + u[3] * v[3]) -
    (u[0] * v[1] + u[1] * v[3]) * (u[2] * v[0] + u[3] * v[2]);
  const d = [1, 1];
  if (detUV < 0) d[1] = -1;

  // R = U · diag(d) · V^T
  // We need 2D rotation/scale matrix
  const R00 = u[0] * d[0] * v[0] + u[1] * d[1] * v[1];
  const R01 = u[0] * d[0] * v[2] + u[1] * d[1] * v[3];
  const R10 = u[2] * d[0] * v[0] + u[3] * d[1] * v[1];
  const R11 = u[2] * d[0] * v[2] + u[3] * d[1] * v[3];

  const trace = s[0] * d[0] + s[1] * d[1];
  const c = varSrc > 1e-9 ? trace / varSrc : 1;

  const a = c * R00;
  const b = c * R01;
  const cc = c * R10;
  const dd = c * R11;
  const tx = dx - (a * sx + b * sy);
  const ty = dy - (cc * sx + dd * sy);

  return { a, b, c: cc, d: dd, tx, ty };
}

/** Tiny 2x2 SVD via eigendecomposition of M^T M. */
function svd2x2(a: number, b: number, c: number, d: number) {
  // M^T M
  const a2 = a * a + c * c;
  const b2 = a * b + c * d;
  const c2 = b * b + d * d;
  // Eigenvalues
  const trace = a2 + c2;
  const det = a2 * c2 - b2 * b2;
  const disc = Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
  const l1 = trace / 2 + disc;
  const l2 = Math.max(0, trace / 2 - disc);
  const s0 = Math.sqrt(Math.max(0, l1));
  const s1 = Math.sqrt(Math.max(0, l2));

  // Right singular vectors (columns of V) from M^T M eigenvectors
  let v00 = 1,
    v01 = 0,
    v10 = 0,
    v11 = 1;
  if (Math.abs(b2) > 1e-9) {
    v00 = b2;
    v10 = l1 - a2;
    const n0 = Math.hypot(v00, v10) || 1;
    v00 /= n0;
    v10 /= n0;
    v01 = b2;
    v11 = l2 - a2;
    const n1 = Math.hypot(v01, v11) || 1;
    v01 /= n1;
    v11 /= n1;
  }

  // Left singular vectors U = M V / S
  const u00 = (a * v00 + b * v10) / (s0 || 1);
  const u10 = (c * v00 + d * v10) / (s0 || 1);
  const u01 = (a * v01 + b * v11) / (s1 || 1);
  const u11 = (c * v01 + d * v11) / (s1 || 1);

  return {
    u: [u00, u01, u10, u11],
    s: [s0, s1],
    v: [v00, v01, v10, v11],
  };
}

/**
 * Warp source RGB image with affine M into a 112x112 RGB output.
 * Uses bilinear interpolation. Inverse map sample positions on src.
 */
export function warpAffineToFace(src: RawImage, affine: Affine): Uint8ClampedArray {
  const out = new Uint8ClampedArray(TARGET_SIZE * TARGET_SIZE * 3);

  // Invert 2x3 affine.
  const det = affine.a * affine.d - affine.b * affine.c;
  if (Math.abs(det) < 1e-9) return out;
  const inv = {
    a: affine.d / det,
    b: -affine.b / det,
    c: -affine.c / det,
    d: affine.a / det,
    tx: 0,
    ty: 0,
  };
  inv.tx = -(inv.a * affine.tx + inv.b * affine.ty);
  inv.ty = -(inv.c * affine.tx + inv.d * affine.ty);

  for (let y = 0; y < TARGET_SIZE; y++) {
    for (let x = 0; x < TARGET_SIZE; x++) {
      // Sample position on source
      const sx = inv.a * x + inv.b * y + inv.tx;
      const sy = inv.c * x + inv.d * y + inv.ty;
      if (sx < 0 || sy < 0 || sx >= src.width - 1 || sy >= src.height - 1) {
        const dst = (y * TARGET_SIZE + x) * 3;
        out[dst] = 0;
        out[dst + 1] = 0;
        out[dst + 2] = 0;
        continue;
      }
      const x0 = Math.floor(sx),
        y0 = Math.floor(sy);
      const dx = sx - x0,
        dy = sy - y0;
      const i00 = (y0 * src.width + x0) * 3;
      const i10 = (y0 * src.width + x0 + 1) * 3;
      const i01 = ((y0 + 1) * src.width + x0) * 3;
      const i11 = ((y0 + 1) * src.width + x0 + 1) * 3;
      const w00 = (1 - dx) * (1 - dy);
      const w10 = dx * (1 - dy);
      const w01 = (1 - dx) * dy;
      const w11 = dx * dy;
      const dst = (y * TARGET_SIZE + x) * 3;
      out[dst] =
        src.data[i00] * w00 + src.data[i10] * w10 + src.data[i01] * w01 + src.data[i11] * w11;
      out[dst + 1] =
        src.data[i00 + 1] * w00 +
        src.data[i10 + 1] * w10 +
        src.data[i01 + 1] * w01 +
        src.data[i11 + 1] * w11;
      out[dst + 2] =
        src.data[i00 + 2] * w00 +
        src.data[i10 + 2] * w10 +
        src.data[i01 + 2] * w01 +
        src.data[i11 + 2] * w11;
    }
  }
  return out;
}

export const ALIGNED_FACE_SIZE = TARGET_SIZE;
