import type { Prisma } from "@prisma/client";
import { authHandler, ok, parseBody } from "@/lib/api";
import { requireFamilyContext } from "@/lib/auth";
import { logAudit, notifyUser } from "@/lib/audit";
import { ApiError } from "@/lib/errors";
import { applyMovement } from "@/lib/balance";
import { prisma } from "@/lib/db";
import { isResource, mapResourceData, RESOURCES, resourceInclude, resourceOrderBy, type Resource } from "@/lib/resource-api";

type Params = { id: string; resource: string };
type Delegate = {
  findMany(args?: unknown): Promise<unknown[]>;
  create(args: unknown): Promise<{ id: string }>;
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

export const GET = authHandler<Params>(async ({ params }) => {
  const { id, resource } = params;
  if (!isResource(resource)) throw new ApiError("Recurso não encontrado.", 404);
  await requireFamilyContext(id, RESOURCES[resource].view);
  const items = await delegateFor(resource).findMany({
    where: { familyId: id },
    include: resourceInclude[resource],
    orderBy: resourceOrderBy[resource],
  });
  return ok({ items });
});

export const POST = authHandler<Params>(async ({ request, user, params }) => {
  const { id, resource } = params;
  if (!isResource(resource)) throw new ApiError("Recurso não encontrado.", 404);
  const context = await requireFamilyContext(id, RESOURCES[resource].create);
  const body = (await parseBody(request, RESOURCES[resource].schema)) as Record<string, unknown>;
  const data = mapResourceData(resource, body, { familyId: id, userId: user.id });
  const delegate = delegateFor(resource);

  let record: { id: string };
  if (resource === "transactions") {
    record = await delegate.create({ data });
    await applyMovement({
      type: String(data.type),
      amountCents: Number(data.amountCents),
      accountId: (data.accountId as string | null) ?? null,
    }, 1);
    if (data.type === "EXPENSE" && Number(data.amountCents) >= 200000) {
      await notifyUser({
        userId: user.id,
        familyId: id,
        title: "Despesa elevada registrada",
        body: `${String(data.description)} (R$ ${(Number(data.amountCents) / 100).toFixed(2)}) foi cadastrada.`,
        type: "ALERT",
      });
    }
  } else if (resource === "assets") {
    record = await prisma.asset.create({
      data: {
        ...data,
        valuations: {
          create: [{ valueCents: Number(data.currentValueCents), date: new Date(String(data.acquisitionDate)), notes: "Valor inicial" }],
        },
      } as Prisma.AssetUncheckedCreateInput,
    });
  } else if (resource === "budgets") {
    const existing = await prisma.budget.findFirst({
      where: { familyId: id, categoryId: (data.categoryId as string | null) ?? null, month: String(data.month) },
    });
    record = existing
      ? await prisma.budget.update({ where: { id: existing.id }, data: { limitCents: Number(data.limitCents) } })
      : await prisma.budget.create({ data: data as Prisma.BudgetUncheckedCreateInput });
  } else {
    record = await delegate.create({ data });
  }

  await logAudit({
    actorId: user.id,
    familyId: id,
    action: "CREATE",
    entity: RESOURCES[resource].label,
    entityId: record.id,
    details: body as Record<string, unknown>,
  });
  void context;
  return ok(record, 201);
});
