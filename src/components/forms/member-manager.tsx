"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Loader2, Mail, Plus, Shield, Trash2, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/fields";
import { EmptyState } from "@/components/ui/feedback";
import { PERMISSION_GROUPS, ROLE_LABELS, parsePermissionOverride, resolvePermissions } from "@/lib/permissions";
import { initials } from "@/lib/utils";

type Member = {
  id: string;
  role: string;
  permissions: string | null;
  status: string;
  user: { id: string; name: string; email: string; avatarColor: string };
};
type Invite = { id: string; email: string; role: string; expiresAt: string; createdAt: string };

export function MemberManager({
  familyId,
  ownerId,
  members,
  invites,
  canManage,
}: {
  familyId: string;
  ownerId: string;
  members: Member[];
  invites: Invite[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  function openAdd() {
    setEmail(""); setRole("MEMBER"); setPermissions([]); setInviteUrl(null); setError(""); setAddOpen(true);
  }
  function openEdit(member: Member) {
    setRole(member.role);
    setPermissions(resolvePermissions({ role: member.role, permissions: member.permissions }));
    setError(""); setEditing(member);
  }

  async function saveAdd(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    const response = await fetch(`/api/families/${familyId}/members`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role, permissions }),
    });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(result.error?.message ?? "Não foi possível adicionar.");
    if (result.data.mode === "invite") {
      setInviteUrl(result.data.inviteUrl);
      toast.success("Convite gerado. Copie o link abaixo.");
    } else {
      toast.success("Integrante adicionado.");
      setAddOpen(false);
      router.refresh();
    }
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setLoading(true); setError("");
    const response = await fetch(`/api/families/${familyId}/members/${editing.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, permissions }),
    });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(result.error?.message ?? "Não foi possível salvar.");
    toast.success("Permissões atualizadas.");
    setEditing(null);
    router.refresh();
  }

  async function remove(member: Member) {
    if (!window.confirm(`Remover ${member.user.name} desta família?`)) return;
    const response = await fetch(`/api/families/${familyId}/members/${member.id}`, { method: "DELETE" });
    if (!response.ok) return toast.error("Não foi possível remover o integrante.");
    toast.success("Integrante removido.");
    router.refresh();
  }

  const form = (
    <form onSubmit={editing ? saveEdit : saveAdd} className="space-y-4">
      {!editing ? <Field label="E-mail do integrante"><Input required type="email" placeholder="nome@email.com" value={email} onChange={(event) => setEmail(event.target.value)} /></Field> : null}
      <Field label="Função">
        <Select value={role} onChange={(event) => { setRole(event.target.value); if (!editing) setPermissions([]); }}>
          {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </Select>
      </Field>
      <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200"><Shield className="h-3.5 w-3.5" /> Permissões específicas</p>
        <p className="mb-3 text-[11px] text-slate-400">Deixe tudo desmarcado para usar o padrão da função selecionada.</p>
        <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{group.label}</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {group.items.map((item) => (
                  <label key={item.key} title={item.description} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[.05]">
                    <input type="checkbox" className="h-3.5 w-3.5 accent-brand-600" checked={permissions.includes(item.key)} onChange={(event) => setPermissions((previous) => event.target.checked ? [...previous, item.key] : previous.filter((key) => key !== item.key))} />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
      {inviteUrl ? (
        <div className="rounded-xl bg-brand-50 p-3 dark:bg-brand-500/10">
          <p className="text-[11px] font-semibold text-brand-800 dark:text-brand-200">Link de convite (válido por 7 dias)</p>
          <div className="mt-1 flex items-center gap-2"><code className="flex-1 truncate text-[10px] text-brand-700 dark:text-brand-300">{inviteUrl}</code><Button type="button" size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success("Link copiado."); }}><Copy className="h-3.5 w-3.5" /></Button></div>
        </div>
      ) : null}
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => { setAddOpen(false); setEditing(null); }}>Fechar</Button><Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar</Button></div>
    </form>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Integrantes</h3><p className="mt-1 text-xs text-slate-500">{members.length} pessoa(s) com acesso</p></div>
        {canManage ? <Button size="sm" onClick={openAdd}><Plus className="h-3.5 w-3.5" /> Convidar</Button> : null}
      </div>
      {members.length ? (
        <div className="divide-y divide-slate-100 dark:divide-white/[.06]">
          {members.map((member) => {
            const isOwner = member.user.id === ownerId;
            const granted = resolvePermissions(member);
            return (
              <div key={member.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white" style={{ background: member.user.avatarColor }}>{initials(member.user.name)}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{member.user.name}</p><p className="truncate text-[11px] text-slate-400">{member.user.email}</p></div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {isOwner ? <Badge tone="brand">Responsável</Badge> : <Badge tone="neutral">{ROLE_LABELS[member.role] ?? member.role}</Badge>}
                  <Badge tone={granted.length > 8 ? "success" : "neutral"}>{granted.length} permissões</Badge>
                  {member.status === "SUSPENDED" ? <Badge tone="warning">Suspenso</Badge> : null}
                </div>
                {canManage && !isOwner ? (
                  <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(member)}><Shield className="h-3.5 w-3.5" /> Acessos</Button><Button size="icon" variant="ghost" onClick={() => remove(member)}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button></div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : <EmptyState title="Nenhum integrante" description="Convide familiares para acompanhar as finanças." icon={<UserMinus className="h-5 w-5" />} />}

      {invites.length ? (
        <div className="rounded-xl surface-soft p-3">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200"><Mail className="h-3.5 w-3.5" /> Convites pendentes</p>
          {invites.map((invite) => <div key={invite.id} className="flex items-center justify-between gap-2 py-1 text-[11px] text-slate-500"><span className="truncate">{invite.email}</span><span>expira em {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}</span></div>)}
        </div>
      ) : null}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Adicionar integrante" description="Convide por e-mail ou vincule um usuário existente.">{form}</Modal>
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Permissões do integrante" description={`Ajuste o acesso de ${editing?.user.name ?? ""} nesta família.`}>{form}</Modal>
    </div>
  );
}

export function parsePermissions(raw: string | null) {
  return parsePermissionOverride(raw) ?? [];
}
