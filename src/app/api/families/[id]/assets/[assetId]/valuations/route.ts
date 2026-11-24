import { authHandler, ok, parseBody } from "@/lib/api";
import { requireFamilyContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { valuationSchema } from "@/lib/validators";

type Params = { id: string; assetId: string };

export const POST = authHandler<Params>(async ({ request, user, params }) => {
  await requireFamilyContext(params.id, "assets.manage");
  const asset = await prisma.asset.findFirst({ where: { id: params.assetId, familyId: params.id } });
  if (!asset) throw new ApiError("Bem não encontrado nesta família.", 404);
  const body = await parseBody(request, valuationSchema);
  const [valuation] = await prisma.$transaction([
    prisma.assetValuation.create({ data: { assetId: asset.id, valueCents: Number(body.value), date: body.date, notes: body.notes } }),
    prisma.asset.update({ where: { id: asset.id }, data: { currentValueCents: Number(body.value) } }),
  ]);
  await logAudit({ actorId: user.id, familyId: params.id, action: "UPDATE", entity: "Valuation", entityId: valuation.id, details: { assetId: asset.id, value: body.value } });
  return ok(valuation, 201);
});
