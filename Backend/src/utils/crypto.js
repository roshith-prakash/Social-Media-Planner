import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const DEFAULT_KEY = "c74216f092e77c606dcc963c30ac9a7a3d81580ea2a3c087d47971450c131fea";

const getKey = () => {
  const hex = process.env.ENCRYPTION_KEY || DEFAULT_KEY;
  return Buffer.from(hex, "hex");
};

/**
 * Encrypt a plain text string using AES-256-GCM.
 * Format: ivHex:tagHex:encryptedHex
 */
export const encrypt = (text) => {
  if (!text) return text;
  // If already encrypted, avoid double-encrypting
  if (typeof text === "string" && text.split(":").length === 3 && text.split(":")[0].length === 32) {
    return text;
  }
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
};

/**
 * Decrypt an AES-256-GCM encrypted string.
 * Gracefully returns original text if not encrypted.
 */
export const decrypt = (payload) => {
  if (!payload) return payload;
  if (typeof payload !== "string") return payload;

  const parts = payload.split(":");
  if (parts.length !== 3) {
    // Legacy plaintext token
    return payload;
  }

  try {
    const [ivHex, tagHex, encHex] = parts;
    const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return decipher.update(Buffer.from(encHex, "hex")) + decipher.final("utf8");
  } catch (err) {
    // In case token was formatted with colons but not encrypted
    console.warn("Decryption failed, falling back to raw payload:", err.message);
    return payload;
  }
};
