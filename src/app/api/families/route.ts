import { authHandler, ok, parseBody } from "@/lib/api";
import { getAccessibleFamilies } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { ApiError } from "@/lib/errors";
import { familySchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

export const GET = authHandler(async ({ user }) => {
  const families = await getAccessibleFamilies(user);
  const [rows, memberships] = await Promise.all([
    prisma.family.findMany({
      where: { id: { in: families.map((family) => family.id) } },
      include: { _count: { select: { members: true, transactions: true, assets: true } } },
    }),
    prisma.familyMember.findMany({ where: { userId: user.id }, select: { familyId: true, role: true, status: true } }),
  ]);
  const items = rows.map((family) => ({
    ...family,
    counts: family._count,
    myRole: family.ownerId === user.id ? "OWNER" : memberships.find((item) => item.familyId === family.id)?.role ?? "NONE",
  }));
  return ok({ items });
});

export const POST = authHandler(async ({ request, user }) => {
  if (user.globalRole !== "PROFESSIONAL") throw new ApiError("Apenas profissionais podem criar famílias.", 403);
  const body = await parseBody(request, familySchema);
  const family = await prisma.family.create({
    data: {
      name: body.name,
      slug: `${slugify(body.name)}-${Date.now().toString(36).slice(-5)}`,
      description: body.description,
      color: body.color,
      status: body.status,
      features: JSON.stringify(body.features),
      ownerId: user.id,
    },
  });
  await prisma.familyMember.create({ data: { familyId: family.id, userId: user.id, role: "ADMIN" } });
  await logAudit({ actorId: user.id, familyId: family.id, action: "CREATE", entity: "Family", entityId: family.id, details: { name: family.name } });
  return ok(family, 201);
});
