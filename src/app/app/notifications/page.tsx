import { Card, SectionHeading } from "@/components/ui/card";
import { NotificationsList } from "@/components/forms/notifications-list";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "Notificações" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, include: { family: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 60 }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return (
    <div className="space-y-6">
      <SectionHeading title="Notificações" subtitle="Alertas importantes sobre movimentações, orçamentos e atividades." />
      <Card><div className="p-5"><NotificationsList unread={unread} items={items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), readAt: item.readAt?.toISOString() ?? null }))} /></div></Card>
    </div>
  );
}
