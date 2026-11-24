import { redirect } from "next/navigation";
import { ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/parts";
import { UserRoleAction } from "@/components/forms/user-role-action";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initials } from "@/lib/utils";

export const metadata = { title: "Usuários e acessos" };

export default async function UsersPage() {
  const user = await requireUser();
  if (user.globalRole !== "PROFESSIONAL") redirect("/app/family");
  const [users, invites, families] = await Promise.all([
    prisma.user.findMany({ include: { memberships: { include: { family: { select: { name: true } } } }, ownedFamilies: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.invite.findMany({ where: { acceptedAt: null, family: { ownerId: user.id } }, include: { family: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.family.count({ where: { ownerId: user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeading title="Usuários e acessos" subtitle="Gerencie contas, funções globais e convites pendentes." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Usuários" value={String(users.length)} icon={<UsersRound className="h-4 w-4" />} />
        <StatCard label="Profissionais" value={String(users.filter((item) => item.globalRole === "PROFESSIONAL").length)} icon={<ShieldCheck className="h-4 w-4" />} tone="success" />
        <StatCard label="Convites pendentes" value={String(invites.length)} icon={<UserRound className="h-4 w-4" />} tone="amber" />
      </div>

      <Card>
        <CardHeader><div><CardTitle>Contas cadastradas</CardTitle><CardDescription>Funções globais e vínculos com famílias</CardDescription></div></CardHeader>
        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-white/[.06]"><th className="pb-3 font-semibold">Usuário</th><th className="pb-3 font-semibold">Função</th><th className="pb-3 font-semibold">Famílias vinculadas</th><th className="pb-3 text-right font-semibold">Ação</th></tr></thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0 dark:border-white/[.04]">
                    <td className="py-3"><span className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ background: item.avatarColor }}>{initials(item.name)}</span><span><span className="block font-semibold text-slate-800 dark:text-slate-100">{item.name}</span><span className="block text-[10px] text-slate-400">{item.email}</span></span></span></td>
                    <td className="py-3"><Badge tone={item.globalRole === "PROFESSIONAL" ? "brand" : "neutral"}>{item.globalRole === "PROFESSIONAL" ? "Profissional" : "Integrante"}</Badge></td>
                    <td className="py-3"><div className="flex flex-wrap gap-1">{[...item.ownedFamilies.map((family) => family.name), ...item.memberships.map((membership) => membership.family.name)].map((name, index) => <Badge key={`${name}-${index}`} tone="neutral">{name}</Badge>)}</div></td>
                    <td className="py-3 text-right"><UserRoleAction id={item.id} role={item.globalRole} currentUserId={user.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div><CardTitle>Convites pendentes</CardTitle><CardDescription>Convites válidos por 7 dias — {families} família(s) administrada(s)</CardDescription></div></CardHeader>
        <CardContent className="pt-2">
          {invites.length ? <div className="space-y-2">{invites.map((invite) => (
            <div key={invite.id} className="flex flex-wrap items-center gap-3 rounded-xl surface-soft px-3 py-2.5">
              <span className="flex-1 text-xs font-medium text-slate-700 dark:text-slate-200">{invite.email} <span className="text-slate-400">· {invite.family.name}</span></span>
              <Badge tone="neutral">{invite.role}</Badge>
              <span className="text-[11px] text-slate-400">Expira em {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}</span>
            </div>
          ))}</div> : <p className="py-6 text-center text-xs text-slate-400">Nenhum convite pendente.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
