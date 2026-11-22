/**
 * Anonymous Client Identifier for PostgreSQL session-level isolation.
 * Automatically generates and persists a unique client UUID in localStorage.
 */
export function getOrCreateClientId(): string {
  if (typeof window === "undefined") {
    return "anonymous_server";
  }

  const STORAGE_KEY = "stacksense_client_uuid";
  try {
    let existingId = localStorage.getItem(STORAGE_KEY);

    if (!existingId || !existingId.startsWith("client_")) {
      const randomHex =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID().replace(/-/g, "")
          : Math.random().toString(36).substring(2) + Date.now().toString(36);
      existingId = `client_${randomHex.slice(0, 20)}`;
      localStorage.setItem(STORAGE_KEY, existingId);
    }

    return existingId;
  } catch {
    // In restricted incognito/private browser modes where localStorage is denied
    return "client_ephemeral";
  }
}
