import { prisma } from "./db";

type AuditInput = {
  actorId: string;
  familyId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ip?: string;
};

export async function logAudit(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      familyId: input.familyId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      details: JSON.stringify(input.details ?? {}),
    },
  });
}

export async function notifyUser(input: {
  userId: string;
  familyId?: string | null;
  title: string;
  body: string;
  type?: "INFO" | "ALERT" | "SUCCESS";
}) {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      familyId: input.familyId ?? null,
      title: input.title,
      body: input.body,
      type: input.type ?? "INFO",
    },
  });
}
