import { Card, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { MemberManager } from "@/components/forms/member-manager";
import { prisma } from "@/lib/db";
import { resolveFamilyPage } from "@/lib/page-helpers";

export const metadata = { title: "Integrantes" };

export default async function FamilyMembersPage({ searchParams }: { searchParams: Promise<{ familyId?: string }> }) {
  const { family, permissions, context } = await resolveFamilyPage(searchParams);
  if (!family) return <Card><EmptyState title="Nenhuma família selecionada" description="Escolha uma família para ver integrantes." /></Card>;
  if (!permissions.includes("members.view")) return <Card><EmptyState title="Acesso restrito" description="Você não tem permissão para visualizar integrantes." /></Card>;
  const [members, invites] = await Promise.all([
    prisma.familyMember.findMany({ where: { familyId: family.id }, include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.invite.findMany({ where: { familyId: family.id, acceptedAt: null }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeading title="Integrantes" subtitle={`Quem tem acesso a ${family.name} e quais permissões cada um possui.`} />
      <Card><div className="p-5"><MemberManager familyId={family.id} ownerId={family.ownerId} members={members} invites={invites.map((invite) => ({ ...invite, expiresAt: invite.expiresAt.toISOString(), createdAt: invite.createdAt.toISOString() }))} canManage={permissions.includes("members.manage") || Boolean(context?.isOwner)} /></div></Card>
    </div>
  );
}
