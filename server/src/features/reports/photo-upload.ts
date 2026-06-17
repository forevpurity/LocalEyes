import multer from "multer";
import { randomUUID } from "crypto";
import { extname } from "path";
import { writeFile } from "fs/promises";
import { ValidationError } from "../../common/errors.js";

export const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const ALLOWED_MIMES = new Set(Object.keys(MIME_TO_EXT));
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_FILES = 5;
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
});

export function validateImageFiles(files: Express.Multer.File[]): void {
  for (const file of files) {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      throw new ValidationError("Invalid file type", [
        {
          field: "photos",
          message: `File "${file.originalname}" is not a supported image type. Allowed: JPEG, PNG, WebP`,
        },
      ]);
    }
  }
}

export interface SavedFile {
  filename: string;
  url: string;
  order: number;
}

export async function saveImageFiles(
  files: Express.Multer.File[],
  startOrder = 0,
): Promise<SavedFile[]> {
  const saved: SavedFile[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = MIME_TO_EXT[file.mimetype];
    const filename = `${randomUUID()}.${ext}`;
    const url = `/uploads/${filename}`;
    await writeFile(`${UPLOAD_DIR}/${filename}`, file.buffer);
    saved.push({ filename, url, order: startOrder + i });
  }
  return saved;
}
