import type { ZodObject, ZodRawShape } from "zod";
import type { Permission } from "./permissions";
import {
  accountSchema,
  assetSchema,
  budgetSchema,
  categorySchema,
  goalSchema,
  transactionSchema,
} from "./validators";

export type Resource = "transactions" | "accounts" | "categories" | "assets" | "budgets" | "goals";

export const RESOURCES: Record<
  Resource,
  {
    view: Permission;
    create: Permission;
    edit: Permission;
    remove: Permission;
    schema: ZodObject<ZodRawShape>;
    label: string;
  }
> = {
  transactions: {
    view: "transactions.view",
    create: "transactions.create",
    edit: "transactions.edit",
    remove: "transactions.delete",
    schema: transactionSchema,
    label: "Movimentação",
  },
  accounts: { view: "accounts.view", create: "accounts.manage", edit: "accounts.manage", remove: "accounts.manage", schema: accountSchema, label: "Conta" },
  categories: { view: "transactions.view", create: "family.manage", edit: "family.manage", remove: "family.manage", schema: categorySchema, label: "Categoria" },
  assets: { view: "assets.view", create: "assets.manage", edit: "assets.manage", remove: "assets.manage", schema: assetSchema, label: "Patrimônio" },
  budgets: { view: "transactions.view", create: "budgets.manage", edit: "budgets.manage", remove: "budgets.manage", schema: budgetSchema, label: "Orçamento" },
  goals: { view: "family.view", create: "goals.manage", edit: "goals.manage", remove: "goals.manage", schema: goalSchema, label: "Meta" },
};

export function isResource(value: string): value is Resource {
  return Object.prototype.hasOwnProperty.call(RESOURCES, value);
}

/** Converte o payload validado (valores em reais) para os campos persistidos (centavos). */
export function mapResourceData(resource: Resource, body: Record<string, unknown>, context: { familyId: string; userId: string }) {
  const data: Record<string, unknown> = {};
  const set = (key: string, value: unknown) => {
    if (value !== undefined) data[key] = value;
  };

  switch (resource) {
    case "transactions":
      set("familyId", context.familyId);
      set("createdById", context.userId);
      set("type", body.type);
      set("amountCents", body.amount);
      set("description", body.description);
      set("notes", body.notes ?? null);
      set("date", body.date);
      set("accountId", body.accountId ?? null);
      set("categoryId", body.categoryId ?? null);
      set("documentId", body.documentId ?? null);
      set("isRecurring", body.isRecurring ?? false);
      set("recurrence", body.recurrence ?? null);
      break;
    case "accounts":
      set("familyId", context.familyId);
      set("name", body.name);
      set("type", body.type);
      set("institution", body.institution ?? null);
      set("balanceCents", body.balance);
      set("color", body.color);
      set("isActive", body.isActive ?? true);
      break;
    case "categories":
      set("familyId", context.familyId);
      set("name", body.name);
      set("type", body.type);
      set("color", body.color);
      set("icon", body.icon);
      break;
    case "assets":
      set("familyId", context.familyId);
      set("type", body.type);
      set("name", body.name);
      set("description", body.description ?? null);
      set("acquisitionValueCents", body.acquisitionValue);
      set("currentValueCents", body.currentValue);
      set("acquisitionDate", body.acquisitionDate);
      set("location", body.location ?? null);
      set("documentId", body.documentId ?? null);
      break;
    case "budgets":
      set("familyId", context.familyId);
      set("categoryId", body.categoryId ?? null);
      set("month", body.month);
      set("limitCents", body.limit);
      break;
    case "goals":
      set("familyId", context.familyId);
      set("name", body.name);
      set("targetCents", body.target);
      set("currentCents", body.current ?? 0);
      set("deadline", body.deadline ?? null);
      set("color", body.color);
      set("description", body.description ?? null);
      break;
  }
  return data;
}

export const resourceInclude: Partial<Record<Resource, unknown>> = {
  transactions: { category: { select: { name: true, color: true } }, account: { select: { name: true } } },
  assets: { valuations: { orderBy: { date: "desc" } } },
  budgets: { category: { select: { name: true, color: true } } },
};

export const resourceOrderBy: Partial<Record<Resource, unknown>> = {
  transactions: { date: "desc" },
  accounts: { createdAt: "asc" },
  assets: { currentValueCents: "desc" },
  budgets: { month: "desc" },
  goals: { createdAt: "desc" },
  categories: { name: "asc" },
};
