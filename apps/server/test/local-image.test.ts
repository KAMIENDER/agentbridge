import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  detectImageContentType,
  readLocalImageFile,
} from "../src/local-image.js";

const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe("local image files", () => {
  it("detects supported image signatures", () => {
    expect(detectImageContentType(PNG_BYTES)).toBe("image/png");
    expect(detectImageContentType(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe(
      "image/jpeg",
    );
    expect(detectImageContentType(Buffer.from("GIF89a", "ascii"))).toBe(
      "image/gif",
    );
    expect(
      detectImageContentType(
        Buffer.from([
          0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42,
          0x50,
        ]),
      ),
    ).toBe("image/webp");
  });

  it("reads a local PNG file", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "farfield-image-"));
    const imagePath = path.join(tempDir, "sample.png");

    try {
      await fs.writeFile(imagePath, PNG_BYTES);
      const result = await readLocalImageFile(imagePath);

      expect(result.type).toBe("ok");
      if (result.type === "ok") {
        expect(result.image.contentType).toBe("image/png");
        expect(result.image.bytes.equals(PNG_BYTES)).toBe(true);
      }
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects relative paths", async () => {
    const result = await readLocalImageFile("sample.png");

    expect(result.type).toBe("error");
    if (result.type === "error") {
      expect(result.issue.code).toBe("imagePathNotAbsolute");
    }
  });

  it("rejects non-image content", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "farfield-image-"));
    const imagePath = path.join(tempDir, "sample.txt");

    try {
      await fs.writeFile(imagePath, "not an image");
      const result = await readLocalImageFile(imagePath);

      expect(result.type).toBe("error");
      if (result.type === "error") {
        expect(result.issue.code).toBe("unsupportedImageContent");
      }
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
