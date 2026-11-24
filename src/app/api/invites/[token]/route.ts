import { NextResponse, type NextRequest } from "next/server";
import { authHandler, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { hashToken } from "@/lib/security";

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const invite = await prisma.invite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { family: { select: { name: true, color: true } } },
  });
  if (!invite || invite.acceptedAt || invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: { message: "Convite inválido ou expirado." } }, { status: 404 });
  }
  return NextResponse.json({ data: { email: invite.email, role: invite.role, family: invite.family } });
}

export const POST = authHandler(async ({ request, user }) => {
  const body = (await request.json().catch(() => ({}))) as { token?: string };
  if (!body.token) throw new ApiError("Token ausente.", 400);
  const invite = await prisma.invite.findUnique({
    where: { tokenHash: hashToken(body.token) },
    include: { family: { select: { name: true } } },
  });
  if (!invite || invite.acceptedAt || invite.expiresAt.getTime() < Date.now()) {
    throw new ApiError("Convite inválido ou expirado.", 400);
  }
  if (invite.email !== user.email) throw new ApiError("Este convite foi enviado para outro e-mail.", 403);

  await prisma.$transaction([
    prisma.familyMember.upsert({
      where: { familyId_userId: { familyId: invite.familyId, userId: user.id } },
      create: { familyId: invite.familyId, userId: user.id, role: invite.role, permissions: invite.permissions },
      update: { role: invite.role, permissions: invite.permissions, status: "ACTIVE" },
    }),
    prisma.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);
  return ok({ familyId: invite.familyId, familyName: invite.family.name });
});
