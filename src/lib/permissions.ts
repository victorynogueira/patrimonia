export const PERMISSION_GROUPS = [
  {
    label: "Família e integrantes",
    items: [
      { key: "family.view", label: "Visualizar painel familiar", description: "Acessa o dashboard e os indicadores da família." },
      { key: "family.manage", label: "Administrar família", description: "Edita dados, status e configurações da família." },
      { key: "members.view", label: "Visualizar integrantes", description: "Consulta a lista de membros e suas funções." },
      { key: "members.manage", label: "Gerenciar integrantes", description: "Convida, altera funções e remove integrantes." },
    ],
  },
  {
    label: "Finanças",
    items: [
      { key: "accounts.view", label: "Visualizar contas", description: "Consulta contas, saldos e instituições." },
      { key: "accounts.manage", label: "Administrar contas", description: "Cria, edita e remove contas e investimentos." },
      { key: "transactions.view", label: "Visualizar movimentações", description: "Consulta receitas, despesas, lucros e transferências." },
      { key: "transactions.create", label: "Cadastrar movimentações", description: "Registra novas entradas e saídas." },
      { key: "transactions.edit", label: "Editar movimentações", description: "Altera movimentações existentes." },
      { key: "transactions.delete", label: "Excluir movimentações", description: "Remove movimentações (registrado na auditoria)." },
      { key: "budgets.manage", label: "Gerenciar orçamentos", description: "Define limites de gastos mensais." },
      { key: "goals.manage", label: "Gerenciar metas", description: "Cria e atualiza metas financeiras." },
    ],
  },
  {
    label: "Patrimônio e documentos",
    items: [
      { key: "assets.view", label: "Visualizar patrimônio", description: "Consulta imóveis, veículos, investimentos e participações." },
      { key: "assets.manage", label: "Administrar patrimônio", description: "Cadastra bens e registra valorizações." },
      { key: "documents.view", label: "Visualizar documentos", description: "Acessa comprovantes e anexos." },
      { key: "documents.upload", label: "Enviar documentos", description: "Anexa comprovantes e documentos." },
      { key: "sensitive.view", label: "Informações confidenciais", description: "Acessa dados sensíveis e histórico completo de auditoria." },
    ],
  },
  {
    label: "Análise",
    items: [
      { key: "reports.view", label: "Visualizar relatórios", description: "Acessa demonstrativos e exportações." },
      { key: "insights.view", label: "Receber insights", description: "Visualiza alertas inteligentes e projeções." },
    ],
  },
] as const;

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) => group.items.map((item) => item.key));
export type Permission = (typeof ALL_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((group) => group.items.map((item) => [item.key, item.label])),
);

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gestor",
  MEMBER: "Integrante",
  VIEWER: "Somente leitura",
};

const VIEW: Permission[] = ["family.view", "accounts.view", "transactions.view", "assets.view", "documents.view", "reports.view", "insights.view", "members.view"];

export const ROLE_PRESETS: Record<string, Permission[]> = {
  ADMIN: [...ALL_PERMISSIONS],
  MANAGER: [
    ...VIEW,
    "transactions.create",
    "transactions.edit",
    "accounts.manage",
    "assets.manage",
    "budgets.manage",
    "goals.manage",
    "documents.upload",
    "family.manage",
  ],
  MEMBER: [...VIEW, "transactions.create", "transactions.edit", "documents.upload", "goals.manage"],
  VIEWER: [...VIEW],
};

export function parsePermissionOverride(raw: string | null | undefined): Permission[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((key): key is Permission => (ALL_PERMISSIONS as readonly string[]).includes(key));
  } catch {
    return null;
  }
}

export function resolvePermissions(
  member: { role: string; permissions: string | null } | null,
  isOwner = false,
): Permission[] {
  if (isOwner) return [...ALL_PERMISSIONS];
  if (!member) return [];
  const override = parsePermissionOverride(member.permissions);
  return override ?? ROLE_PRESETS[member.role] ?? ROLE_PRESETS.MEMBER;
}

export function hasPermission(
  member: { role: string; permissions: string | null } | null,
  permission: Permission,
  isOwner = false,
) {
  return resolvePermissions(member, isOwner).includes(permission);
}
