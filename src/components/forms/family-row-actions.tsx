"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { FamilyAction } from "./family-action";

export function FamilyRowActions({ family }: { family: { id: string; name: string; description: string | null; color: string; status: string; features: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    const response = await fetch(`/api/families/${family.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: family.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }),
    });
    setLoading(false);
    if (!response.ok) return toast.error("Não foi possível alterar o status.");
    toast.success(family.status === "ACTIVE" ? "Família suspensa." : "Família reativada.");
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Excluir ${family.name}? Todos os dados da família serão removidos.`)) return;
    setLoading(true);
    const response = await fetch(`/api/families/${family.id}`, { method: "DELETE" });
    setLoading(false);
    if (!response.ok) return toast.error("Não foi possível excluir a família.");
    toast.success("Família excluída.");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <FamilyAction initial={family} variant="ghost" size="icon" />
      <button onClick={toggleStatus} disabled={loading} title={family.status === "ACTIVE" ? "Suspender" : "Reativar"} className="rounded-lg p-2 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : family.status === "ACTIVE" ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
      </button>
      <button onClick={remove} disabled={loading} title="Excluir" className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
