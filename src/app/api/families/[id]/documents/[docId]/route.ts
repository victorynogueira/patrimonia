import { authHandler } from "@/lib/api";
import { requireFamilyContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";

type Params = { id: string; docId: string };

export const GET = authHandler<Params>(async ({ params }) => {
  await requireFamilyContext(params.id, "documents.view");
  const document = await prisma.document.findFirst({ where: { id: params.docId, familyId: params.id } });
  if (!document) throw new ApiError("Documento não encontrado.", 404);
  return new Response(new Uint8Array(document.data), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${document.name.replace(/[^\w.\- ]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});

export const DELETE = authHandler<Params>(async ({ user, params }) => {
  await requireFamilyContext(params.id, "documents.upload");
  const document = await prisma.document.findFirst({ where: { id: params.docId, familyId: params.id } });
  if (!document) throw new ApiError("Documento não encontrado.", 404);
  await prisma.document.delete({ where: { id: document.id } });
  await logAudit({ actorId: user.id, familyId: params.id, action: "DELETE", entity: "Document", entityId: document.id, details: { name: document.name } });
  return Response.json({ data: { message: "Documento removido." } });
});
