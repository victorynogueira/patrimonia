import { describe, expect, it } from "vitest";
import { budgetSchema, memberSchema, transactionSchema } from "@/lib/validators";

describe("validadores Zod", () => {
  it("rejeita valores monetários não positivos em transações", () => {
    const base = { type: "EXPENSE", description: "Mercado", date: "2026-11-20" };
    expect(transactionSchema.safeParse({ ...base, amount: "0,00" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...base, amount: "123,45" }).success).toBe(true);
  });

  it("valida formato de mês do orçamento", () => {
    expect(budgetSchema.safeParse({ month: "2026-13", limit: "100,00" }).success).toBe(false);
    expect(budgetSchema.safeParse({ month: "2026-11", limit: "100,00" }).success).toBe(true);
  });

  it("normaliza e-mail e aplica papel padrão em convites", () => {
    const parsed = memberSchema.parse({ email: "  Maria@Exemplo.COM " });
    expect(parsed).toMatchObject({ email: "maria@exemplo.com", role: "MEMBER" });
  });
});
