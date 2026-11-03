import "server-only";

import { headers } from "next/headers";

import { serverEnv } from "@/lib/env/server";
import { readApiResponse } from "./browser";
import { resolveTrustedClientIp } from "./client-ip";

export async function serverApiFetch<T>(
  path: `/v1/${string}`,
  init: RequestInit = {},
): Promise<T> {
  const incoming = await headers();
  const outbound = new Headers(init.headers);
  const cookie = incoming.get("cookie");
  if (cookie) {
    outbound.set("cookie", cookie);
  }
  if (!outbound.has("Accept")) {
    outbound.set("Accept", "application/json");
  }

  // Server-to-server calls deliberately carry no Origin. Go's checkOrigin
  // permits this; browser mutations keep their Origin through the rewrite.
  outbound.delete("origin");

  const clientIp = resolveTrustedClientIp(
    serverEnv.TRUSTED_CLIENT_IP_HEADER,
    incoming.get(serverEnv.TRUSTED_CLIENT_IP_HEADER),
  );
  if (clientIp) {
    outbound.set("x-forwarded-for", clientIp);
    outbound.set("x-real-ip", clientIp);
  } else {
    outbound.delete("x-forwarded-for");
    outbound.delete("x-real-ip");
  }

  const response = await fetch(`${serverEnv.API_INTERNAL_URL}${path}`, {
    ...init,
    headers: outbound,
  });
  return readApiResponse<T>(response);
}
