import { authHandler, ok, parseBody } from "@/lib/api";
import { requireFamilyContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { permissionsSchema } from "@/lib/validators";

type Params = { id: string; memberId: string };

export const PATCH = authHandler<Params>(async ({ request, user, params }) => {
  const context = await requireFamilyContext(params.id, "members.manage");
  const member = await prisma.familyMember.findFirst({ where: { id: params.memberId, familyId: params.id } });
  if (!member) throw new ApiError("Integrante não encontrado.", 404);
  if (member.userId === context.family.ownerId) throw new ApiError("As permissões do responsável pela família não podem ser alteradas.", 403);

  const body = await parseBody(request, permissionsSchema.partial());
  const updated = await prisma.familyMember.update({
    where: { id: member.id },
    data: {
      ...(body.role ? { role: body.role } : {}),
      ...(body.permissions ? { permissions: JSON.stringify(body.permissions) } : {}),
    },
  });
  await logAudit({ actorId: user.id, familyId: params.id, action: "UPDATE", entity: "FamilyMember", entityId: member.id, details: body as Record<string, unknown> });
  return ok(updated);
});

export const DELETE = authHandler<Params>(async ({ user, params }) => {
  const context = await requireFamilyContext(params.id, "members.manage");
  const member = await prisma.familyMember.findFirst({ where: { id: params.memberId, familyId: params.id } });
  if (!member) throw new ApiError("Integrante não encontrado.", 404);
  if (member.userId === context.family.ownerId) throw new ApiError("O responsável não pode ser removido.", 403);
  await prisma.familyMember.delete({ where: { id: member.id } });
  await logAudit({ actorId: user.id, familyId: params.id, action: "DELETE", entity: "FamilyMember", entityId: member.id, details: { userId: member.userId } });
  return ok({ message: "Integrante removido." });
});
