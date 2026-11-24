import { ok, parseBody, publicHandler } from "@/lib/api";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { hashPassword, hashToken } from "@/lib/security";
import { resetSchema } from "@/lib/validators";

export const POST = publicHandler(async (request) => {
  const body = await parseBody(request, resetSchema);
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(body.token) } });
  if (!reset || reset.usedAt || reset.expiresAt.getTime() < Date.now()) {
    throw new ApiError("Token inválido ou expirado.", 400);
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(body.password) } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  return ok({ message: "Senha atualizada com sucesso." });
});
