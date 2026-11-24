import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ChevronRight, UsersRound } from "lucide-react";
import { Card, SectionHeading } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { FamilyAction } from "@/components/forms/family-action";
import { FamilyRowActions } from "@/components/forms/family-row-actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoneyCompact } from "@/lib/money";

export const metadata = { title: "Famílias" };

export default async function FamiliesPage() {
  const user = await requireUser();
  if (user.globalRole !== "PROFESSIONAL") redirect("/app/family");
  const families = await prisma.family.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true, transactions: true, assets: true, accounts: true } }, accounts: true, assets: true },
  });

  return (
    <div className="space-y-6">
      <SectionHeading title="Famílias" subtitle="Administre cadastros, acessos e informações financeiras de cada família." action={<FamilyAction />} />
      {families.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {families.map((family) => {
            const patrimony = family.assets.reduce((acc, asset) => acc + asset.currentValueCents, 0) + family.accounts.reduce((acc, account) => acc + account.balanceCents, 0);
            return (
              <Card key={family.id} className="overflow-hidden">
                <div className="h-1.5" style={{ background: family.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${family.color}1A`, color: family.color }}><Building2 className="h-5 w-5" /></span>
                    <div className="flex items-center gap-1"><Badge tone={family.status === "ACTIVE" ? "success" : "warning"}>{family.status === "ACTIVE" ? "Ativa" : "Suspensa"}</Badge><FamilyRowActions family={{ ...family, features: family.features }} /></div>
                  </div>
                  <Link href={`/app/admin/families/${family.id}`} className="mt-4 block text-base font-bold tracking-tight text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300">{family.name}</Link>
                  <p className="mt-1 line-clamp-2 min-h-[32px] text-xs text-slate-500 dark:text-slate-400">{family.description ?? "Sem descrição"}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-white/[.06]">
                    <div><p className="text-[10px] uppercase tracking-wide text-slate-400">Patrimônio</p><p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-white">{formatMoneyCompact(patrimony)}</p></div>
                    <div><p className="text-[10px] uppercase tracking-wide text-slate-400">Integrantes</p><p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-white">{family._count.members}</p></div>
                    <div><p className="text-[10px] uppercase tracking-wide text-slate-400">Lançamentos</p><p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-white">{family._count.transactions}</p></div>
                  </div>
                  <Link href={`/app/admin/families/${family.id}`} className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 dark:bg-white/[.03] dark:text-slate-300 dark:hover:bg-brand-500/10"><span className="flex items-center gap-2"><UsersRound className="h-3.5 w-3.5" /> Gerenciar família</span><ChevronRight className="h-4 w-4" /></Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : <Card><EmptyState title="Nenhuma família cadastrada" description="Crie uma família para começar a administrar finanças e patrimônio." action={<FamilyAction />} /></Card>}
    </div>
  );
}
