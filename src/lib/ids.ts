const URL_SAFE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function randomUrlSafeId(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let id = "";
  for (const byte of bytes) {
    id += URL_SAFE_ALPHABET[byte % URL_SAFE_ALPHABET.length];
  }

  return id;
}

export function generatePollSlug(): string {
  return randomUrlSafeId(12);
}

export function generateResponseId(): string {
  return randomUrlSafeId(20);
}

export function generateToken(): string {
  return randomUrlSafeId(40);
}

export async function hashToken(rawToken: string, pepper: string): Promise<string> {
  const data = new TextEncoder().encode(`${pepper}:${rawToken}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
