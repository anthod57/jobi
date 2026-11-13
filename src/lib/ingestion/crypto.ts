import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION_PREFIX = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

function resolveEncryptionKey(rawKey?: string): Buffer {
  const value = (rawKey ?? process.env.APP_ENCRYPTION_KEY ?? "").trim();
  if (!value) {
    throw new Error(
      "APP_ENCRYPTION_KEY is required (expected 64 hex chars or 32-byte base64).",
    );
  }

  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    return Buffer.from(value, "hex");
  }

  if (/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    const decoded = Buffer.from(value, "base64");
    if (decoded.length === KEY_BYTES) {
      return decoded;
    }
  }

  throw new Error(
    "APP_ENCRYPTION_KEY is invalid (expected 64 hex chars or 32-byte base64).",
  );
}

/** Encrypts a JSON-serializable secret payload with AES-256-GCM (`v1.<iv>.<tag>.<data>`). */
export function encryptSecretJson(payload: unknown, rawKey?: string): string {
  const key = resolveEncryptionKey(rawKey);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    VERSION_PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

/** Decrypts a `v1.<iv>.<tag>.<data>` payload produced by `encryptSecretJson`. */
export function decryptSecretJson<T>(encrypted: string, rawKey?: string): T {
  const key = resolveEncryptionKey(rawKey);
  const parts = encrypted.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION_PREFIX) {
    throw new Error("Unsupported or malformed encrypted payload format.");
  }

  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const ciphertext = Buffer.from(parts[3], "base64");
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new Error("Malformed encrypted payload lengths.");
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(plaintext) as T;
}

/** Returns a masked hint keeping at most the last 4 characters (`…abcd`). */
export function buildKeyHint(identifier: string): string {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return "";
  }
  return `…${trimmed.slice(-4)}`;
}
