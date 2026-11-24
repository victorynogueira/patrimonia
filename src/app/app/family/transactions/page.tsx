import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet } from "lucide-react";
import { Card, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { StatCard } from "@/components/dashboard/parts";
import { TransactionsTable } from "@/components/tables/transactions-table";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { resolveFamilyPage } from "@/lib/page-helpers";

export const metadata = { title: "Movimentações" };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ familyId?: string }> }) {
  const { family, permissions } = await resolveFamilyPage(searchParams);
  if (!family) return <Card><EmptyState title="Nenhuma família selecionada" description="Escolha uma família no painel administrativo." /></Card>;
  if (!permissions.includes("transactions.view")) return <Card><EmptyState title="Acesso restrito" description="Você não tem permissão para visualizar movimentações nesta família." /></Card>;

  const [transactions, accounts, categories, documents] = await Promise.all([
    prisma.transaction.findMany({ where: { familyId: family.id }, include: { category: { select: { name: true } }, account: { select: { name: true } } }, orderBy: { date: "desc" }, take: 1000 }),
    prisma.account.findMany({ where: { familyId: family.id }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { familyId: family.id }, select: { id: true, name: true, type: true }, orderBy: { name: "asc" } }),
    prisma.document.findMany({ where: { familyId: family.id }, select: { id: true, name: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const sum = (type: string) => transactions.filter((tx) => tx.type === type).reduce((acc, tx) => acc + tx.amountCents, 0);

  return (
    <div className="space-y-6">
      <SectionHeading title="Movimentações" subtitle={`Receitas, despesas, lucros e transferências de ${family.name}.`} action={<Link href="/app/family/documents" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">Documentos →</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Receitas" value={formatMoney(sum("INCOME"))} icon={<ArrowUpRight className="h-4 w-4" />} tone="success" />
        <StatCard label="Despesas" value={formatMoney(sum("EXPENSE"))} icon={<ArrowDownRight className="h-4 w-4" />} tone="danger" />
        <StatCard label="Lucros" value={formatMoney(sum("PROFIT"))} icon={<TrendingUp className="h-4 w-4" />} tone="amber" />
        <StatCard label="Saldo em contas" value={formatMoney(accounts.length ? (await prisma.account.aggregate({ where: { familyId: family.id, isActive: true }, _sum: { balanceCents: true } }))._sum.balanceCents ?? 0 : 0)} icon={<Wallet className="h-4 w-4" />} />
      </div>
      <TransactionsTable
        familyId={family.id}
        items={transactions.map((tx) => ({ ...tx, date: tx.date.toISOString(), notes: tx.notes ?? null }))}
        accounts={accounts}
        categories={categories}
        documents={documents}
        canCreate={permissions.includes("transactions.create")}
        canEdit={permissions.includes("transactions.edit")}
        canDelete={permissions.includes("transactions.delete")}
      />
    </div>
  );
}
