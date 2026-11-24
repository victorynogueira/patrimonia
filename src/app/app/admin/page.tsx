import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Building2, ChartNoAxesCombined, ShieldCheck, UsersRound, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/components/ui/card";
import { StatCard, TransactionRows, InsightList } from "@/components/dashboard/parts";
import { FlowBars, AllocationDonut } from "@/components/charts/overview-charts";
import { FamilyAction } from "@/components/forms/family-action";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { requireUser } from "@/lib/auth";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { getAdminDashboard } from "@/lib/queries";
import { initials } from "@/lib/utils";

export const metadata = { title: "Visão geral administrativa" };

export default async function AdminDashboardPage() {
  const user = await requireUser();
  if (user.globalRole !== "PROFESSIONAL") redirect("/app/family");
  const data = await getAdminDashboard(user.id);
  const variation = (current: number, previous: number) => (previous === 0 ? 0 : ((current - previous) / previous) * 100);
  const current = data.series[data.series.length - 1];
  const previous = data.series[data.series.length - 2];

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Visão geral administrativa"
        subtitle="Acompanhe todas as famílias, o patrimônio administrado e os indicadores consolidados."
        action={<FamilyAction />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Patrimônio administrado" value={formatMoneyCompact(data.totals.patrimony)} change={variation(current?.net ?? 0, previous?.net ?? 0)} icon={<Wallet className="h-4 w-4" />} footnote="em ativos e contas" tone="brand" />
        <StatCard label="Receitas e lucros" value={formatMoneyCompact(data.totals.income)} change={variation(current?.income ?? 0, previous?.income ?? 0)} icon={<ChartNoAxesCombined className="h-4 w-4" />} footnote="no mês atual" tone="success" />
        <StatCard label="Despesas" value={formatMoneyCompact(data.totals.expense)} change={variation(current?.expense ?? 0, previous?.expense ?? 0)} icon={<ArrowUpRight className="h-4 w-4" />} footnote="no mês atual" tone="danger" />
        <StatCard label="Famílias ativas" value={`${data.totals.activeFamilies} / ${data.totals.families}`} icon={<UsersRound className="h-4 w-4" />} footnote={`${data.totals.members} integrantes`} tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><div><CardTitle>Receitas × despesas</CardTitle><CardDescription>Evolução consolidada dos últimos 6 meses</CardDescription></div><Badge tone="brand">#{data.totals.transactions} lançamentos</Badge></CardHeader>
          <CardContent className="h-[260px] pt-2"><FlowBars data={data.series} /></CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Distribuição de gastos</CardTitle><CardDescription>Por categoria no período</CardDescription></div></CardHeader>
          <CardContent className="h-[260px] pt-2"><AllocationDonut data={data.categories.slice(0, 6)} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><div><CardTitle>Famílias administradas</CardTitle><CardDescription>Clique em uma família para ver detalhes e gerenciar acessos</CardDescription></div><Link href="/app/admin/families" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">Ver todas →</Link></CardHeader>
        <CardContent className="pt-3">
          {data.perFamily.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-white/[.06]"><th className="pb-3 font-semibold">Família</th><th className="pb-3 font-semibold">Status</th><th className="pb-3 text-right font-semibold">Patrimônio</th><th className="pb-3 text-right font-semibold">Receitas</th><th className="pb-3 text-right font-semibold">Despesas</th><th className="pb-3 text-right font-semibold">Integrantes</th><th className="pb-3" /></tr></thead>
                <tbody>
                  {data.perFamily.map((family) => (
                    <tr key={family.id} className="border-b border-slate-50 last:border-0 dark:border-white/[.04]">
                      <td className="py-3"><span className="flex items-center gap-2.5"><span className="h-7 w-7 rounded-lg" style={{ background: `${family.color}22` }}><Building2 className="m-auto h-3.5 w-3.5" style={{ color: family.color }} /></span><span className="font-semibold text-slate-800 dark:text-slate-100">{family.name}</span></span></td>
                      <td className="py-3"><Badge tone={family.status === "ACTIVE" ? "success" : "warning"}>{family.status === "ACTIVE" ? "Ativa" : "Suspensa"}</Badge></td>
                      <td className="py-3 text-right font-semibold tabular-nums text-slate-800 dark:text-slate-100">{formatMoney(family.patrimony)}</td>
                      <td className="py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatMoney(family.income)}</td>
                      <td className="py-3 text-right tabular-nums text-rose-600 dark:text-rose-400">{formatMoney(family.expense)}</td>
                      <td className="py-3 text-right text-slate-500">{family.members}</td>
                      <td className="py-3 text-right"><Link href={`/app/admin/families/${family.id}`} className="text-brand-600 hover:underline dark:text-brand-400">Abrir →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="Nenhuma família cadastrada" description="Crie a primeira família para começar a administrar patrimônios." />}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><div><CardTitle>Atividade recente</CardTitle><CardDescription>Últimas movimentações consolidadas</CardDescription></div></CardHeader><CardContent className="pt-2"><TransactionRows items={data.recentTransactions.map((tx) => ({ ...tx, category: tx.category ? { name: tx.category.name } : null }))} /></CardContent></Card>
        <div className="space-y-4">
          <Card><CardHeader><div><CardTitle>Insights gerenciais</CardTitle><CardDescription>Análises automáticas do portfólio</CardDescription></div></CardHeader><CardContent className="pt-2"><InsightList insights={data.insights} hrefs={{ "Ver movimentações": "/app/family/transactions", "Ver patrimônio": "/app/family/assets" }} /></CardContent></Card>
          <Card><CardHeader><div><CardTitle>Auditoria</CardTitle><CardDescription>Últimas ações registradas</CardDescription></div><ShieldCheck className="h-4 w-4 text-slate-400" /></CardHeader><CardContent className="pt-2">
            <div className="space-y-3">
              {data.audits.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center gap-2.5 text-[11px]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-bold text-slate-500 dark:bg-white/[.06] dark:text-slate-300">{initials(log.actor.name)}</span>
                  <span className="min-w-0 flex-1 truncate text-slate-500 dark:text-slate-400"><strong className="text-slate-700 dark:text-slate-200">{log.actor.name}</strong> · {log.action.toLowerCase()} {log.entity.toLowerCase()} {log.family?.name ? `em ${log.family.name}` : ""}</span>
                  <span className="shrink-0 text-slate-400">{new Date(log.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
