import { z } from "zod";

const envSchema = z.object({
  API_INTERNAL_URL: z.url().default("http://localhost:5050"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  TRUSTED_CLIENT_IP_HEADER: z
    .enum(["x-real-ip", "x-forwarded-for"])
    .default("x-real-ip"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(values: Record<string, string | undefined>): AppEnv {
  const result = envSchema.safeParse(values);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid frontend environment: ${problems}`);
  }

  return {
    ...result.data,
    API_INTERNAL_URL: stripTrailingSlash(result.data.API_INTERNAL_URL),
    NEXT_PUBLIC_APP_URL: stripTrailingSlash(result.data.NEXT_PUBLIC_APP_URL),
  };
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
