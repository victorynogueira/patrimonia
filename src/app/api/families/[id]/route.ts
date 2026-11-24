import { authHandler, ok, parseBody } from "@/lib/api";
import { getFamilyContext, requireFamilyContext, requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { familySchema } from "@/lib/validators";

type Params = { id: string };

export const GET = authHandler<Params>(async ({ params }) => {
  const context = await getFamilyContext(params.id);
  if (!context) throw new ApiError("Família não encontrada ou acesso negado.", 404);
  const [counts, members] = await Promise.all([
    prisma.family.findUniqueOrThrow({
      where: { id: params.id },
      include: { _count: { select: { members: true, transactions: true, assets: true, accounts: true, documents: true } } },
    }),
    prisma.familyMember.findMany({ where: { familyId: params.id }, include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } } }),
  ]);
  return ok({ ...context.family, counts: counts._count, members, permissions: context.permissions, isOwner: context.isOwner });
});

export const PATCH = authHandler<Params>(async ({ request, user, params }) => {
  const context = await requireFamilyContext(params.id, "family.manage");
  const body = await parseBody(request, familySchema.partial());
  const family = await prisma.family.update({
    where: { id: params.id },
    data: {
      ...(body.name ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.color ? { color: body.color } : {}),
      ...(body.status ? { status: body.status } : {}),
      ...(body.features ? { features: JSON.stringify(body.features) } : {}),
    },
  });
  await logAudit({ actorId: user.id, familyId: family.id, action: "UPDATE", entity: "Family", entityId: family.id, details: body as Record<string, unknown> });
  return ok(family);
});

export const DELETE = authHandler<Params>(async ({ user, params }) => {
  const family = await prisma.family.findUnique({ where: { id: params.id } });
  if (!family || family.ownerId !== user.id) throw new ApiError("Apenas o responsável pode excluir a família.", 403);
  await logAudit({ actorId: user.id, action: "DELETE", entity: "Family", entityId: family.id, details: { name: family.name } });
  await prisma.family.delete({ where: { id: params.id } });
  return ok({ message: "Família excluída." });
});
