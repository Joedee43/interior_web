import { describe, expect, it } from "vitest";
import { quoteContactSchema } from "./schemas";

describe("quote contact schema", () => {
  it("trims optional fields", () => expect(quoteContactSchema.parse({ contactPhone: "  +251  ", deliveryAddress: "  Addis  ", note: "  Please call  ", confirmed: true })).toEqual({ contactPhone: "+251", deliveryAddress: "Addis", note: "Please call", confirmed: true }));
  it("allows empty optional contact fields", () => expect(quoteContactSchema.safeParse({ contactPhone: "", deliveryAddress: "", note: "", confirmed: true }).success).toBe(true));
  it("enforces Unicode limits and confirmation", () => {
    expect(quoteContactSchema.safeParse({ contactPhone: "ሀ".repeat(41), deliveryAddress: "", note: "", confirmed: true }).success).toBe(false);
    expect(quoteContactSchema.safeParse({ contactPhone: "", deliveryAddress: "", note: "", confirmed: false }).success).toBe(false);
  });
});

