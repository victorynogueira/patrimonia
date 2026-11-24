import { z } from "zod";
import { parseMoneyInput } from "./money";
import { ALL_PERMISSIONS } from "./permissions";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Informe uma cor válida (ex.: #6366F1)");
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable().transform((v) => v || null);

export const moneySchema = z
  .union([z.string(), z.number()])
  .transform(parseMoneyInput)
  .refine((value) => value > 0, { message: "Informe um valor maior que zero" });

export const nonNegativeMoneySchema = z
  .union([z.string(), z.number()])
  .transform(parseMoneyInput)
  .refine((value) => value >= 0, { message: "O valor não pode ser negativo" });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(128),
  familyName: z.string().trim().min(2).max(80).optional(),
});

export const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email() });
export const resetSchema = z.object({ token: z.string().min(10), password: z.string().min(8).max(128) });

export const familySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da família").max(80),
  description: optionalText(500),
  color: hexColor.default("#6366F1"),
  status: z.enum(["ACTIVE", "SUSPENDED"]).default("ACTIVE"),
  features: z.record(z.boolean()).default({}),
});

export const memberSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER", "VIEWER"]).default("MEMBER"),
  permissions: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])).default([]),
});

export const permissionsSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "MEMBER", "VIEWER"]),
  permissions: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])),
});

export const accountSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(["BANK", "INVESTMENT", "CASH", "CREDIT"]).default("BANK"),
  institution: optionalText(80),
  balance: z.union([z.string(), z.number()]).transform(parseMoneyInput).default(0),
  color: hexColor.default("#6366F1"),
  isActive: z.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  type: z.enum(["INCOME", "EXPENSE", "PROFIT"]).default("EXPENSE"),
  color: hexColor.default("#6366F1"),
  icon: z.string().max(40).default("circle"),
});

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "PROFIT", "TRANSFER"]),
  amount: moneySchema,
  description: z.string().trim().min(2, "Informe uma descrição").max(160),
  notes: optionalText(1000),
  date: z.coerce.date(),
  accountId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  documentId: z.string().nullable().optional(),
  isRecurring: z.boolean().default(false),
  recurrence: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]).nullable().optional(),
});

export const assetSchema = z.object({
  type: z.enum(["REAL_ESTATE", "VEHICLE", "INVESTMENT", "BUSINESS", "OTHER"]),
  name: z.string().trim().min(2).max(100),
  description: optionalText(1000),
  acquisitionValue: nonNegativeMoneySchema,
  currentValue: nonNegativeMoneySchema,
  acquisitionDate: z.coerce.date(),
  location: optionalText(160),
  documentId: z.string().nullable().optional(),
});

export const valuationSchema = z.object({
  value: nonNegativeMoneySchema,
  date: z.coerce.date().default(() => new Date()),
  notes: optionalText(500),
});

export const budgetSchema = z.object({
  categoryId: z.string().nullable().optional(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use o formato YYYY-MM"),
  limit: moneySchema,
});

export const goalSchema = z.object({
  name: z.string().trim().min(2).max(100),
  target: moneySchema,
  current: z.union([z.string(), z.number()]).transform(parseMoneyInput).default(0),
  deadline: z.coerce.date().nullable().optional(),
  color: hexColor.default("#10B981"),
  description: optionalText(500),
});

export const notificationSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(500),
  type: z.enum(["INFO", "ALERT", "SUCCESS"]).default("INFO"),
});
