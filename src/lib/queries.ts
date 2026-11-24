import { prisma } from "./db";
import { buildInsights, categoryBreakdown, monthlyTotals, monthKey, projectNet, type TxLike } from "./insights";

const txInclude = { category: { select: { name: true, color: true } }, account: { select: { name: true } } } as const;

export async function getFamilyDashboard(familyId: string) {
  const [family, transactions, assets, accounts, budgets, goals, memberCount, documents, notifications] = await Promise.all([
    prisma.family.findUniqueOrThrow({ where: { id: familyId } }),
    prisma.transaction.findMany({
      where: { familyId },
      include: txInclude,
      orderBy: { date: "desc" },
      take: 600,
    }),
    prisma.asset.findMany({ where: { familyId }, orderBy: { currentValueCents: "desc" } }),
    prisma.account.findMany({ where: { familyId, isActive: true }, orderBy: { createdAt: "asc" } }),
    prisma.budget.findMany({ where: { familyId }, orderBy: { month: "desc" } }),
    prisma.goal.findMany({ where: { familyId }, orderBy: { createdAt: "desc" } }),
    prisma.familyMember.count({ where: { familyId, status: "ACTIVE" } }),
    prisma.document.count({ where: { familyId } }),
    prisma.notification.findMany({ where: { familyId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const now = new Date();
  const currentKey = monthKey(now);
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousKey = monthKey(previousDate);
  const sum = (items: TxLike[], type: string) => items.filter((tx) => tx.type === type).reduce((acc, tx) => acc + tx.amountCents, 0);

  const monthTx = transactions.filter((tx) => monthKey(tx.date) === currentKey);
  const previousTx = transactions.filter((tx) => monthKey(tx.date) === previousKey);
  const assetTotal = assets.reduce((acc, asset) => acc + asset.currentValueCents, 0);
  const balance = accounts.reduce((acc, account) => acc + account.balanceCents, 0);

  const series = monthlyTotals(transactions, 6, now);
  const patrimonySeries = series.map((item, index) => ({
    key: item.key,
    label: item.label,
    value: Math.round(assetTotal + balance - series.slice(index + 1).reduce((acc, s) => acc + s.net, 0)),
  }));

  const currentBudgets = budgets.filter((budget) => budget.month === currentKey);
  const budgetUsage = currentBudgets.map((budget) => {
    const spent = monthTx
      .filter((tx) => tx.type === "EXPENSE" && (!budget.categoryId || (tx as { categoryId?: string | null }).categoryId === budget.categoryId))
      .reduce((acc, tx) => acc + tx.amountCents, 0);
    return { ...budget, spent, percentage: budget.limitCents > 0 ? Math.round((spent / budget.limitCents) * 100) : 0 };
  });

  return {
    family,
    totals: {
      patrimony: assetTotal + balance,
      balance,
      assetTotal,
      income: sum(monthTx, "INCOME"),
      expense: sum(monthTx, "EXPENSE"),
      profit: sum(monthTx, "PROFIT"),
      previousIncome: sum(previousTx, "INCOME"),
      previousExpense: sum(previousTx, "EXPENSE"),
      previousProfit: sum(previousTx, "PROFIT"),
      net: sum(monthTx, "INCOME") + sum(monthTx, "PROFIT") - sum(monthTx, "EXPENSE"),
    },
    series,
    patrimonySeries,
    categories: categoryBreakdown(transactions, "EXPENSE"),
    incomeCategories: categoryBreakdown(transactions, "INCOME"),
    assets,
    accounts,
    budgets: budgetUsage,
    goals,
    memberCount,
    documentCount: documents,
    notifications,
    recentTransactions: transactions.slice(0, 8),
    transactions,
    projection: projectNet(transactions, 3, now),
    insights: buildInsights({
      transactions,
      assets,
      budgets,
      goals: goals.map((goal) => ({ name: goal.name, targetCents: goal.targetCents, currentCents: goal.currentCents })),
      reference: now,
    }),
  };
}

export async function getAdminDashboard(ownerId: string) {
  const families = await prisma.family.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true, transactions: true, assets: true } },
    },
  });
  const familyIds = families.map((family) => family.id);

  const [transactions, assets, accounts, audits, memberCount, userCount] = await Promise.all([
    prisma.transaction.findMany({
      where: { familyId: { in: familyIds } },
      include: { family: { select: { name: true, color: true } }, category: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 1000,
    }),
    prisma.asset.findMany({ where: { familyId: { in: familyIds } } }),
    prisma.account.findMany({ where: { familyId: { in: familyIds }, isActive: true } }),
    prisma.auditLog.findMany({
      where: { familyId: { in: familyIds } },
      include: { actor: { select: { name: true, avatarColor: true } }, family: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.familyMember.count({ where: { familyId: { in: familyIds }, status: "ACTIVE" } }),
    prisma.user.count(),
  ]);

  const now = new Date();
  const currentKey = monthKey(now);
  const monthTx = transactions.filter((tx) => monthKey(tx.date) === currentKey);
  const sum = (items: TxLike[], type: string) => items.filter((tx) => tx.type === type).reduce((acc, tx) => acc + tx.amountCents, 0);

  const perFamily = families.map((family) => {
    const familyTx = transactions.filter((tx) => tx.familyId === family.id);
    const familyAssets = assets.filter((asset) => asset.familyId === family.id);
    const familyAccounts = accounts.filter((account) => account.familyId === family.id);
    const current = familyTx.filter((tx) => monthKey(tx.date) === currentKey);
    return {
      id: family.id,
      name: family.name,
      color: family.color,
      status: family.status,
      members: family._count.members,
      transactions: family._count.transactions,
      assets: family._count.assets,
      patrimony:
        familyAssets.reduce((acc, asset) => acc + asset.currentValueCents, 0) +
        familyAccounts.reduce((acc, account) => acc + account.balanceCents, 0),
      income: sum(current, "INCOME") + sum(current, "PROFIT"),
      expense: sum(current, "EXPENSE"),
      updatedAt: family.updatedAt,
    };
  });

  return {
    families,
    perFamily,
    totals: {
      families: families.length,
      activeFamilies: families.filter((family) => family.status === "ACTIVE").length,
      members: memberCount,
      users: userCount,
      patrimony: perFamily.reduce((acc, item) => acc + item.patrimony, 0),
      income: sum(monthTx, "INCOME") + sum(monthTx, "PROFIT"),
      expense: sum(monthTx, "EXPENSE"),
      profit: sum(monthTx, "PROFIT"),
      transactions: transactions.length,
    },
    series: monthlyTotals(transactions, 6, now),
    categories: categoryBreakdown(transactions, "EXPENSE"),
    recentTransactions: transactions.slice(0, 8),
    audits,
    insights: buildInsights({ transactions, assets, reference: now }),
  };
}

export async function getReportData(familyId: string, from: Date, to: Date) {
  const [family, transactions, assets, accounts, categories] = await Promise.all([
    prisma.family.findUniqueOrThrow({ where: { id: familyId } }),
    prisma.transaction.findMany({
      where: { familyId, date: { gte: from, lte: to } },
      include: { category: { select: { name: true } }, account: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.asset.findMany({ where: { familyId }, orderBy: { currentValueCents: "desc" } }),
    prisma.account.findMany({ where: { familyId, isActive: true } }),
    prisma.category.findMany({ where: { familyId } }),
  ]);
  return {
    family,
    transactions,
    assets,
    accounts,
    categories,
    totals: {
      income: transactions.filter((tx) => tx.type === "INCOME").reduce((acc, tx) => acc + tx.amountCents, 0),
      expense: transactions.filter((tx) => tx.type === "EXPENSE").reduce((acc, tx) => acc + tx.amountCents, 0),
      profit: transactions.filter((tx) => tx.type === "PROFIT").reduce((acc, tx) => acc + tx.amountCents, 0),
      assetTotal: assets.reduce((acc, asset) => acc + asset.currentValueCents, 0),
      balance: accounts.reduce((acc, account) => acc + account.balanceCents, 0),
    },
    series: monthlyTotals(transactions, 12, to),
    expenseCategories: categoryBreakdown(transactions, "EXPENSE"),
    incomeCategories: categoryBreakdown(transactions, "INCOME"),
  };
}
