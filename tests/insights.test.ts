import { describe, expect, it } from "vitest";
import { buildInsights, categoryBreakdown, lastMonths, monthlyTotals, projectNet, type TxLike } from "@/lib/insights";

const reference = new Date(2026, 10, 15);

function tx(type: string, amountCents: number, monthOffset = 0, category?: string, description = ""): TxLike {
  const date = new Date(reference.getFullYear(), reference.getMonth() + monthOffset, 10);
  return { type, amountCents, date, category: category ? { name: category } : null, description };
}

describe("insights", () => {
  it("agrupa meses consecutivos", () => {
    expect(lastMonths(3, reference)).toEqual(["2026-09", "2026-10", "2026-11"]);
  });

  it("calcula totais mensais e resultado líquido", () => {
    const series = monthlyTotals([tx("INCOME", 100000), tx("PROFIT", 20000), tx("EXPENSE", 40000)], 1, reference);
    expect(series[0]).toMatchObject({ income: 100000, profit: 20000, expense: 40000, net: 80000 });
  });

  it("ranqueia categorias por gasto", () => {
    const breakdown = categoryBreakdown([tx("EXPENSE", 1000, 0, "Alimentação"), tx("EXPENSE", 3000, 0, "Moradia")]);
    expect(breakdown[0]).toEqual({ name: "Moradia", value: 3000 });
  });

  it("projeta tendência linear", () => {
    const transactions = [
      tx("INCOME", 100000, -5), tx("EXPENSE", 20000, -5),
      tx("INCOME", 100000, -4), tx("EXPENSE", 30000, -4),
      tx("INCOME", 100000, -3), tx("EXPENSE", 40000, -3),
      tx("INCOME", 100000, -2), tx("EXPENSE", 50000, -2),
      tx("INCOME", 100000, -1), tx("EXPENSE", 60000, -1),
      tx("INCOME", 100000, 0), tx("EXPENSE", 70000, 0),
    ];
    const { slope, projections } = projectNet(transactions, 2, reference);
    expect(slope).toBeLessThan(0);
    expect(projections).toHaveLength(2);
  });

  it("gera alertas de pico de gasto, orçamento e valorização", () => {
    const insights = buildInsights({
      transactions: [tx("EXPENSE", 50000, -1, "Moradia"), tx("EXPENSE", 100000, 0, "Moradia")],
      assets: [{ acquisitionValueCents: 100000, currentValueCents: 120000 }],
      budgets: [{ categoryId: null, limitCents: 100000, month: "2026-11" }],
      reference,
    });
    const ids = insights.map((item) => item.id);
    expect(ids).toContain("expense-spike");
    expect(ids).toContain("budget-geral");
    expect(ids).toContain("patrimony-variation");
  });
});
