import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, ExternalLink, Landmark, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard, TransactionRows } from "@/components/dashboard/parts";
import { MemberManager } from "@/components/forms/member-manager";
import { FamilyAction } from "@/components/forms/family-action";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { getFamilyDashboard } from "@/lib/queries";

export default async function FamilyAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (user.globalRole !== "PROFESSIONAL") redirect("/app/family");
  const family = await prisma.family.findFirst({
    where: { id, OR: [{ ownerId: user.id }, { members: { some: { userId: user.id, role: "ADMIN" } } }] },
  });
  if (!family) notFound();

  const [members, invites, dashboard] = await Promise.all([
    prisma.familyMember.findMany({ where: { familyId: id }, include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.invite.findMany({ where: { familyId: id, acceptedAt: null }, orderBy: { createdAt: "desc" } }),
    getFamilyDashboard(id),
  ]);
  const isOwner = family.ownerId === user.id;

  return (
    <div className="space-y-6">
      <Link href="/app/admin/families" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400"><ArrowLeft className="h-3.5 w-3.5" /> Famílias</Link>
      <SectionHeading
        title={family.name}
        subtitle={family.description ?? "Detalhes da família e controle de acessos."}
        action={<div className="flex items-center gap-2"><Badge tone={family.status === "ACTIVE" ? "success" : "warning"}>{family.status === "ACTIVE" ? "Ativa" : "Suspensa"}</Badge>{isOwner ? <FamilyAction initial={{ ...family }} variant="outline" label="Editar família" /> : null}<Link href={`/app/family?familyId=${family.id}`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">Abrir painel <ExternalLink className="h-4 w-4" /></Link></div>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Patrimônio total" value={formatMoneyCompact(dashboard.totals.patrimony)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Receitas do mês" value={formatMoneyCompact(dashboard.totals.income)} icon={<Landmark className="h-4 w-4" />} tone="success" />
        <StatCard label="Despesas do mês" value={formatMoneyCompact(dashboard.totals.expense)} icon={<Building2 className="h-4 w-4" />} tone="danger" />
        <StatCard label="Bens cadastrados" value={`${dashboard.assets.length}`} icon={<Building2 className="h-4 w-4" />} tone="amber" footnote={`${dashboard.accounts.length} contas`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardContent className="pt-5"><MemberManager familyId={id} ownerId={family.ownerId} members={members} invites={invites.map((invite) => ({ ...invite, expiresAt: invite.expiresAt.toISOString(), createdAt: invite.createdAt.toISOString() }))} canManage={isOwner} /></CardContent></Card>
        <Card><CardHeader><div><CardTitle>Contas e ativos</CardTitle><CardDescription>Composição patrimonial da família</CardDescription></div></CardHeader><CardContent className="space-y-3 pt-2">
          {dashboard.accounts.map((account) => <div key={account.id} className="flex items-center justify-between gap-3 rounded-xl surface-soft px-3 py-2.5"><span className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200"><span className="h-2 w-2 rounded-full" style={{ background: account.color }} />{account.name}</span><span className="text-xs font-semibold tabular-nums text-slate-800 dark:text-white">{formatMoney(account.balanceCents)}</span></div>)}
          {dashboard.assets.slice(0, 4).map((asset) => <div key={asset.id} className="flex items-center justify-between gap-3 rounded-xl surface-soft px-3 py-2.5"><span className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{asset.name}</span><span className="shrink-0 text-xs font-semibold tabular-nums text-slate-800 dark:text-white">{formatMoney(asset.currentValueCents)}</span></div>)}
        </CardContent></Card>
      </div>

      <Card><CardHeader><div><CardTitle>Últimas movimentações</CardTitle><CardDescription>Histórico financeiro da família</CardDescription></div><Link href={`/app/family/transactions?familyId=${id}`} className="text-xs font-semibold text-brand-600 hover:underline">Ver todas →</Link></CardHeader><CardContent className="pt-2"><TransactionRows items={dashboard.recentTransactions} limit={6} /></CardContent></Card>
    </div>
  );
}
