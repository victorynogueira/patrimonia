"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#F43F5E", "#0EA5E9", "#A855F7"];
const FEATURES = [
  { key: "reports", label: "Relatórios e exportações" },
  { key: "insights", label: "Insights e alertas inteligentes" },
  { key: "documents", label: "Armazenamento de documentos" },
];

type Initial = { id?: string; name?: string; description?: string | null; color?: string; status?: string; features?: string };

export function FamilyDialog({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Initial | null }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", color: COLORS[0], status: "ACTIVE", features: { reports: true, insights: true, documents: true } as Record<string, boolean> });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let features = { reports: true, insights: true, documents: true };
    if (initial?.features) {
      try { features = { ...features, ...JSON.parse(initial.features) }; } catch { /* mantém padrão */ }
    }
    setForm({
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      color: initial?.color ?? COLORS[0],
      status: initial?.status ?? "ACTIVE",
      features,
    });
    setError("");
  }, [open, initial]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch(initial?.id ? `/api/families/${initial.id}` : "/api/families", {
      method: initial?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(result.error?.message ?? "Não foi possível salvar a família.");
    toast.success(initial?.id ? "Família atualizada." : "Família criada com sucesso.");
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? "Editar família" : "Nova família"} description="Cada família possui dados isolados e permissões próprias.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome da família"><Input required minLength={2} placeholder="Ex.: Família Souza" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Descrição"><Textarea placeholder="Breve descrição sobre o patrimônio administrado" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status"><Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="ACTIVE">Ativa</option><option value="SUSPENDED">Suspensa</option></Select></Field>
          <div>
            <span className="label">Cor de identificação</span>
            <div className="flex gap-2 pt-1.5">
              {COLORS.map((color) => <button key={color} type="button" onClick={() => setForm({ ...form, color })} className={`h-7 w-7 rounded-full ${form.color === color ? "scale-110 ring-2 ring-slate-400 ring-offset-2 dark:ring-offset-[#111624]" : ""}`} style={{ background: color }} aria-label={`Cor ${color}`} />)}
            </div>
          </div>
        </div>
        <div>
          <span className="label">Funcionalidades habilitadas</span>
          <div className="space-y-2">
            {FEATURES.map((feature) => (
              <label key={feature.key} className="flex items-center gap-2 rounded-lg surface-soft px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={Boolean(form.features[feature.key])} onChange={(event) => setForm({ ...form, features: { ...form.features, [feature.key]: event.target.checked } })} />
                {feature.label}
              </label>
            ))}
          </div>
        </div>
        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar</Button></div>
      </form>
    </Modal>
  );
}
