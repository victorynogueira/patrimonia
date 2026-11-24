import { Building2, Landmark, TrendingUp, Wallet } from "lucide-react";
import { Card, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { StatCard } from "@/components/dashboard/parts";
import { ResourceTable } from "@/components/tables/resource-table";
import { prisma } from "@/lib/db";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { resolveFamilyPage } from "@/lib/page-helpers";

export const metadata = { title: "Patrimônio" };

export default async function AssetsPage({ searchParams }: { searchParams: Promise<{ familyId?: string }> }) {
  const { family, permissions } = await resolveFamilyPage(searchParams);
  if (!family) return <Card><EmptyState title="Nenhuma família selecionada" description="Escolha uma família para visualizar o patrimônio." /></Card>;
  if (!permissions.includes("assets.view")) return <Card><EmptyState title="Acesso restrito" description="Você não tem permissão para visualizar o patrimônio desta família." /></Card>;
  const assets = await prisma.asset.findMany({ where: { familyId: family.id }, include: { valuations: { orderBy: { date: "desc" } } }, orderBy: { currentValueCents: "desc" } });
  const accounts = await prisma.account.findMany({ where: { familyId: family.id, isActive: true }, select: { id: true, name: true } });
  const documents = await prisma.document.findMany({ where: { familyId: family.id }, select: { id: true, name: true } });
  const current = assets.reduce((acc, asset) => acc + asset.currentValueCents, 0);
  const acquired = assets.reduce((acc, asset) => acc + asset.acquisitionValueCents, 0);
  const balance = (await prisma.account.aggregate({ where: { familyId: family.id, isActive: true }, _sum: { balanceCents: true } }))._sum.balanceCents ?? 0;

  return (
    <div className="space-y-6">
      <SectionHeading title="Patrimônio" subtitle="Imóveis, veículos, investimentos, participações e outros bens da família." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Patrimônio total" value={formatMoneyCompact(current + balance)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Valor dos bens" value={formatMoneyCompact(current)} icon={<Building2 className="h-4 w-4" />} footnote={`${assets.length} ativos`} />
        <StatCard label="Valorização" value={formatMoney(current - acquired)} icon={<TrendingUp className="h-4 w-4" />} tone={current >= acquired ? "success" : "danger"} />
        <StatCard label="Saldos" value={formatMoneyCompact(balance)} icon={<Landmark className="h-4 w-4" />} tone="amber" />
      </div>
      <ResourceTable resource="assets" familyId={family.id} items={assets} canManage={permissions.includes("assets.manage")} options={{ documents }} />
      {assets.length && assets[0]?.valuations.length ? (
        <Card><div className="p-5"><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Histórico de valorização</h3><p className="mt-1 text-xs text-slate-500">Últimas avaliações registradas por bem</p><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{assets.filter((asset) => asset.valuations.length).map((asset) => <div key={asset.id} className="surface-soft p-3"><p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{asset.name}</p><div className="mt-2 space-y-1">{asset.valuations.slice(0, 3).map((valuation) => <div key={valuation.id} className="flex justify-between text-[11px] text-slate-500"><span>{new Date(valuation.date).toLocaleDateString("pt-BR")}</span><span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{formatMoney(valuation.valueCents)}</span></div>)}</div></div>)}</div></div></Card>
      ) : null}
      {accounts.length ? <p className="text-[11px] text-slate-400">Dica: contas bancárias são administradas na aba <a href="/app/family/accounts" className="font-semibold text-brand-600">Contas</a>.</p> : null}
    </div>
  );
}
