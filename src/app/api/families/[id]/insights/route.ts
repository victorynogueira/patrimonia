import { authHandler, ok } from "@/lib/api";
import { requireFamilyContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildInsights, projectNet } from "@/lib/insights";

type Params = { id: string };

export const GET = authHandler<Params>(async ({ params }) => {
  await requireFamilyContext(params.id, "insights.view");
  const [transactions, assets, budgets, goals] = await Promise.all([
    prisma.transaction.findMany({ where: { familyId: params.id }, take: 600 }),
    prisma.asset.findMany({ where: { familyId: params.id } }),
    prisma.budget.findMany({ where: { familyId: params.id } }),
    prisma.goal.findMany({ where: { familyId: params.id } }),
  ]);
  return ok({
    insights: buildInsights({
      transactions,
      assets,
      budgets: budgets.map((budget) => ({ categoryId: budget.categoryId, limitCents: budget.limitCents, month: budget.month })),
      goals: goals.map((goal) => ({ name: goal.name, targetCents: goal.targetCents, currentCents: goal.currentCents })),
    }),
    projection: projectNet(transactions, 6),
  });
});
