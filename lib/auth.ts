// One shared passcode (APP_PASSCODE). No user accounts.
// The cookie holds a hash of the passcode, never the passcode itself.
export const AUTH_COOKIE = "aangan_auth";

export async function tokenFor(passcode: string): Promise<string> {
  const bytes = new TextEncoder().encode(`aangan:${passcode}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
