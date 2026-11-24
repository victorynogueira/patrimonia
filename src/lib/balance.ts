import { prisma } from "./db";

type Movement = { type: string; amountCents: number; accountId: string | null };

export function signedAmount(movement: Pick<Movement, "type" | "amountCents">) {
  return ["INCOME", "PROFIT"].includes(movement.type) ? movement.amountCents : -movement.amountCents;
}

async function adjust(accountId: string | null, delta: number) {
  if (!accountId || delta === 0) return;
  await prisma.account.update({ where: { id: accountId }, data: { balanceCents: { increment: delta } } }).catch(() => undefined);
}

export async function applyMovement(movement: Movement, direction: 1 | -1) {
  await adjust(movement.accountId, signedAmount(movement) * direction);
}

export async function replaceMovement(before: Movement, after: Movement) {
  await applyMovement(before, -1);
  await applyMovement(after, 1);
}
