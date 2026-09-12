import { z } from "zod";

/* ── Shared primitives ───────────────────────────────── */

export const timestampSchema = z.object({
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type Pagination = z.infer<typeof paginationSchema>;

/* ── ID helpers ──────────────────────────────────────── */

export const firestoreIdSchema = z.string().min(1).max(128);

export const companyIdSchema = z.object({
  companyId: firestoreIdSchema,
});
