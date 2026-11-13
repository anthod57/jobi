import { afterEach, describe, expect, it } from "vitest";

import { buildKeyHint, decryptSecretJson, encryptSecretJson } from "./crypto";

const HEX_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const BASE64_KEY = Buffer.from(HEX_KEY, "hex").toString("base64");
const OTHER_HEX_KEY =
  "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

describe("crypto", () => {
  const originalKey = process.env.APP_ENCRYPTION_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.APP_ENCRYPTION_KEY;
    } else {
      process.env.APP_ENCRYPTION_KEY = originalKey;
    }
  });

  it("encrypts and decrypts JSON payloads using a 64-char hex key", () => {
    const payload = { clientId: "ft_client_1234", clientSecret: "s3cr3t!" };
    const encrypted = encryptSecretJson(payload, HEX_KEY);

    const parts = encrypted.split(".");
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe("v1");
    expect(Buffer.from(parts[1], "base64")).toHaveLength(12);
    expect(Buffer.from(parts[2], "base64")).toHaveLength(16);

    const decrypted = decryptSecretJson<typeof payload>(encrypted, HEX_KEY);
    expect(decrypted).toEqual(payload);
  });

  it("supports a 32-byte base64 key from process.env.APP_ENCRYPTION_KEY", () => {
    process.env.APP_ENCRYPTION_KEY = BASE64_KEY;
    const payload = { appId: "adz-1", appKey: "secret-key" };
    const encrypted = encryptSecretJson(payload);
    expect(decryptSecretJson<typeof payload>(encrypted)).toEqual(payload);
  });

  it("uses a fresh random IV on every encryption", () => {
    const payload = { token: "same" };
    const a = encryptSecretJson(payload, HEX_KEY);
    const b = encryptSecretJson(payload, HEX_KEY);
    expect(a).not.toBe(b);
  });

  it("throws an explicit error when APP_ENCRYPTION_KEY is missing or invalid", () => {
    delete process.env.APP_ENCRYPTION_KEY;
    expect(() => encryptSecretJson({ a: 1 })).toThrow(/APP_ENCRYPTION_KEY/);
    expect(() => encryptSecretJson({ a: 1 }, "too-short")).toThrow(
      /APP_ENCRYPTION_KEY/,
    );
    expect(() => decryptSecretJson("v1.aa.bb.cc", "invalid")).toThrow(
      /APP_ENCRYPTION_KEY/,
    );
  });

  it("rejects tampered ciphertext, wrong key, or malformed format", () => {
    const encrypted = encryptSecretJson({ secret: "top" }, HEX_KEY);
    const parts = encrypted.split(".");
    const tamperedTag = Buffer.from(parts[2], "base64");
    tamperedTag[0] ^= 0xff;
    parts[2] = tamperedTag.toString("base64");

    expect(() => decryptSecretJson(parts.join("."), HEX_KEY)).toThrow();
    expect(() => decryptSecretJson(encrypted, OTHER_HEX_KEY)).toThrow();
    expect(() => decryptSecretJson("v2.a.b.c", HEX_KEY)).toThrow();
  });

  it("builds a masked key hint with at most the last 4 characters", () => {
    expect(buildKeyHint("client_id_abcd")).toBe("…abcd");
    expect(buildKeyHint("  xy  ")).toBe("…xy");
    expect(buildKeyHint("")).toBe("");
    expect(buildKeyHint("   ")).toBe("");
  });
});
