import "server-only";

import sharp from "sharp";

const THUMB_WIDTH = 1280;
const WATERMARK_OPACITY = 0.6;

/**
 * Build a watermarked WebP thumbnail from the original photo bytes.
 * Returns the WebP buffer plus original dimensions so we can persist them.
 */
export async function buildWatermarkedThumb(
  originalBytes: Uint8Array | Buffer,
  brandLabel: string
): Promise<{
  webp: Buffer;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
}> {
  const image = sharp(originalBytes, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  const origW = meta.width ?? 0;
  const origH = meta.height ?? 0;

  const target = origW > THUMB_WIDTH ? { width: THUMB_WIDTH } : { width: origW || THUMB_WIDTH };
  const resized = await image
    .resize(target)
    .webp({ quality: 78 })
    .toBuffer({ resolveWithObject: true });

  const watermark = svgWatermark(resized.info.width, resized.info.height, brandLabel);
  const composed = await sharp(resized.data)
    .composite([{ input: Buffer.from(watermark), gravity: "southeast" }])
    .webp({ quality: 78 })
    .toBuffer();

  return {
    webp: composed,
    width: origW,
    height: origH,
    thumbWidth: resized.info.width,
    thumbHeight: resized.info.height,
  };
}

function svgWatermark(width: number, height: number, label: string) {
  const safeLabel = label.replace(/[<>&"']/g, "");
  const fontSize = Math.max(14, Math.round(Math.min(width, height) * 0.025));
  const padX = Math.round(fontSize * 0.8);
  const padY = Math.round(fontSize * 0.5);
  const textWidth = Math.round(safeLabel.length * fontSize * 0.55);
  const boxW = textWidth + padX * 2;
  const boxH = fontSize + padY * 2;
  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <g opacity="${WATERMARK_OPACITY}" transform="translate(${width - boxW - 24}, ${height - boxH - 24})">
    <rect rx="${boxH / 2}" ry="${boxH / 2}" width="${boxW}" height="${boxH}" fill="rgba(0,0,0,0.55)" />
    <text x="${padX}" y="${padY + fontSize * 0.85}" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="600">${safeLabel}</text>
  </g>
</svg>`;
}
