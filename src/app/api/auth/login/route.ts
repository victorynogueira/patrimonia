import { ok, parseBody, publicHandler, requestMeta } from "@/lib/api";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ApiError } from "@/lib/errors";
import { verifyPassword } from "@/lib/security";
import { loginSchema } from "@/lib/validators";

export const POST = publicHandler(async (request) => {
  const body = await parseBody(request, loginSchema);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new ApiError("E-mail ou senha incorretos.", 401);
  }
  await createSession(user.id);
  await logAudit({ actorId: user.id, action: "LOGIN", entity: "Session", ip: requestMeta(request).ip });
  return ok({ id: user.id, name: user.name, email: user.email, globalRole: user.globalRole });
});
