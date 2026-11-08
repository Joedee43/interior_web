import { expect, test } from "@playwright/test";

test.describe("Security headers", () => {
  test("pages send the CSP and hardening headers", async ({ request }) => {
    const response = await request.get("/catalog");
    expect(response.ok()).toBe(true);
    const headers = response.headers();
    const csp = headers["content-security-policy"] ?? "";
    for (const directive of ["default-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "img-src 'self' blob: data:"]) {
      expect(csp).toContain(directive);
    }
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
  });

  test("API responses keep Go's headers, not the page CSP", async ({ request }) => {
    const response = await request.get("/v1/catalog/categories");
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-security-policy"]).toBeUndefined();
  });
});
