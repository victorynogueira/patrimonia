export type TxLike = {
  type: string;
  amountCents: number;
  date: Date | string;
  description?: string;
  category?: { name: string } | null;
};

export type AssetLike = { currentValueCents: number; acquisitionValueCents: number };
export type BudgetLike = { categoryId: string | null; limitCents: number; month: string };
export type Insight = {
  id: string;
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  description: string;
  action?: string;
};

export function monthKey(date: Date | string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function lastMonths(count: number, reference = new Date()) {
  const result: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    result.push(monthKey(d));
  }
  return result;
}

export function monthlyTotals(transactions: TxLike[], months = 6, reference = new Date()) {
  return lastMonths(months, reference).map((key) => {
    const [year, month] = key.split("-").map(Number);
    const label = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(year, month - 1, 1)).replace(".", "");
    const slice = transactions.filter((tx) => monthKey(tx.date) === key);
    const sum = (type: string) => slice.filter((tx) => tx.type === type).reduce((acc, tx) => acc + tx.amountCents, 0);
    const income = sum("INCOME");
    const expense = sum("EXPENSE");
    const profit = sum("PROFIT");
    return { key, label, income, expense, profit, net: income + profit - expense };
  });
}

/** Regressão linear simples sobre o saldo mensal acumulado para projetar os próximos meses. */
export function projectNet(transactions: TxLike[], ahead = 3, reference = new Date()) {
  const series = monthlyTotals(transactions, 6, reference);
  const n = series.length;
  if (n < 2) return { slope: 0, projections: [] as { key: string; value: number }[] };

  const meanX = (n - 1) / 2;
  const meanY = series.reduce((acc, item) => acc + item.net, 0) / n;
  let numerator = 0;
  let denominator = 0;
  series.forEach((item, index) => {
    numerator += (index - meanX) * (item.net - meanY);
    denominator += (index - meanX) ** 2;
  });
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;
  const projections = Array.from({ length: ahead }, (_, i) => {
    const d = new Date(reference.getFullYear(), reference.getMonth() + i + 1, 1);
    return { key: monthKey(d), value: Math.round(intercept + slope * (n + i)) };
  });
  return { slope, projections };
}

export function categoryBreakdown(transactions: TxLike[], type = "EXPENSE") {
  const map = new Map<string, { name: string; value: number }>();
  transactions
    .filter((tx) => tx.type === type)
    .forEach((tx) => {
      const name = tx.category?.name ?? "Sem categoria";
      map.set(name, { name, value: (map.get(name)?.value ?? 0) + tx.amountCents });
    });
  return [...map.values()].sort((a, b) => b.value - a.value);
}

export function buildInsights(params: {
  transactions: TxLike[];
  assets: AssetLike[];
  budgets?: BudgetLike[];
  goals?: { name: string; targetCents: number; currentCents: number }[];
  reference?: Date;
}): Insight[] {
  const { transactions, assets, budgets = [], goals = [], reference = new Date() } = params;
  const insights: Insight[] = [];
  const series = monthlyTotals(transactions, 6, reference);
  const current = series[series.length - 1];
  const previous = series[series.length - 2];
  const categories = categoryBreakdown(transactions);

  if (current && previous && previous.expense > 0) {
    const delta = ((current.expense - previous.expense) / previous.expense) * 100;
    if (delta > 25) {
      insights.push({
        id: "expense-spike",
        severity: "warning",
        title: "Despesas acima do habitual",
        description: `As despesas deste mês estão ${Math.round(delta)}% acima das do mês anterior. Revise as maiores categorias.`,
        action: "Ver movimentações",
      });
    }
  }

  const top = categories[0];
  const totalExpense = categories.reduce((acc, item) => acc + item.value, 0);
  if (top && totalExpense > 0) {
    const share = (top.value / totalExpense) * 100;
    if (share >= 35) {
      insights.push({
        id: "concentration",
        severity: "info",
        title: "Concentração de gastos",
        description: `"${top.name}" representa ${Math.round(share)}% das despesas registradas.`,
        action: "Analisar categoria",
      });
    }
  }

  const currentKey = monthKey(reference);
  budgets
    .filter((budget) => budget.month === currentKey)
    .forEach((budget) => {
      const spent = transactions
        .filter(
          (tx) =>
            tx.type === "EXPENSE" &&
            monthKey(tx.date) === currentKey &&
            (!budget.categoryId || (tx as { categoryId?: string | null }).categoryId === budget.categoryId),
        )
        .reduce((acc, tx) => acc + tx.amountCents, 0);
      const usage = budget.limitCents > 0 ? (spent / budget.limitCents) * 100 : 0;
      if (usage >= 80) {
        insights.push({
          id: `budget-${budget.categoryId ?? "geral"}`,
          severity: usage >= 100 ? "critical" : "warning",
          title: usage >= 100 ? "Orçamento estourado" : "Limite de gastos próximo",
          description: `${Math.round(usage)}% do orçamento do mês já foi utilizado.`,
          action: "Ver orçamentos",
        });
      }
    });

  const recurring = transactions.filter((tx) => tx.type === "EXPENSE" && /assinar|recorr|mensal|subscription/i.test(tx.description ?? ""));
  if (recurring.length >= 3) {
    insights.push({
      id: "recurring",
      severity: "info",
      title: "Despesas recorrentes identificadas",
      description: `${recurring.length} movimentações parecem ser assinaturas ou gastos recorrentes. Consolide esses lançamentos.`,
    });
  }

  const acquired = assets.reduce((acc, asset) => acc + asset.acquisitionValueCents, 0);
  const currentValue = assets.reduce((acc, asset) => acc + asset.currentValueCents, 0);
  if (acquired > 0) {
    const variation = ((currentValue - acquired) / acquired) * 100;
    insights.push({
      id: "patrimony-variation",
      severity: variation >= 0 ? "success" : "warning",
      title: variation >= 0 ? "Patrimônio em alta" : "Atenção à valorização dos bens",
      description: `A Carteira de ativos variou ${variation >= 0 ? "+" : ""}${variation.toFixed(1)}% em relação ao valor de aquisição.`,
      action: "Ver patrimônio",
    });
  }

  const forecast = projectNet(transactions, 1, reference);
  if (forecast.slope !== 0) {
    insights.push({
      id: "forecast",
      severity: forecast.slope > 0 ? "success" : "warning",
      title: "Projeção financeira",
      description:
        forecast.slope > 0
          ? "No ritmo atual, o resultado líquido tende a crescer nos próximos meses."
          : "No ritmo atual, o resultado líquido tende a cair nos próximos meses. Considere revisar despesas.",
    });
  }

  const nearGoal = goals.find((goal) => goal.targetCents > 0 && goal.currentCents / goal.targetCents >= 0.75 && goal.currentCents < goal.targetCents);
  if (nearGoal) {
    insights.push({
      id: "goal-near",
      severity: "success",
      title: "Meta próxima da conclusão",
      description: `A meta "${nearGoal.name}" atingiu ${Math.round((nearGoal.currentCents / nearGoal.targetCents) * 100)}% do objetivo.`,
    });
  }

  return insights.slice(0, 8);
}
