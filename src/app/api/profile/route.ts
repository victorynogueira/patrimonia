import { z } from "zod";
import { authHandler, ok, parseBody } from "@/lib/api";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/security";

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  avatarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128).optional(),
});

export const PATCH = authHandler(async ({ request, user }) => {
  const body = await parseBody(request, schema);
  if (body.newPassword) {
    const current = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!body.currentPassword || !(await verifyPassword(body.currentPassword, current.passwordHash))) {
      throw new ApiError("Senha atual incorreta.", 400);
    }
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(body.name ? { name: body.name } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.avatarColor ? { avatarColor: body.avatarColor } : {}),
      ...(body.newPassword ? { passwordHash: await hashPassword(body.newPassword) } : {}),
    },
  });
  const { passwordHash: _hidden, ...safe } = updated;
  return ok(safe);
});
