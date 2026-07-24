import sharp from "sharp";

// Admin uploads land in Blob storage and get served to every site visitor.
// Cap dimensions/quality here so a raw camera export or scan doesn't turn
// into a multi-MB download on every page view (this is what blew through
// the Blob bandwidth quota and got the store suspended).
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 82;

export async function resizeForUpload(file: File): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
  const input = Buffer.from(await file.arrayBuffer());
  const buffer = await sharp(input)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  const fileName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return { buffer, contentType: "image/jpeg", fileName };
}
