"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Activity, CalendarDays, CircleDollarSign, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/fields";
import { Modal } from "@/components/ui/modal";
import { Field, Input as FieldInput } from "@/components/ui/fields";
import { EntityDialog } from "@/components/forms/entity-dialog";
import { formatMoney, formatPercent } from "@/lib/money";
import type { Resource } from "@/lib/resource-api";
import { cn } from "@/lib/utils";

type Row = Record<string, any>;

const typeLabels: Record<string, string> = {
  BANK: "Bancária", INVESTMENT: "Investimento", CASH: "Dinheiro", CREDIT: "Crédito",
  REAL_ESTATE: "Imóvel", VEHICLE: "Veículo", BUSINESS: "Participação", OTHER: "Outro",
  INCOME: "Receita", EXPENSE: "Despesa", PROFIT: "Lucro",
};

export function ResourceTable({
  resource,
  familyId,
  items,
  canManage,
  options = {},
}: {
  resource: Resource;
  familyId: string;
  items: Row[];
  canManage: boolean;
  options?: { accounts?: Array<{ id: string; name: string }>; categories?: Array<{ id: string; name: string; type?: string }>; documents?: Array<{ id: string; name: string }> };
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [valuing, setValuing] = useState<Row | null>(null);
  const [valuation, setValuation] = useState("");
  const [valuationDate, setValuationDate] = useState(new Date().toISOString().slice(0, 10));
  const [savingValuation, setSavingValuation] = useState(false);

  const filtered = useMemo(() => items.filter((item) => String(item.name ?? item.description ?? "").toLowerCase().includes(search.toLowerCase())), [items, search]);

  async function remove(item: Row) {
    if (!window.confirm(`Excluir "${item.name}"?`)) return;
    const response = await fetch(`/api/families/${familyId}/${resource}/${item.id}`, { method: "DELETE" });
    if (!response.ok) return toast.error("Não foi possível excluir.");
    toast.success("Registro excluído.");
    router.refresh();
  }

  async function saveValuation(event: React.FormEvent) {
    event.preventDefault();
    if (!valuing) return;
    setSavingValuation(true);
    const response = await fetch(`/api/families/${familyId}/assets/${valuing.id}/valuations`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: valuation, date: valuationDate, notes: "Avaliação registrada pelo usuário" }),
    });
    setSavingValuation(false);
    if (!response.ok) return toast.error("Não foi possível registrar a avaliação.");
    toast.success("Avaliação registrada.");
    setValuing(null);
    router.refresh();
  }

  const headers: Record<Resource, string[]> = {
    transactions: ["Data", "Descrição", "Valor"],
    accounts: ["Conta", "Instituição", "Saldo"],
    categories: ["Categoria", "Tipo", "Cor"],
    assets: ["Bem / ativo", "Tipo", "Valor atual"],
    budgets: ["Mês", "Categoria", "Limite"],
    goals: ["Meta", "Prazo", "Progresso"],
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Buscar..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        {canManage ? <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Novo registro</Button> : null}
      </div>

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-white/[.02]"><tr className="text-[10px] uppercase tracking-wider text-slate-400">{headers[resource].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}{canManage ? <th className="px-4 py-3 text-right font-semibold">Ações</th> : null}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[.05]">
              {filtered.map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-50/70 dark:hover:bg-white/[.02]">
                  {resource === "accounts" ? (
                    <>
                      <td className="px-4 py-3"><span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />{item.name}</span><span className="ml-4 block text-[10px] text-slate-400">{typeLabels[item.type] ?? item.type}</span></td>
                      <td className="px-4 py-3 text-slate-500">{item.institution ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-800 dark:text-white">{formatMoney(item.balanceCents)}</td>
                    </>
                  ) : null}
                  {resource === "categories" ? (
                    <>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{item.name}</td>
                      <td className="px-4 py-3"><Badge tone={item.type === "INCOME" ? "success" : item.type === "PROFIT" ? "brand" : "neutral"}>{typeLabels[item.type] ?? item.type}</Badge></td>
                      <td className="px-4 py-3"><span className="inline-block h-4 w-10 rounded-full" style={{ background: item.color }} /></td>
                    </>
                  ) : null}
                  {resource === "assets" ? (
                    <>
                      <td className="px-4 py-3"><span className="block font-medium text-slate-800 dark:text-slate-100">{item.name}</span><span className="block text-[10px] text-slate-400">Adquirido em {new Date(item.acquisitionDate).toLocaleDateString("pt-BR")}{item.location ? ` · ${item.location}` : ""}</span></td>
                      <td className="px-4 py-3"><Badge tone="brand">{typeLabels[item.type] ?? item.type}</Badge></td>
                      <td className="px-4 py-3"><span className="block font-semibold tabular-nums text-slate-800 dark:text-white">{formatMoney(item.currentValueCents)}</span><span className={cn("block text-[10px]", item.currentValueCents >= item.acquisitionValueCents ? "text-emerald-500" : "text-rose-500")}>{formatPercent(item.acquisitionValueCents ? ((item.currentValueCents - item.acquisitionValueCents) / item.acquisitionValueCents) * 100 : 0)}</span></td>
                    </>
                  ) : null}
                  {resource === "budgets" ? (
                    <>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{item.month}</td>
                      <td className="px-4 py-3 text-slate-500">{item.category?.name ?? "Geral"}</td>
                      <td className="px-4 py-3"><span className="block font-semibold tabular-nums text-slate-800 dark:text-white">{formatMoney(item.limitCents)}</span><span className="block text-[10px] text-slate-400">{item.percentage ?? 0}% utilizado</span></td>
                    </>
                  ) : null}
                  {resource === "goals" ? (
                    <>
                      <td className="px-4 py-3"><span className="block font-medium text-slate-800 dark:text-slate-100">{item.name}</span><span className="block text-[10px] text-slate-400">{item.description ?? ""}</span></td>
                      <td className="px-4 py-3 text-slate-500">{item.deadline ? new Date(item.deadline).toLocaleDateString("pt-BR") : "Sem prazo"}</td>
                      <td className="px-4 py-3"><span className="block font-semibold tabular-nums text-slate-800 dark:text-white">{formatMoney(item.currentCents)} / {formatMoney(item.targetCents)}</span><span className="mt-1 block h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-slate-100 dark:bg-white/[.07]"><span className="block h-full rounded-full" style={{ width: `${Math.min(100, item.targetCents ? (item.currentCents / item.targetCents) * 100 : 0)}%`, background: item.color }} /></span></td>
                    </>
                  ) : null}
                  {canManage ? <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1">
                    {resource === "assets" ? <Button size="icon" variant="ghost" title="Registrar avaliação" onClick={() => { setValuing(item); setValuation(String(Number(item.currentValueCents) / 100)); }}><Activity className="h-3.5 w-3.5" /></Button> : null}
                    <Button size="icon" variant="ghost" onClick={() => setEditing(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(item)}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
                  </div></td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length ? <div className="py-12 text-center text-xs text-slate-400">Nenhum registro encontrado.</div> : null}
      </div>

      <EntityDialog resource={resource} familyId={familyId} open={creating} onClose={() => setCreating(false)} accounts={options.accounts} categories={options.categories} documents={options.documents} onSuccess={() => router.refresh()} />
      <EntityDialog resource={resource} familyId={familyId} open={Boolean(editing)} onClose={() => setEditing(null)} initial={editing} accounts={options.accounts} categories={options.categories} documents={options.documents} onSuccess={() => router.refresh()} />
      <Modal open={Boolean(valuing)} onClose={() => setValuing(null)} title="Registrar avaliação" description={`Atualize o valor de ${valuing?.name ?? ""} e mantenha o histórico.`}>
        <form onSubmit={saveValuation} className="space-y-4">
          <Field label="Novo valor (R$)"><FieldInput required inputMode="decimal" value={valuation} onChange={(event) => setValuation(event.target.value)} /></Field>
          <Field label="Data"><FieldInput required type="date" value={valuationDate} onChange={(event) => setValuationDate(event.target.value)} /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setValuing(null)}>Cancelar</Button><Button type="submit" disabled={savingValuation}>Salvar avaliação</Button></div>
        </form>
      </Modal>
    </div>
  );
}
