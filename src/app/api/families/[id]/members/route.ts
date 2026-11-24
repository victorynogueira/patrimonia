import { authHandler, ok, parseBody } from "@/lib/api";
import { requireFamilyContext } from "@/lib/auth";
import { logAudit, notifyUser } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/security";
import { memberSchema } from "@/lib/validators";

type Params = { id: string };

export const GET = authHandler<Params>(async ({ params }) => {
  await requireFamilyContext(params.id, "members.view");
  const [members, invites] = await Promise.all([
    prisma.familyMember.findMany({
      where: { familyId: params.id },
      include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invite.findMany({ where: { familyId: params.id, acceptedAt: null }, orderBy: { createdAt: "desc" } }),
  ]);
  return ok({ members, invites: invites.map(({ tokenHash: _tokenHash, ...invite }) => invite) });
});

export const POST = authHandler<Params>(async ({ request, user, params }) => {
  const context = await requireFamilyContext(params.id, "members.manage");
  const body = await parseBody(request, memberSchema);
  const permissions = JSON.stringify(body.permissions);

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    const member = await prisma.familyMember.upsert({
      where: { familyId_userId: { familyId: params.id, userId: existing.id } },
      create: { familyId: params.id, userId: existing.id, role: body.role, permissions, status: "ACTIVE" },
      update: { role: body.role, permissions, status: "ACTIVE" },
    });
    await logAudit({ actorId: user.id, familyId: params.id, action: "UPSERT", entity: "FamilyMember", entityId: member.id, details: { email: body.email, role: body.role } });
    await notifyUser({ userId: existing.id, familyId: params.id, title: "Você foi adicionado a uma família", body: `Agora você faz parte de ${context.family.name} com a função ${body.role}.` });
    return ok({ mode: "member", member }, 201);
  }

  const token = generateToken(24);
  const invite = await prisma.invite.create({
    data: {
      familyId: params.id,
      email: body.email,
      role: body.role,
      permissions,
      tokenHash: hashToken(token),
      invitedById: user.id,
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
    },
  });
  await logAudit({ actorId: user.id, familyId: params.id, action: "INVITE", entity: "Invite", entityId: invite.id, details: { email: body.email, role: body.role } });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return ok({ mode: "invite", inviteUrl: `${appUrl}/convite/${token}`, expiresAt: invite.expiresAt }, 201);
});
