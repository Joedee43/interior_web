import type { NextConfig } from "next";
import { parseEnv } from "./src/lib/env/values";

const env = parseEnv(process.env);
const isDev = process.env.NODE_ENV === "development";

// No nonces: the bundled Next 16 guide (guides/content-security-policy.md)
// says nonce CSP is incompatible with Partial Prerendering, which the product
// and design pages use, so inline scripts and styles stay allowed.
// No upgrade-insecure-requests: it breaks a production build run over plain
// http locally; Caddy's HTTPS redirect and HSTS cover production.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // three.js loads textures embedded in a GLB through blob: URLs, fetching
  // them where createImageBitmap is available, hence blob: in connect-src too.
  "img-src 'self' blob: data:",
  `connect-src 'self' blob: data:${isDev ? " ws:" : ""}`,
  "worker-src 'self' blob:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  /* config options here */
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    // Pages only: /v1 and /openapi.yaml are Go responses with Go's own headers.
    return [{ source: "/((?!v1/|openapi\\.yaml).*)", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: `${env.API_INTERNAL_URL}/v1/:path*`,
      },
      {
        source: "/openapi.yaml",
        destination: `${env.API_INTERNAL_URL}/openapi.yaml`,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
