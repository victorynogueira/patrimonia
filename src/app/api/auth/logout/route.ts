import { ok, authHandler } from "@/lib/api";
import { destroySession, getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const POST = authHandler(async () => {
  const user = await getSessionUser();
  if (user) await logAudit({ actorId: user.id, action: "LOGOUT", entity: "Session" });
  await destroySession();
  return ok({ message: "Sessão encerrada." });
});
