import { z } from "zod";

function runeLength(value: string): number {
  return [...value].length;
}

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email must be at most 254 characters")
  .email("Enter a valid email address");

const password = z
  .string()
  .refine((value) => runeLength(value) >= 12, {
    message: "Password must be at least 12 characters",
  })
  .refine((value) => runeLength(value) <= 128, {
    message: "Password must be at most 128 characters",
  });

export const loginSchema = z.object({ email, password });

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .refine((value) => runeLength(value) >= 1, {
        message: "Full name is required",
      })
      .refine((value) => runeLength(value) <= 100, {
        message: "Full name must be at most 100 characters",
      }),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;

