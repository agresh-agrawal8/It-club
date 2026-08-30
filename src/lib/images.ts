import "server-only";

/**
 * Image sniffing for uploads.
 *
 * Two jobs, both done by reading the bytes rather than believing the client:
 *
 *  1. Decide what the file actually is. A browser-supplied `type` and a `.png`
 *     on the end of the filename are both attacker-controlled; an HTML file
 *     named `photo.png` served from a storage bucket is a stored-XSS vector.
 *     Only the four raster formats below are accepted, and only if their
 *     signature matches.
 *
 *  2. Read the intrinsic dimensions, so every <img> can be rendered with
 *     width/height attributes and reserve its space before it loads. That is
 *     what keeps Cumulative Layout Shift at zero on the gallery.
 *
 * Parsing headers here avoids a native image dependency for what is, in every
 * one of these formats, a fixed offset a few bytes into the file.
 */

export type ImageFormat = "png" | "jpeg" | "webp" | "gif";

export interface SniffedImage {
  format: ImageFormat;
  /** Canonical MIME type — derived from the bytes, never from the upload. */
  mime: string;
  extension: string;
  width: number;
  height: number;
}

const MIME: Record<ImageFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

const EXTENSION: Record<ImageFormat, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
  gif: "gif",
};

function isPng(b: Buffer) {
  return (
    b.length > 24 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  );
}

function isJpeg(b: Buffer) {
  return b.length > 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}

function isGif(b: Buffer) {
  return b.length > 10 && b.subarray(0, 3).toString("latin1") === "GIF";
}

function isWebp(b: Buffer) {
  return (
    b.length > 30 &&
    b.subarray(0, 4).toString("latin1") === "RIFF" &&
    b.subarray(8, 12).toString("latin1") === "WEBP"
  );
}

/** PNG: IHDR is always the first chunk, so the size sits at a fixed offset. */
function pngSize(b: Buffer) {
  if (b.subarray(12, 16).toString("latin1") !== "IHDR") return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

/**
 * JPEG: walk the segment chain to the Start-Of-Frame marker. The dimensions
 * are not at a fixed offset because any number of metadata segments (EXIF,
 * colour profiles, thumbnails) may precede the frame.
 */
function jpegSize(b: Buffer) {
  let offset = 2;
  while (offset + 9 < b.length) {
    if (b[offset] !== 0xff) return null;
    const marker = b[offset + 1];

    // Standalone markers carry no length field.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    const length = b.readUInt16BE(offset + 2);
    if (length < 2) return null;

    // SOF0-3, SOF5-7, SOF9-11, SOF13-15 hold the frame size. The excluded
    // values in those runs (C4/C8/CC) are Huffman/arithmetic tables.
    const isSof =
      marker >= 0xc0 && marker <= 0xcf &&
      marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;

    if (isSof) {
      if (offset + 9 >= b.length) return null;
      return { height: b.readUInt16BE(offset + 5), width: b.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

function gifSize(b: Buffer) {
  return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
}

/** WebP has three container shapes and stores its size differently in each. */
function webpSize(b: Buffer) {
  const chunk = b.subarray(12, 16).toString("latin1");

  if (chunk === "VP8X") {
    // Extended: 24-bit little-endian canvas size, stored minus one.
    const width = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const height = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    return { width, height };
  }

  if (chunk === "VP8 ") {
    // Lossy: 14-bit dimensions after the 3-byte start code.
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }

  if (chunk === "VP8L") {
    // Lossless: 14 bits each, packed into a 32-bit little-endian word.
    const bits = b.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }

  return null;
}

/**
 * Identify an upload from its bytes. Returns null for anything that is not one
 * of the four accepted raster formats, or whose header does not parse — the
 * caller should reject on null rather than fall back to the client's claims.
 */
export function sniffImage(buffer: Buffer): SniffedImage | null {
  let format: ImageFormat | null = null;
  let size: { width: number; height: number } | null = null;

  try {
    if (isPng(buffer)) {
      format = "png";
      size = pngSize(buffer);
    } else if (isJpeg(buffer)) {
      format = "jpeg";
      size = jpegSize(buffer);
    } else if (isWebp(buffer)) {
      format = "webp";
      size = webpSize(buffer);
    } else if (isGif(buffer)) {
      format = "gif";
      size = gifSize(buffer);
    }
  } catch {
    return null;
  }

  if (!format || !size) return null;

  // A zero or absurd dimension means the header did not really parse.
  const { width, height } = size;
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width < 1 || height < 1 || width > 20000 || height > 20000) return null;

  return { format, mime: MIME[format], extension: EXTENSION[format], width, height };
}
