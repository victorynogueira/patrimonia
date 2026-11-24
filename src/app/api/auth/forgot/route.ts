import { ok, parseBody, publicHandler } from "@/lib/api";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { generateToken, hashToken } from "@/lib/security";
import { forgotSchema } from "@/lib/validators";

export const POST = publicHandler(async (request) => {
  const { email } = await parseBody(request, forgotSchema);
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = generateToken(24);
    await prisma.passwordReset.create({
      data: { tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    // Em produção: integrar provedor de e-mail. Em desenvolvimento o token é devolvido para validação.
    console.info(`[recuperacao] token para ${user.email}: ${token}`);
    if (process.env.NODE_ENV !== "production") return ok({ message: "Token gerado.", devToken: token });
  }
  return ok({ message: "Se o e-mail existir, enviaremos as instruções de recuperação." });
});
