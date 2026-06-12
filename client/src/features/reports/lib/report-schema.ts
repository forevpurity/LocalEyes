import { z } from "zod";

/** Shared title/description rules for creating and editing a report. */
export const reportContentSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title must be at most 120 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be at most 2000 characters"),
});

export type ReportContent = z.infer<typeof reportContentSchema>;
