import { ok, parseBody, publicHandler } from "@/lib/api";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ApiError } from "@/lib/errors";
import { hashPassword } from "@/lib/security";
import { registerSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

export const POST = publicHandler(async (request) => {
  const body = await parseBody(request, registerSchema);
  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) throw new ApiError("Já existe uma conta com este e-mail.", 409);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash: await hashPassword(body.password),
      globalRole: "PROFESSIONAL",
      avatarColor: "#4F46E5",
    },
  });

  const familyName = body.familyName ?? `${body.name.split(" ")[0]} — Família`;
  const slug = `${slugify(familyName)}-${user.id.slice(-6)}`;
  const family = await prisma.family.create({
    data: {
      name: familyName,
      slug,
      description: "Família criada durante o cadastro.",
      ownerId: user.id,
      features: JSON.stringify({ reports: true, insights: true, documents: true }),
    },
  });
  await prisma.familyMember.create({ data: { familyId: family.id, userId: user.id, role: "ADMIN" } });
  await createSession(user.id);
  await logAudit({ actorId: user.id, familyId: family.id, action: "CREATE", entity: "Family", entityId: family.id });
  return ok({ id: user.id, name: user.name, email: user.email, globalRole: user.globalRole });
});
