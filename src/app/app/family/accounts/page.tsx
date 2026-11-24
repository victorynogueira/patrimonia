import { Landmark, TrendingUp, Wallet } from "lucide-react";
import { Card, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { StatCard } from "@/components/dashboard/parts";
import { ResourceTable } from "@/components/tables/resource-table";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { resolveFamilyPage } from "@/lib/page-helpers";

export const metadata = { title: "Contas" };

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ familyId?: string }> }) {
  const { family, permissions } = await resolveFamilyPage(searchParams);
  if (!family) return <Card><EmptyState title="Nenhuma família selecionada" description="Escolha uma família para visualizar contas." /></Card>;
  if (!permissions.includes("accounts.view")) return <Card><EmptyState title="Acesso restrito" description="Você não tem permissão para visualizar contas." /></Card>;
  const accounts = await prisma.account.findMany({ where: { familyId: family.id }, orderBy: { createdAt: "asc" } });
  const active = accounts.filter((account) => account.isActive);
  const total = active.reduce((acc, account) => acc + account.balanceCents, 0);
  const invested = active.filter((account) => account.type === "INVESTMENT").reduce((acc, account) => acc + account.balanceCents, 0);

  return (
    <div className="space-y-6">
      <SectionHeading title="Contas e investimentos" subtitle="Saldos, instituições e movimentações por conta." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Saldo total" value={formatMoney(total)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Contas ativas" value={String(active.length)} icon={<Landmark className="h-4 w-4" />} tone="success" />
        <StatCard label="Em investimentos" value={formatMoney(invested)} icon={<TrendingUp className="h-4 w-4" />} tone="amber" />
      </div>
      <ResourceTable resource="accounts" familyId={family.id} items={accounts} canManage={permissions.includes("accounts.manage")} />
    </div>
  );
}
