import { z } from "zod";
import { authHandler, ok, parseBody } from "@/lib/api";
import { prisma } from "@/lib/db";

const patchSchema = z.object({ id: z.string().optional(), all: z.boolean().default(false), read: z.boolean().default(true) });

export const GET = authHandler(async ({ request, user }) => {
  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get("take") ?? 40), 100);
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return ok({ items, unread });
});

export const PATCH = authHandler(async ({ request, user }) => {
  const body = await parseBody(request, patchSchema);
  if (body.all) {
    await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  } else if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: user.id },
      data: { readAt: body.read ? new Date() : null },
    });
  }
  return ok({ message: "Notificações atualizadas." });
});

export const DELETE = authHandler(async ({ request, user }) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return ok({ message: "Nada a remover." });
  await prisma.notification.deleteMany({ where: { id, userId: user.id } });
  return ok({ message: "Notificação removida." });
});
