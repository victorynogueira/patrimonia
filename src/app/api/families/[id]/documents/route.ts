import { authHandler, ok } from "@/lib/api";
import { requireFamilyContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";

type Params = { id: string };
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["application/pdf", "image/png", "image/jpeg", "text/plain", "text/csv", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export const GET = authHandler<Params>(async ({ params }) => {
  await requireFamilyContext(params.id, "documents.view");
  const documents = await prisma.document.findMany({
    where: { familyId: params.id },
    select: { id: true, name: true, mimeType: true, sizeBytes: true, createdAt: true, uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok({ items: documents });
});

export const POST = authHandler<Params>(async ({ request, user, params }) => {
  await requireFamilyContext(params.id, "documents.upload");
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError("Selecione um arquivo.", 400);
  if (file.size > MAX_BYTES) throw new ApiError("O arquivo deve ter no máximo 8 MB.", 413);
  if (!ALLOWED.includes(file.type)) throw new ApiError("Formato de arquivo não permitido.", 415);

  const bytes = Buffer.from(await file.arrayBuffer());
  const document = await prisma.document.create({
    data: {
      familyId: params.id,
      name: file.name.slice(0, 160),
      mimeType: file.type,
      sizeBytes: file.size,
      data: bytes,
      uploadedById: user.id,
    },
  });
  await logAudit({ actorId: user.id, familyId: params.id, action: "UPLOAD", entity: "Document", entityId: document.id, details: { name: document.name, size: file.size } });
  const { data: _data, ...safe } = document;
  return ok(safe, 201);
});
