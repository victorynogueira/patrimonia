import { AppShell } from "@/components/layout/app-shell";
import { getSelectedFamily, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { families, family } = await getSelectedFamily(user);
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  return (
    <AppShell
      user={{ name: user.name, email: user.email, avatarColor: user.avatarColor, globalRole: user.globalRole }}
      families={families.map((item) => ({ id: item.id, name: item.name, color: item.color }))}
      activeFamilyId={family?.id ?? null}
      unread={unread}
    >
      {children}
    </AppShell>
  );
}
