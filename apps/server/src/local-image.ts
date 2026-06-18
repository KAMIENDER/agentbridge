import fs from "node:fs/promises";
import path from "node:path";
import type { Buffer } from "node:buffer";
import { z } from "zod";

const LOCAL_IMAGE_MAX_BYTES = 25 * 1024 * 1024;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const GIF_87A_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61];
const GIF_89A_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];
const FTYP_SIGNATURE = [0x66, 0x74, 0x79, 0x70];
const AVIF_SIGNATURE = [0x61, 0x76, 0x69, 0x66];
const AVIS_SIGNATURE = [0x61, 0x76, 0x69, 0x73];

export const LocalImageQuerySchema = z
  .object({
    path: z.string().min(1).max(4096),
  })
  .strict();

export type LocalImageReadIssueCode =
  | "imagePathNotAbsolute"
  | "imageNotFound"
  | "imageNotFile"
  | "imageTooLarge"
  | "unsupportedImageContent"
  | "imageReadFailed";

export interface LocalImageReadIssue {
  code: LocalImageReadIssueCode;
  message: string;
}

export interface LocalImageFile {
  path: string;
  bytes: Buffer;
  contentType: "image/png" | "image/jpeg" | "image/gif" | "image/webp" | "image/avif";
}

export type LocalImageReadResult =
  | {
      type: "ok";
      image: LocalImageFile;
    }
  | {
      type: "error";
      issue: LocalImageReadIssue;
    };

function errorResult(
  code: LocalImageReadIssueCode,
  message: string,
): LocalImageReadResult {
  return {
    type: "error",
    issue: {
      code,
      message,
    },
  };
}

function startsWithBytes(buffer: Buffer, signature: readonly number[]): boolean {
  if (buffer.length < signature.length) {
    return false;
  }

  return signature.every((byte, index) => buffer[index] === byte);
}

function bytesAt(buffer: Buffer, start: number, signature: readonly number[]): boolean {
  if (buffer.length < start + signature.length) {
    return false;
  }

  return signature.every((byte, index) => buffer[start + index] === byte);
}

export function detectImageContentType(
  bytes: Buffer,
): LocalImageFile["contentType"] | null {
  if (startsWithBytes(bytes, PNG_SIGNATURE)) {
    return "image/png";
  }

  if (startsWithBytes(bytes, JPEG_SIGNATURE)) {
    return "image/jpeg";
  }

  if (
    startsWithBytes(bytes, GIF_87A_SIGNATURE) ||
    startsWithBytes(bytes, GIF_89A_SIGNATURE)
  ) {
    return "image/gif";
  }

  if (startsWithBytes(bytes, RIFF_SIGNATURE) && bytesAt(bytes, 8, WEBP_SIGNATURE)) {
    return "image/webp";
  }

  if (
    bytesAt(bytes, 4, FTYP_SIGNATURE) &&
    (bytesAt(bytes, 8, AVIF_SIGNATURE) || bytesAt(bytes, 8, AVIS_SIGNATURE))
  ) {
    return "image/avif";
  }

  return null;
}

export async function readLocalImageFile(
  filePath: string,
): Promise<LocalImageReadResult> {
  const normalizedPath = path.normalize(filePath);

  if (!path.isAbsolute(normalizedPath)) {
    return errorResult("imagePathNotAbsolute", "Image path must be absolute");
  }

  let stats: Awaited<ReturnType<typeof fs.stat>>;
  try {
    stats = await fs.stat(normalizedPath);
  } catch {
    return errorResult("imageNotFound", "Image file was not found");
  }

  if (!stats.isFile()) {
    return errorResult("imageNotFile", "Image path must point to a file");
  }

  if (stats.size > LOCAL_IMAGE_MAX_BYTES) {
    return errorResult("imageTooLarge", "Image file is larger than 25 MB");
  }

  let bytes: Buffer;
  try {
    bytes = await fs.readFile(normalizedPath);
  } catch {
    return errorResult("imageReadFailed", "Image file could not be read");
  }

  if (bytes.length > LOCAL_IMAGE_MAX_BYTES) {
    return errorResult("imageTooLarge", "Image file is larger than 25 MB");
  }

  const contentType = detectImageContentType(bytes);
  if (!contentType) {
    return errorResult(
      "unsupportedImageContent",
      "Image file must be PNG, JPEG, GIF, WebP, or AVIF",
    );
  }

  return {
    type: "ok",
    image: {
      path: normalizedPath,
      bytes,
      contentType,
    },
  };
}
