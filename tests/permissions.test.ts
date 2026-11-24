import { describe, expect, it } from "vitest";
import { ALL_PERMISSIONS, hasPermission, parsePermissionOverride, resolvePermissions } from "@/lib/permissions";

describe("RBAC", () => {
  it("owner possui todas as permissões", () => {
    expect(resolvePermissions(null, true)).toEqual([...ALL_PERMISSIONS]);
    expect(hasPermission(null, "sensitive.view", true)).toBe(true);
  });

  it("sem vínculo não possui permissão alguma", () => {
    expect(resolvePermissions(null)).toEqual([]);
    expect(hasPermission(null, "family.view")).toBe(false);
  });

  it("presets respeitam o papel do membro", () => {
    expect(hasPermission({ role: "VIEWER", permissions: null }, "transactions.view")).toBe(true);
    expect(hasPermission({ role: "VIEWER", permissions: null }, "transactions.create")).toBe(false);
    expect(hasPermission({ role: "MANAGER", permissions: null }, "documents.upload")).toBe(true);
    expect(hasPermission({ role: "MANAGER", permissions: null }, "sensitive.view")).toBe(false);
  });

  it("override explícito substitui o preset e ignora chaves inválidas", () => {
    const override = JSON.stringify(["family.view", "chave-inexistente"]);
    expect(parsePermissionOverride(override)).toEqual(["family.view"]);
    expect(resolvePermissions({ role: "VIEWER", permissions: override })).toEqual(["family.view"]);
  });

  it("override corrompido cai para o preset", () => {
    expect(parsePermissionOverride("{inválido")).toBeNull();
    expect(resolvePermissions({ role: "MEMBER", permissions: "42" })).toContain("transactions.create");
  });
});
