import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const loginSchema = z.object({
  phone: z.string().min(10).max(20),
  password: z.string().min(4).max(128),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(20),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  address: z.string().trim().max(255).optional().nullable().or(z.literal("")),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(4).max(128),
  newPassword: z.string().min(6).max(128),
});

export const memberCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(20),
  password: z.string().min(4).max(128),
  status: z.enum(["Aktif", "Nonaktif"]).default("Aktif"),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  address: z.string().trim().max(255).optional().nullable().or(z.literal("")),
});

export const memberUpdateSchema = memberCreateSchema.omit({ password: true });

export const savingsProductSchema = z.object({
  name: z.string().trim().min(2).max(100),
  amount: z.coerce.number().min(0),
  isMandatory: z.boolean(),
});

export const loanProductSchema = z.object({
  name: z.string().trim().min(2).max(100),
  maxAmount: z.coerce.number().positive(),
  interestRate: z.coerce.number().min(0),
  adminFeeRate: z.coerce.number().min(0).default(1),
  maxTenor: z.coerce.number().int().positive().max(120),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3).max(150),
  content: z.string().trim().min(5).max(5000),
  isActive: z.boolean(),
});

export const loanApplicationCreateSchema = z.object({
  amount: z.coerce.number().min(500000).max(50000000),
  tenor: z.coerce.number().int().positive().max(60),
  purpose: z.string().trim().min(3).max(255),
  loanProductId: z.string().min(1).optional(),
});

export const loanApplicationReviewSchema = z.object({
  status: z.enum(["Ditinjau", "Disetujui", "Ditolak"]),
  reviewNote: z.string().trim().max(500).optional().nullable().or(z.literal("")),
});

export const loanPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(["Transfer", "Tunai"]),
  note: z.string().trim().max(500).optional().nullable().or(z.literal("")),
});
