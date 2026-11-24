import Link from "next/link";
import { FileDown, FileSpreadsheet, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { FlowBars, AllocationDonut, EvolutionChart } from "@/components/charts/overview-charts";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { getReportData } from "@/lib/queries";
import { resolveFamilyPage } from "@/lib/page-helpers";

export const metadata = { title: "Relatórios" };

const formats = [
  { key: "csv", label: "CSV", icon: FileText },
  { key: "xlsx", label: "Excel", icon: FileSpreadsheet },
  { key: "pdf", label: "PDF", icon: FileDown },
];

export default async function FamilyReportsPage({ searchParams }: { searchParams: Promise<{ familyId?: string; period?: string }> }) {
  const params = await searchParams;
  const { family, permissions } = await resolveFamilyPage(searchParams);
  if (!family) return <Card><EmptyState title="Nenhuma família selecionada" description="Escolha uma família para gerar relatórios." /></Card>;
  if (!permissions.includes("reports.view")) return <Card><EmptyState title="Acesso restrito" description="Você não tem permissão para visualizar relatórios." /></Card>;
  const months = [3, 6, 12, 24].includes(Number(params.period)) ? Number(params.period) : 6;
  const from = new Date(); from.setMonth(from.getMonth() - months + 1); from.setDate(1); from.setHours(0, 0, 0, 0);
  const to = new Date();
  const data = await getReportData(family.id, from, to);
  const query = `from=${from.toISOString()}&to=${to.toISOString()}`;
  const patrimonySeries = data.series.map((item) => ({ ...item, value: data.totals.balance + data.totals.assetTotal }));

  return (
    <div className="space-y-6">
      <SectionHeading title="Relatórios" subtitle={`Demonstrativos financeiros de ${family.name}`} action={<div className="flex gap-1.5">{ [3, 6, 12, 24].map((value) => <Link key={value} href={`/app/family/reports?period=${value}${params.familyId ? `&familyId=${params.familyId}` : ""}`} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${months === value ? "bg-brand-600 text-white" : "bg-white text-slate-500 hover:bg-slate-100 dark:bg-white/[.05] dark:text-slate-300"}`}>{value}m</Link>) }</div>} />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
          <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Período analisado</p><p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">{from.toLocaleDateString("pt-BR")} — {to.toLocaleDateString("pt-BR")}</p></div>
          <div className="flex flex-wrap gap-2">{formats.map(({ key, label, icon: Icon }) => <a key={key} href={`/api/families/${family.id}/reports/export?${query}&format=${key}`} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-200"><Icon className="h-3.5 w-3.5" /> {label}</a>)}</div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Receitas", value: data.totals.income, tone: "text-emerald-600" },
          { label: "Despesas", value: data.totals.expense, tone: "text-rose-600" },
          { label: "Lucros e rendimentos", value: data.totals.profit, tone: "text-sky-600" },
          { label: "Resultado", value: data.totals.income + data.totals.profit - data.totals.expense, tone: "text-slate-900 dark:text-white" },
        ].map((item) => <Card key={item.label}><CardContent className="pt-5"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p><p className={`mt-2 text-xl font-bold ${item.tone}`}>{formatMoney(item.value)}</p></CardContent></Card>)}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardHeader><div><CardTitle>Fluxo financeiro</CardTitle><CardDescription>Receitas e despesas por mês</CardDescription></div><Badge tone="brand">{data.transactions.length} lançamentos</Badge></CardHeader><CardContent className="h-[280px] pt-2"><FlowBars data={data.series} /></CardContent></Card>
        <Card><CardHeader><div><CardTitle>Despesas por categoria</CardTitle><CardDescription>Distribuição no período</CardDescription></div></CardHeader><CardContent className="h-[280px] pt-2"><AllocationDonut data={data.expenseCategories} /></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><div><CardTitle>Evolução patrimonial</CardTitle><CardDescription>Posição consolidada estimada</CardDescription></div><TrendingUp className="h-4 w-4 text-brand-500" /></CardHeader><CardContent className="h-[240px] pt-2"><EvolutionChart data={patrimonySeries} /></CardContent></Card>
        <Card>
          <CardHeader><div><CardTitle>Receitas por categoria</CardTitle><CardDescription>Origem dos rendimentos</CardDescription></div></CardHeader>
          <CardContent className="pt-2">{data.incomeCategories.length ? <div className="space-y-3">{data.incomeCategories.map((category, index) => <div key={category.name} className="flex items-center justify-between text-xs"><span className="text-slate-600 dark:text-slate-300">{category.name}</span><span className="font-semibold tabular-nums text-emerald-600">{formatMoney(category.value)}</span></div>)}</div> : <p className="py-8 text-center text-xs text-slate-400">Sem receitas no período.</p>}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><div><CardTitle>Demonstrativo de movimentações</CardTitle><CardDescription>Últimos lançamentos do período selecionado</CardDescription></div></CardHeader>
        <CardContent className="pt-2"><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-white/[.06]"><th className="pb-3 font-semibold">Data</th><th className="pb-3 font-semibold">Descrição</th><th className="pb-3 font-semibold">Categoria</th><th className="pb-3 text-right font-semibold">Valor</th></tr></thead><tbody>{data.transactions.slice(0, 40).map((tx) => <tr key={tx.id} className="border-b border-slate-50 dark:border-white/[.04]"><td className="py-2.5 text-slate-500">{new Date(tx.date).toLocaleDateString("pt-BR")}</td><td className="py-2.5 font-medium text-slate-700 dark:text-slate-200">{tx.description}</td><td className="py-2.5 text-slate-400">{tx.category?.name ?? "—"}</td><td className="py-2.5 text-right font-semibold tabular-nums text-slate-800 dark:text-white">{formatMoney(tx.amountCents)}</td></tr>)}</tbody></table></div></CardContent>
      </Card>
    </div>
  );
}
