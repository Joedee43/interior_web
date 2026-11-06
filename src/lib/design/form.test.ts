import { describe, expect, it } from "vitest";
import { designFormSchema, metresToMillimetres } from "./form";

describe("design creation form", () => {
  it("converts decimal metres exactly to integer millimetres", () => {
    expect(metresToMillimetres("4")).toBe(4000);
    expect(metresToMillimetres("2.75")).toBe(2750);
    expect(metresToMillimetres("1.001")).toBe(1001);
    expect(() => metresToMillimetres("1.0001")).toThrow();
  });

  it("requires a template in template mode", () => {
    const result = designFormSchema.safeParse({ name: "Room", mode: "template", template: "", widthM: "4", depthM: "5", heightM: "2.7", floor: "oak", wallColor: "#ffffff" });
    expect(result.success).toBe(false);
  });

  it("validates custom limits and normalizes wall colour", () => {
    const result = designFormSchema.parse({ name: " Room ", mode: "custom", template: "", widthM: "4", depthM: "5", heightM: "2.7", floor: "concrete", wallColor: "#abcdef" });
    expect(result.name).toBe("Room");
    expect(result.wallColor).toBe("#ABCDEF");
    expect(designFormSchema.safeParse({ ...result, widthM: "30.001" }).success).toBe(false);
  });
});
