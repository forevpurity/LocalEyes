import { mkdir, writeFile, unlink } from "fs/promises";
import { dirname, resolve, sep } from "path";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

/**
 * Storage abstraction for user-uploaded images (report photos, avatars).
 *
 * Two interchangeable drivers, chosen by env at startup:
 *   - "local" — writes under UPLOAD_DIR and is served by express.static("/uploads").
 *               Default for dev; not safe for multi-instance or ephemeral-disk deploys.
 *   - "r2"    — Cloudflare R2 (S3-compatible) object storage. Default for production.
 *
 * Callers only ever deal in public URLs: `put()` returns the URL to persist in the
 * DB, and `delete()` accepts a URL previously returned by `put()`.
 */
export interface StorageDriver {
  /** Store an object under `key` and return its public URL. */
  put(key: string, body: Buffer, contentType: string): Promise<string>;
  /** Delete an object given a public URL previously returned by `put()`. No-op if the URL isn't ours. */
  delete(url: string): Promise<void>;
  /** Whether the Express app should serve uploads itself via express.static. */
  readonly servesLocally: boolean;
}

const UPLOADS_PREFIX = "/uploads/";

class LocalStorage implements StorageDriver {
  readonly servesLocally = true;
  private readonly baseDir: string;

  constructor(dir: string) {
    this.baseDir = resolve(dir);
  }

  async put(key: string, body: Buffer): Promise<string> {
    const filePath = resolve(this.baseDir, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, body);
    return `${UPLOADS_PREFIX}${key}`;
  }

  async delete(url: string): Promise<void> {
    if (!url.startsWith(UPLOADS_PREFIX)) return;
    const filePath = resolve(this.baseDir, url.slice(UPLOADS_PREFIX.length));
    // Path-traversal guard: the resolved path must stay inside baseDir.
    if (filePath !== this.baseDir && !filePath.startsWith(this.baseDir + sep)) return;
    await unlink(filePath).catch(() => {
      // File may already be gone — that's fine.
    });
  }
}

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Public base URL for the bucket, no trailing slash (r2.dev URL or custom domain). */
  publicUrl: string;
}

class R2Storage implements StorageDriver {
  readonly servesLocally = false;
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(cfg: R2Config) {
    this.bucket = cfg.bucket;
    this.publicUrl = cfg.publicUrl.replace(/\/+$/, "");
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return `${this.publicUrl}/${key}`;
  }

  async delete(url: string): Promise<void> {
    const prefix = `${this.publicUrl}/`;
    if (!url.startsWith(prefix)) return;
    const key = url.slice(prefix.length);
    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
      .catch(() => {
        // Best-effort cleanup — a failed delete must not fail the request.
      });
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `STORAGE_DRIVER=r2 requires ${name} to be set (see .env.example)`,
    );
  }
  return value;
}

function createStorage(): StorageDriver {
  const driver =
    process.env.STORAGE_DRIVER ?? (process.env.R2_BUCKET ? "r2" : "local");

  if (driver === "r2") {
    return new R2Storage({
      accountId: requireEnv("R2_ACCOUNT_ID"),
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      bucket: requireEnv("R2_BUCKET"),
      publicUrl: requireEnv("R2_PUBLIC_URL"),
    });
  }

  return new LocalStorage(process.env.UPLOAD_DIR ?? "uploads");
}

export const storage = createStorage();
