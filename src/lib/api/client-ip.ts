import { isIP } from "node:net";

// The chosen header must be overwritten by the deployment's trusted edge or
// reverse proxy. We select one validated address and later overwrite both
// outbound forwarding headers; arbitrary incoming chains are never appended.
export function resolveTrustedClientIp(
  headerName: "x-real-ip" | "x-forwarded-for",
  value: string | null,
): string | null {
  if (value === null) {
    return null;
  }

  const candidate =
    headerName === "x-forwarded-for" ? value.split(",")[0]?.trim() : value.trim();
  return candidate && isIP(candidate) !== 0 ? candidate : null;
}
