import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const PREFIX = "enc:";

function getKey(): Buffer {
  const hex = process.env.ACCOUNT_ENCRYPTION_KEY;
  if (!hex) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[account-crypto] ACCOUNT_ENCRYPTION_KEY must be set in production");
    }
    // dev fallback — never use in production
    console.warn("[account-crypto] ACCOUNT_ENCRYPTION_KEY not set — using dev fallback key");
    return Buffer.alloc(32);
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error("[account-crypto] ACCOUNT_ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
  }
  return key;
}

/** AES-256-GCM 암호화 → "enc:" + base64(iv12 + authTag16 + ciphertext) */
export function encryptAccount(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/** AES-256-GCM 복호화. enc: prefix 없으면 레거시 평문으로 간주 */
export function decryptAccount(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;
  const key = getKey();
  const combined = Buffer.from(stored.slice(PREFIX.length), "base64");
  const iv = combined.subarray(0, 12);
  const authTag = combined.subarray(12, 28);
  const ciphertext = combined.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext) + decipher.final("utf8");
}

/** 계좌번호 마스킹: "1234567890" → "123-****-7890" */
export function maskAccount(plain: string): string {
  const digits = plain.replace(/\D/g, "");
  if (digits.length < 5) return "****";
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}
