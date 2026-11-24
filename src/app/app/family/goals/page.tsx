import { CheckCircle2, Target, TrendingUp } from "lucide-react";
import { Card, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { StatCard } from "@/components/dashboard/parts";
import { ResourceTable } from "@/components/tables/resource-table";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { resolveFamilyPage } from "@/lib/page-helpers";

export const metadata = { title: "Metas" };

export default async function GoalsPage({ searchParams }: { searchParams: Promise<{ familyId?: string }> }) {
  const { family, permissions } = await resolveFamilyPage(searchParams);
  if (!family) return <Card><EmptyState title="Nenhuma família selecionada" description="Escolha uma família para visualizar metas." /></Card>;
  if (!permissions.includes("family.view")) return <Card><EmptyState title="Acesso restrito" description="Você não tem permissão para visualizar metas." /></Card>;
  const goals = await prisma.goal.findMany({ where: { familyId: family.id }, orderBy: { createdAt: "desc" } });
  const target = goals.reduce((acc, goal) => acc + goal.targetCents, 0);
  const current = goals.reduce((acc, goal) => acc + goal.currentCents, 0);

  return (
    <div className="space-y-6">
      <SectionHeading title="Metas financeiras" subtitle="Acompanhe objetivos e celebrate cada conquista da família." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total planejado" value={formatMoney(target)} icon={<Target className="h-4 w-4" />} />
        <StatCard label="Já conquistado" value={formatMoney(current)} icon={<TrendingUp className="h-4 w-4" />} tone="success" />
        <StatCard label="Metas concluídas" value={String(goals.filter((goal) => goal.completedAt || (goal.targetCents > 0 && goal.currentCents >= goal.targetCents)).length)} icon={<CheckCircle2 className="h-4 w-4" />} tone="amber" />
      </div>
      <ResourceTable resource="goals" familyId={family.id} items={goals} canManage={permissions.includes("goals.manage")} />
    </div>
  );
}
