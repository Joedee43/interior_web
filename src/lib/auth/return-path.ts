const fallbackPath = "/account";
const authPaths = new Set(["/login", "/register"]);
const localOrigin = "https://interior.local";

export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return fallbackPath;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallbackPath;
  }

  try {
    const url = new URL(value, localOrigin);
    if (url.origin !== localOrigin) return fallbackPath;
    if (decodeURIComponent(url.pathname).includes("\\")) return fallbackPath;
    if (authPaths.has(url.pathname)) return fallbackPath;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallbackPath;
  }
}

