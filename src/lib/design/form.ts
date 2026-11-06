import { z } from "zod";

const metres = z.string().regex(/^\d+(?:\.\d{1,3})?$/, "Use metres with up to three decimal places");
const name = z.string().trim().min(1, "Enter a design name").max(100, "Use 100 characters or fewer");

export const designFormSchema = z.object({
  name,
  mode: z.enum(["template", "custom"]),
  template: z.string(),
  widthM: metres,
  depthM: metres,
  heightM: metres,
  floor: z.enum(["oak", "tile", "carpet", "concrete"]),
  wallColor: z.string().transform((value) => value.trim().toUpperCase()).pipe(z.string().regex(/^#[0-9A-F]{6}$/, "Use a six-digit hex colour")),
}).superRefine((value, context) => {
  if (value.mode === "template" && !value.template) context.addIssue({ code: "custom", path: ["template"], message: "Choose a room template" });
  if (value.mode === "custom") {
    for (const [key, min, max] of [["widthM", 1, 30], ["depthM", 1, 30], ["heightM", 2, 6]] as const) {
      const amount = Number(value[key]);
      if (amount < min || amount > max) context.addIssue({ code: "custom", path: [key], message: `Use a value from ${min} to ${max} metres` });
    }
  }
});

export type DesignFormValues = z.input<typeof designFormSchema>;

export function metresToMillimetres(value: string): number {
  if (!/^\d+(?:\.\d{1,3})?$/.test(value)) throw new Error("Invalid metre value");
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 1000 + Number(fraction.padEnd(3, "0"));
}
