"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/fields";
import { Badge } from "@/components/ui/badge";

export function ProfileForm({ user }: { user: { name: string; email: string; phone: string | null; avatarColor: string; globalRole: string } }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: user.name, phone: user.phone ?? "", avatarColor: user.avatarColor, currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const colors = ["#6366F1", "#10B981", "#F59E0B", "#F43F5E", "#0EA5E9", "#A855F7"];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) return setError("As novas senhas não coincidem.");
    setLoading(true); setError("");
    const response = await fetch("/api/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, phone: form.phone || null, ...(form.newPassword ? {} : { currentPassword: undefined, newPassword: undefined }) }),
    });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(result.error?.message ?? "Não foi possível salvar.");
    toast.success("Perfil atualizado.");
    setForm((previous) => ({ ...previous, currentPassword: "", newPassword: "", confirmPassword: "" }));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl surface-soft p-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white" style={{ background: form.avatarColor }}>{user.name.slice(0, 2).toUpperCase()}</span>
        <div><p className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p><Badge tone="brand" className="mt-1">{user.globalRole === "PROFESSIONAL" ? "Profissional" : "Integrante"}</Badge></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome"><Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Telefone"><Input placeholder="(11) 99999-0000" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
      </div>
      <div>
        <span className="label">Cor do perfil</span>
        <div className="flex gap-2">{colors.map((color) => <button type="button" key={color} onClick={() => setForm({ ...form, avatarColor: color })} className={`h-8 w-8 rounded-full ${form.avatarColor === color ? "ring-2 ring-slate-400 ring-offset-2 dark:ring-offset-[#111624]" : ""}`} style={{ background: color }} aria-label={`Cor ${color}`} />)}</div>
      </div>
      <div className="border-t divider pt-5">
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white"><ShieldCheck className="h-4 w-4 text-brand-500" /> Alterar senha</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Senha atual"><Input type="password" autoComplete="current-password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /></Field>
          <Field label="Nova senha"><Input type="password" autoComplete="new-password" minLength={8} value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /></Field>
          <Field label="Confirmar"><Input type="password" autoComplete="new-password" minLength={8} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></Field>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Preencha os três campos apenas se desejar alterar a senha.</p>
      </div>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
      <div className="flex justify-end"><Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar alterações</Button></div>
    </form>
  );
}
