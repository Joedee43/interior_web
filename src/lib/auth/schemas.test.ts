import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "./schemas";

describe("auth form schemas", () => {
  it("normalizes email and name but never trims passwords", () => {
    const result = registerSchema.parse({
      fullName: "  Demo Customer  ",
      email: "  Demo@Example.com ",
      password: " password 123 ",
      confirmPassword: " password 123 ",
    });
    expect(result.fullName).toBe("Demo Customer");
    expect(result.email).toBe("Demo@Example.com");
    expect(result.password).toBe(" password 123 ");
  });

  it("enforces backend password length using Unicode characters", () => {
    expect(
      loginSchema.safeParse({ email: "a@example.com", password: "😀".repeat(12) })
        .success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({ email: "a@example.com", password: "short" })
        .success,
    ).toBe(false);
  });

  it("requires matching registration passwords", () => {
    const result = registerSchema.safeParse({
      fullName: "Demo",
      email: "demo@example.com",
      password: "password 123",
      confirmPassword: "different 123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
        "Passwords do not match",
      );
    }
  });
});

