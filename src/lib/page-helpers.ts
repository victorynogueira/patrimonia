import type { Family } from "@prisma/client";
import { getFamilyContext, getSelectedFamily, requireUser, type FamilyContext, type SafeUser } from "./auth";
import type { Permission } from "./permissions";

export async function resolveFamilyPage(searchParams: Promise<{ familyId?: string }>) {
  const user: SafeUser = await requireUser();
  const { familyId } = await searchParams;
  if (familyId) {
    const context = await getFamilyContext(familyId);
    if (context) return { user, family: context.family, context, permissions: context.permissions };
  }
  const { family } = await getSelectedFamily(user);
  if (!family) return { user, family: null, context: null, permissions: [] as Permission[] };
  const context = await getFamilyContext(family.id);
  return { user, family: family as Family, context, permissions: context?.permissions ?? ([] as Permission[]) };
}

export function canView(permissions: Permission[], permission: Permission) {
  return permissions.includes(permission);
}
