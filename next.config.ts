import type { NextConfig } from "next";
import { parseEnv } from "./src/lib/env/values";

const env = parseEnv(process.env);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
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
