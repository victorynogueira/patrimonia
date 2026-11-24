import { authHandler, ok, parseBody } from "@/lib/api";
import { requireFamilyContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ApiError } from "@/lib/errors";
import { replaceMovement, applyMovement } from "@/lib/balance";
import { prisma } from "@/lib/db";
import { isResource, mapResourceData, RESOURCES, type Resource } from "@/lib/resource-api";

type Params = { id: string; resource: string; recordId: string };
type Delegate = {
  findFirst(args: unknown): Promise<Record<string, unknown> | null>;
  update(args: unknown): Promise<{ id: string }>;
  delete(args: unknown): Promise<unknown>;
};

const singular: Record<Resource, string> = {
  transactions: "transaction",
  accounts: "account",
  categories: "category",
  assets: "asset",
  budgets: "budget",
  goals: "goal",
};

function delegateFor(resource: Resource) {
  return (prisma as unknown as Record<string, Delegate>)[singular[resource]];
}

async function findOwned(resource: Resource, familyId: string, recordId: string) {
  const record = await delegateFor(resource).findFirst({ where: { id: recordId, familyId } });
  if (!record) throw new ApiError("Registro não encontrado nesta família.", 404);
  return record;
}

export const PATCH = authHandler<Params>(async ({ request, user, params }) => {
  const { id, resource, recordId } = params;
  if (!isResource(resource)) throw new ApiError("Recurso não encontrado.", 404);
  await requireFamilyContext(id, RESOURCES[resource].edit);
  const before = await findOwned(resource, id, recordId);
  const body = (await parseBody(request, RESOURCES[resource].schema.partial())) as Record<string, unknown>;
  const data = mapResourceData(resource, body, { familyId: id, userId: user.id });

  const record = await delegateFor(resource).update({ where: { id: recordId }, data });

  if (resource === "transactions") {
    await replaceMovement(
      { type: String(before.type), amountCents: Number(before.amountCents), accountId: (before.accountId as string | null) ?? null },
      {
        type: String(data.type ?? before.type),
        amountCents: Number(data.amountCents ?? before.amountCents),
        accountId: (data.accountId === undefined ? before.accountId : data.accountId) as string | null,
      },
    );
  }
  if (resource === "assets" && data.currentValueCents !== undefined && Number(data.currentValueCents) !== Number(before.currentValueCents)) {
    await prisma.assetValuation.create({
      data: { assetId: recordId, valueCents: Number(data.currentValueCents), notes: "Atualização de valor" },
    });
  }

  await logAudit({ actorId: user.id, familyId: id, action: "UPDATE", entity: RESOURCES[resource].label, entityId: recordId, details: body as Record<string, unknown> });
  return ok(record);
});

export const DELETE = authHandler<Params>(async ({ user, params }) => {
  const { id, resource, recordId } = params;
  if (!isResource(resource)) throw new ApiError("Recurso não encontrado.", 404);
  await requireFamilyContext(id, RESOURCES[resource].remove);
  const before = await findOwned(resource, id, recordId);

  if (resource === "transactions") {
    await applyMovement({
      type: String(before.type),
      amountCents: Number(before.amountCents),
      accountId: (before.accountId as string | null) ?? null,
    }, -1);
  }
  await delegateFor(resource).delete({ where: { id: recordId } });
  await logAudit({ actorId: user.id, familyId: id, action: "DELETE", entity: RESOURCES[resource].label, entityId: recordId });
  return ok({ message: `${RESOURCES[resource].label} removido.` });
});
