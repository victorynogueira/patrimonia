import { Gauge, ShieldAlert, TrendingDown } from "lucide-react";
import { Card, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { StatCard } from "@/components/dashboard/parts";
import { ResourceTable } from "@/components/tables/resource-table";
import { prisma } from "@/lib/db";
import { monthKey } from "@/lib/insights";
import { formatMoney } from "@/lib/money";
import { resolveFamilyPage } from "@/lib/page-helpers";

export const metadata = { title: "Orçamentos" };

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ familyId?: string }> }) {
  const { family, permissions } = await resolveFamilyPage(searchParams);
  if (!family) return <Card><EmptyState title="Nenhuma família selecionada" description="Escolha uma família para visualizar orçamentos." /></Card>;
  if (!permissions.includes("transactions.view")) return <Card><EmptyState title="Acesso restrito" description="Você não tem permissão para visualizar orçamentos." /></Card>;
  const [budgets, transactions, categories] = await Promise.all([
    prisma.budget.findMany({ where: { familyId: family.id }, include: { category: { select: { name: true } } }, orderBy: { month: "desc" } }),
    prisma.transaction.findMany({ where: { familyId: family.id, type: "EXPENSE" } }),
    prisma.category.findMany({ where: { familyId: family.id }, select: { id: true, name: true, type: true } }),
  ]);
  const currentKey = monthKey(new Date());
  const enriched = budgets.map((budget) => {
    const spent = transactions.filter((tx) => monthKey(tx.date) === budget.month && (!budget.categoryId || tx.categoryId === budget.categoryId)).reduce((acc, tx) => acc + tx.amountCents, 0);
    return { ...budget, spent, percentage: budget.limitCents ? Math.round((spent / budget.limitCents) * 100) : 0, date: new Date(`${budget.month}-01`) };
  });
  const current = enriched.filter((budget) => budget.month === currentKey);
  const limit = current.reduce((acc, budget) => acc + budget.limitCents, 0);
  const spent = current.reduce((acc, budget) => acc + budget.spent, 0);

  return (
    <div className="space-y-6">
      <SectionHeading title="Orçamentos" subtitle="Defina limites por categoria e acompanhe o consumo mensal." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Limite do mês" value={formatMoney(limit)} icon={<Gauge className="h-4 w-4" />} />
        <StatCard label="Gasto no mês" value={formatMoney(spent)} icon={<TrendingDown className="h-4 w-4" />} tone={spent > limit ? "danger" : "success"} />
        <StatCard label="Orçamentos ativos" value={String(current.length)} icon={<ShieldAlert className="h-4 w-4" />} tone="amber" />
      </div>
      <ResourceTable resource="budgets" familyId={family.id} items={enriched} canManage={permissions.includes("budgets.manage")} options={{ categories }} />
    </div>
  );
}
