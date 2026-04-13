import { createHash, randomBytes } from "crypto";

const PREFIX = "sk_live_";

/** SHA-256 hex digest of the full API key (for lookup). */
export function hashApiKey(plainKey: string): string {
  return createHash("sha256").update(plainKey, "utf8").digest("hex");
}

/** Returns { plainKey, keyPrefix } — plainKey is shown once to the user. */
export function generateIntegrationApiKey(): { plainKey: string; keyPrefix: string } {
  const secret = randomBytes(32).toString("hex");
  const plainKey = `${PREFIX}${secret}`;
  const keyPrefix = plainKey.slice(0, 12);
  return { plainKey, keyPrefix };
}
