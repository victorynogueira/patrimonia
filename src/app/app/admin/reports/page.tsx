import Link from "next/link";
import { redirect } from "next/navigation";
import { FileSpreadsheet, FileText, FileDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/components/ui/card";
import { FlowBars } from "@/components/charts/overview-charts";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { monthlyTotals } from "@/lib/insights";

export const metadata = { title: "Relatórios gerenciais" };

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const user = await requireUser();
  if (user.globalRole !== "PROFESSIONAL") redirect("/app/family");
  const { period = "6" } = await searchParams;
  const months = [3, 6, 12, 24].includes(Number(period)) ? Number(period) : 6;
  const from = new Date();
  from.setMonth(from.getMonth() - months + 1);
  from.setDate(1);
  from.setHours(0, 0, 0, 0);

  const families = await prisma.family.findMany({ where: { ownerId: user.id }, select: { id: true, name: true, color: true, slug: true } });
  const transactions = await prisma.transaction.findMany({
    where: { familyId: { in: families.map((family) => family.id) }, date: { gte: from } },
    include: { family: { select: { name: true } } },
    orderBy: { date: "desc" },
  });
  const sum = (type: string) => transactions.filter((tx) => tx.type === type).reduce((acc, tx) => acc + tx.amountCents, 0);
  const byFamily = families.map((family) => {
    const rows = transactions.filter((tx) => tx.familyId === family.id);
    const income = rows.filter((tx) => tx.type === "INCOME").reduce((acc, tx) => acc + tx.amountCents, 0);
    const expense = rows.filter((tx) => tx.type === "EXPENSE").reduce((acc, tx) => acc + tx.amountCents, 0);
    const profit = rows.filter((tx) => tx.type === "PROFIT").reduce((acc, tx) => acc + tx.amountCents, 0);
    return { ...family, income, expense, profit, net: income + profit - expense, count: rows.length };
  });
  const query = `?from=${from.toISOString()}&to=${new Date().toISOString()}`;

  return (
    <div className="space-y-6">
      <SectionHeading title="Relatórios gerenciais" subtitle="Consolidação financeira de todas as famílias administradas." action={
        <div className="flex gap-1.5">{ [3, 6, 12, 24].map((value) => <Link key={value} href={`/app/admin/reports?period=${value}`} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${months === value ? "bg-brand-600 text-white" : "bg-white text-slate-500 hover:bg-slate-100 dark:bg-white/[.05] dark:text-slate-300"}`}>{value}m</Link>) }</div>
      } />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-5"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Receitas</p><p className="mt-2 text-xl font-bold text-emerald-600">{formatMoney(sum("INCOME"))}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Despesas</p><p className="mt-2 text-xl font-bold text-rose-600">{formatMoney(sum("EXPENSE"))}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Lucros e rendimentos</p><p className="mt-2 text-xl font-bold text-sky-600">{formatMoney(sum("PROFIT"))}</p></CardContent></Card>
      </div>
      <Card><CardHeader><div><CardTitle>Evolução consolidada</CardTitle><CardDescription>Receitas e despesas por mês · {months} meses</CardDescription></div></CardHeader><CardContent className="h-[300px] pt-2"><FlowBars data={monthlyTotals(transactions, Math.min(months, 12))} /></CardContent></Card>
      <Card>
        <CardHeader><div><CardTitle>Demonstrativo por família</CardTitle><CardDescription>Exportações disponíveis em CSV, Excel e PDF</CardDescription></div></CardHeader>
        <CardContent className="pt-2">
          {byFamily.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs">
            <thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-white/[.06]"><th className="pb-3 font-semibold">Família</th><th className="pb-3 text-right font-semibold">Receitas</th><th className="pb-3 text-right font-semibold">Despesas</th><th className="pb-3 text-right font-semibold">Lucros</th><th className="pb-3 text-right font-semibold">Resultado</th><th className="pb-3 text-right font-semibold">Exportar</th></tr></thead>
            <tbody>{byFamily.map((family) => (
              <tr key={family.id} className="border-b border-slate-50 last:border-0 dark:border-white/[.04]">
                <td className="py-3 font-semibold text-slate-800 dark:text-slate-100"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: family.color }} />{family.name}</span></td>
                <td className="py-3 text-right tabular-nums text-emerald-600">{formatMoney(family.income)}</td>
                <td className="py-3 text-right tabular-nums text-rose-600">{formatMoney(family.expense)}</td>
                <td className="py-3 text-right tabular-nums text-sky-600">{formatMoney(family.profit)}</td>
                <td className="py-3 text-right font-bold tabular-nums text-slate-800 dark:text-white">{formatMoney(family.net)}</td>
                <td className="py-3"><div className="flex justify-end gap-1">{[["csv", FileText], ["xlsx", FileSpreadsheet], ["pdf", FileDown]].map(([format, Icon]) => { const F = Icon as typeof FileText; return <a key={format as string} href={`/api/families/${family.id}/reports/export${query}&format=${format}`} title={`Exportar ${format}`} className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10"><F className="h-3.5 w-3.5" /></a>; })}</div></td>
              </tr>
            ))}</tbody>
          </table></div> : <p className="py-8 text-center text-xs text-slate-400">Cadastre famílias para gerar relatórios.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
