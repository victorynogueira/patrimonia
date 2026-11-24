import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Building2, Landmark, Plus, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, EmptyState as Empty } from "@/components/ui/feedback";
import { StatCard, TransactionRows, InsightList, BudgetRows, GoalRows } from "@/components/dashboard/parts";
import { EvolutionChart, FlowBars, AllocationDonut } from "@/components/charts/overview-charts";
import { QuickTransaction } from "@/components/forms/quick-transaction";
import { FamilyPicker } from "@/components/layout/family-picker";
import { getAccessibleFamilies } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoneyCompact } from "@/lib/money";
import { getFamilyDashboard } from "@/lib/queries";
import { resolveFamilyPage } from "@/lib/page-helpers";

export default async function FamilyDashboardPage({ searchParams }: { searchParams: Promise<{ familyId?: string }> }) {
  const { user, family, context, permissions } = await resolveFamilyPage(searchParams);
  if (!family) {
    return (
      <div className="space-y-6">
        <SectionHeading title="Painel familiar" subtitle="Você ainda não tem acesso a nenhuma família." />
        <Card><Empty title="Nenhuma família vinculada" description={user.globalRole === "PROFESSIONAL" ? "Crie uma família no painel administrativo para começar." : "Solicite ao profissional responsável um convite de acesso."} action={<Link href={user.globalRole === "PROFESSIONAL" ? "/app/admin/families" : "/app/profile"} className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white">{user.globalRole === "PROFESSIONAL" ? "Criar família" : "Meu perfil"}</Link>} /></Card>
      </div>
    );
  }
  const data = await getFamilyDashboard(family.id);
  const canCreate = permissions.includes("transactions.create");
  const variation = (current: number, previous: number) => (previous === 0 ? 0 : ((current - previous) / previous) * 100);
  const [categoryOptions, families] = await Promise.all([
    prisma.category.findMany({ where: { familyId: family.id }, select: { id: true, name: true, type: true } }),
    getAccessibleFamilies(user),
  ]);
  const accounts = data.accounts.map((account) => ({ id: account.id, name: account.name }));
  const hrefs: Record<string, string> = { "Ver movimentações": "/app/family/transactions", "Analisar categoria": "/app/family/transactions", "Ver orçamentos": "/app/family/budgets", "Ver patrimônio": "/app/family/assets" };

  return (
    <div className="space-y-6">
      <SectionHeading
        title={`Olá, ${user.name.split(" ")[0]}`}
        subtitle={`Aqui está o resumo financeiro de ${family.name}.`}
        action={<div className="flex flex-wrap items-center gap-2"><FamilyPicker families={families.map((item) => ({ id: item.id, name: item.name, color: item.color }))} activeId={family.id} />{canCreate ? <QuickTransaction familyId={family.id} accounts={accounts} categories={categoryOptions} label="Lançar despesa" /> : null}</div>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Patrimônio total" value={formatMoneyCompact(data.totals.patrimony)} icon={<Wallet className="h-4 w-4" />} footnote="ativos + saldos" />
        <StatCard label="Saldo disponível" value={formatMoneyCompact(data.totals.balance)} icon={<Landmark className="h-4 w-4" />} footnote={`${data.accounts.length} contas`} tone="success" />
        <StatCard label="Receitas do mês" value={formatMoneyCompact(data.totals.income)} change={variation(data.totals.income, data.totals.previousIncome)} icon={<ArrowUpRight className="h-4 w-4" />} tone="success" />
        <StatCard label="Despesas do mês" value={formatMoneyCompact(data.totals.expense)} change={variation(data.totals.expense, data.totals.previousExpense)} icon={<ArrowDownRight className="h-4 w-4" />} tone="danger" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><div><CardTitle>Evolução patrimonial</CardTitle><CardDescription>Composição dos ativos nos últimos 6 meses</CardDescription></div><Badge tone="brand">{formatMoneyCompact(data.totals.profit)} em lucros</Badge></CardHeader>
          <CardContent className="h-[260px] pt-2"><EvolutionChart data={data.patrimonySeries} /></CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Distribuição dos gastos</CardTitle><CardDescription>Por categoria</CardDescription></div></CardHeader>
          <CardContent className="h-[260px] pt-2"><AllocationDonut data={data.categories.slice(0, 6)} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><div><CardTitle>Receitas × despesas</CardTitle><CardDescription>Fluxo mensal e resultado líquido</CardDescription></div><Link href="/app/family/reports" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">Relatórios →</Link></CardHeader>
          <CardContent className="h-[240px] pt-2"><FlowBars data={data.series} /></CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Insights inteligentes</CardTitle><CardDescription>Análises baseadas no seu histórico</CardDescription></div><Sparkles className="h-4 w-4 text-brand-500" /></CardHeader>
          <CardContent className="pt-2">{permissions.includes("insights.view") ? <InsightList insights={data.insights} hrefs={hrefs} /> : <EmptyState title="Recurso não habilitado" description="Peça acesso aos insights ao administrador da família." />}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><div><CardTitle>Últimas movimentações</CardTitle><CardDescription>Lançamentos mais recentes da família</CardDescription></div><Link href="/app/family/transactions" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">Ver todas →</Link></CardHeader>
          <CardContent className="pt-2"><TransactionRows items={data.recentTransactions} href="/app/family/transactions" /></CardContent>
        </Card>
        <div className="space-y-4">
          <Card><CardHeader><div><CardTitle>Orçamentos</CardTitle><CardDescription>Uso do limite mensal</CardDescription></div></CardHeader><CardContent className="pt-2"><BudgetRows budgets={data.budgets.map((budget) => ({ ...budget, category: budget.categoryId ? { name: categoryOptions.find((category) => category.id === budget.categoryId)?.name ?? "Categoria" } : null }))} /></CardContent></Card>
          <Card><CardHeader><div><CardTitle>Metas financeiras</CardTitle><CardDescription>Progresso dos objetivos</CardDescription></div><TrendingUp className="h-4 w-4 text-emerald-500" /></CardHeader><CardContent className="pt-2"><GoalRows goals={data.goals} /></CardContent></Card>
          <Card><CardHeader><div><CardTitle>Composição patrimonial</CardTitle><CardDescription>Bens e ativos da família</CardDescription></div><Building2 className="h-4 w-4 text-slate-400" /></CardHeader><CardContent className="pt-2"><div className="space-y-2">{data.assets.slice(0, 4).map((asset) => <div key={asset.id} className="flex items-center justify-between text-xs"><span className="truncate text-slate-600 dark:text-slate-300">{asset.name}</span><span className="shrink-0 font-semibold tabular-nums text-slate-800 dark:text-white">{formatMoneyCompact(asset.currentValueCents)}</span></div>)}{!data.assets.length ? <p className="text-xs text-slate-400">Nenhum bem cadastrado.</p> : null}</div></CardContent></Card>
        </div>
      </div>
      {context?.isOwner ? null : <p className="text-center text-[11px] text-slate-400">Acesso restrito às permissões concedidas para sua conta nesta família.</p>}
    </div>
  );
}
