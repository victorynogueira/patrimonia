import { z } from "zod";
import { authHandler, ok, parseBody } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { ApiError } from "@/lib/errors";
import { prisma } from "@/lib/db";

const schema = z.object({ globalRole: z.enum(["PROFESSIONAL", "MEMBER"]) });

export const PATCH = authHandler<{ id: string }>(async ({ request, user, params }) => {
  if (user.globalRole !== "PROFESSIONAL") throw new ApiError("Acesso restrito a profissionais.", 403);
  if (params.id === user.id) throw new ApiError("Você não pode alterar sua própria função global.", 400);
  const { globalRole } = await parseBody(request, schema);
  const updated = await prisma.user.update({ where: { id: params.id }, data: { globalRole } });
  await logAudit({ actorId: user.id, action: "UPDATE", entity: "User", entityId: updated.id, details: { globalRole } });
  const { passwordHash: _hidden, ...safe } = updated;
  return ok(safe);
});
