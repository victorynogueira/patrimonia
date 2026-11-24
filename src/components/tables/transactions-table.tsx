"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight, Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/fields";
import { EntityDialog } from "@/components/forms/entity-dialog";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type Tx = {
  id: string;
  type: string;
  description: string;
  amountCents: number;
  date: string;
  notes: string | null;
  accountId: string | null;
  categoryId: string | null;
  documentId: string | null;
  isRecurring: boolean;
  recurrence: string | null;
  category?: { name: string } | null;
  account?: { name: string } | null;
};

const typeLabel: Record<string, string> = { INCOME: "Receita", EXPENSE: "Despesa", PROFIT: "Lucro", TRANSFER: "Transferência" };

export function TransactionsTable({
  familyId,
  items,
  accounts,
  categories,
  documents,
  canEdit,
  canDelete,
  canCreate,
}: {
  familyId: string;
  items: Tx[];
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; type?: string }>;
  documents: Array<{ id: string; name: string }>;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [editing, setEditing] = useState<Tx | null>(null);
  const [creating, setCreating] = useState(false);
  const [limit, setLimit] = useState(30);

  const filtered = useMemo(() => items.filter((tx) =>
    (type === "ALL" || tx.type === type) &&
    (search.trim() === "" || `${tx.description} ${tx.category?.name ?? ""} ${tx.account?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())),
  ), [items, search, type]);

  async function remove(tx: Tx) {
    if (!window.confirm(`Excluir a movimentação "${tx.description}"?`)) return;
    const response = await fetch(`/api/families/${familyId}/transactions/${tx.id}`, { method: "DELETE" });
    if (!response.ok) return toast.error("Não foi possível excluir.");
    toast.success("Movimentação excluída.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Buscar por descrição, categoria ou conta" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <Select className="w-auto" value={type} onChange={(event) => setType(event.target.value)}><option value="ALL">Todos os tipos</option><option value="INCOME">Receitas</option><option value="EXPENSE">Despesas</option><option value="PROFIT">Lucros</option><option value="TRANSFER">Transferências</option></Select>
        {canCreate ? <Button onClick={() => setCreating(true)}><ArrowUpRight className="h-4 w-4" /> Nova movimentação</Button> : null}
      </div>

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-white/[.02]"><tr className="text-[10px] uppercase tracking-wider text-slate-400"><th className="px-4 py-3 font-semibold">Data</th><th className="px-4 py-3 font-semibold">Descrição</th><th className="px-4 py-3 font-semibold">Categoria</th><th className="px-4 py-3 font-semibold">Conta</th><th className="px-4 py-3 text-right font-semibold">Valor</th>{(canEdit || canDelete) ? <th className="px-4 py-3 text-right font-semibold">Ações</th> : null}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[.05]">
              {filtered.slice(0, limit).map((tx) => (
                <tr key={tx.id} className="transition hover:bg-slate-50/70 dark:hover:bg-white/[.02]">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(tx.date).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3"><span className="flex items-center gap-2"><span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", tx.type === "EXPENSE" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10")}>{tx.type === "EXPENSE" ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}</span><span><span className="block font-medium text-slate-800 dark:text-slate-100">{tx.description}</span><span className="block text-[10px] text-slate-400">{typeLabel[tx.type]}{tx.isRecurring ? " · recorrente" : ""}</span></span></span></td>
                  <td className="px-4 py-3 text-slate-500">{tx.category?.name ?? <Badge tone="neutral">Sem categoria</Badge>}</td>
                  <td className="px-4 py-3 text-slate-500">{tx.account?.name ?? "—"}</td>
                  <td className={cn("whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums", tx.type === "INCOME" || tx.type === "PROFIT" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-white")}>{tx.type === "EXPENSE" || tx.type === "TRANSFER" ? "−" : "+"}{formatMoney(tx.amountCents)}</td>
                  {(canEdit || canDelete) ? <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1">{canEdit ? <Button size="icon" variant="ghost" onClick={() => setEditing(tx)}><Pencil className="h-3.5 w-3.5" /></Button> : null}{canDelete ? <Button size="icon" variant="ghost" onClick={() => remove(tx)}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button> : null}</div></td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > limit ? <div className="flex justify-center border-t border-slate-100 p-3 dark:border-white/[.06]"><Button variant="ghost" size="sm" onClick={() => setLimit((value) => value + 30)}>Carregar mais ({filtered.length - limit} restantes)</Button></div> : null}
        {!filtered.length ? <div className="py-12 text-center text-xs text-slate-400">Nenhuma movimentação encontrada com esses filtros.</div> : null}
      </div>

      <EntityDialog resource="transactions" familyId={familyId} open={creating} onClose={() => setCreating(false)} accounts={accounts} categories={categories} documents={documents} onSuccess={() => router.refresh()} />
      <EntityDialog resource="transactions" familyId={familyId} open={Boolean(editing)} onClose={() => setEditing(null)} initial={editing} accounts={accounts} categories={categories} documents={documents} onSuccess={() => router.refresh()} />
      <p className="text-right text-[11px] text-slate-400">{filtered.length} movimentação(ões) no período carregado</p>
    </div>
  );
}
