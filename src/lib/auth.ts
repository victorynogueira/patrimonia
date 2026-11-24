import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Family, FamilyMember, User } from "@prisma/client";
import { prisma } from "./db";
import { generateToken, hashToken } from "./security";
import { ApiError } from "./errors";
import { hasPermission, resolvePermissions, type Permission } from "./permissions";

export const SESSION_COOKIE = "patrimonia_session";
export const FAMILY_COOKIE = "patrimonia_family";
const SESSION_DAYS = 7;

export type SafeUser = Omit<User, "passwordHash">;

function sanitize(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export async function getSessionUser(): Promise<SafeUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return sanitize(session.user);
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireApiUser(): Promise<SafeUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError("Sessão expirada. Faça login novamente.", 401);
  return user;
}

export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(SESSION_COOKIE);
  store.delete(FAMILY_COOKIE);
}

export async function setActiveFamily(familyId: string) {
  const store = await cookies();
  store.set(FAMILY_COOKIE, familyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400_000,
  });
}

export type FamilyContext = {
  user: SafeUser;
  family: Family;
  member: FamilyMember | null;
  isOwner: boolean;
  permissions: Permission[];
};

/** Carrega o contexto de uma família garantindo que o usuário tenha vínculo ativo. */
export async function getFamilyContext(familyId: string, permission?: Permission): Promise<FamilyContext | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const family = await prisma.family.findUnique({ where: { id: familyId } });
  if (!family) return null;

  const isOwner = family.ownerId === user.id;
  const member = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId: user.id } },
  });

  if (!isOwner && (!member || member.status !== "ACTIVE")) return null;
  if (family.status === "SUSPENDED" && !isOwner) return null;
  if (permission && !hasPermission(member, permission, isOwner)) return null;

  return {
    user,
    family,
    member,
    isOwner,
    permissions: resolvePermissions(member, isOwner),
  };
}

export async function requireFamilyContext(familyId: string, permission?: Permission): Promise<FamilyContext> {
  const context = await getFamilyContext(familyId, permission);
  if (!context) throw new ApiError("Acesso negado a esta família.", 403);
  return context;
}

export async function getAccessibleFamilies(user: SafeUser) {
  const [owned, memberships] = await Promise.all([
    prisma.family.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.familyMember.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: { family: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const map = new Map<string, Family>();
  owned.forEach((family) => map.set(family.id, family));
  memberships.forEach(({ family }) => {
    if (family.status === "ACTIVE" || family.ownerId === user.id) map.set(family.id, family);
  });
  return [...map.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getSelectedFamily(user: SafeUser) {
  const families = await getAccessibleFamilies(user);
  if (families.length === 0) return { families, family: null };
  const store = await cookies();
  const requested = store.get(FAMILY_COOKIE)?.value;
  const family = families.find((item) => item.id === requested) ?? families[0];
  return { families, family };
}
