import { z } from "zod";

const optionalTrimmed = (max: number, label: string) => z.string().trim().max(max, `${label} must be at most ${max} characters`);
export const quoteContactSchema = z.object({
  contactPhone: optionalTrimmed(40, "Phone"),
  deliveryAddress: optionalTrimmed(500, "Delivery address"),
  note: optionalTrimmed(2000, "Note"),
  confirmed: z.boolean().refine((value) => value, "Confirm before sending the requests"),
});
export type QuoteContactValues = z.infer<typeof quoteContactSchema>;

