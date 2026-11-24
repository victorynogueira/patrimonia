"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";
import type { Resource } from "@/lib/resource-api";

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#F43F5E", "#0EA5E9", "#A855F7"];

type Option = { id: string; name: string };
type Initial = Record<string, any>;

const titles: Record<Resource, string> = {
  transactions: "Movimentação",
  accounts: "Conta",
  categories: "Categoria",
  assets: "Patrimônio",
  budgets: "Orçamento",
  goals: "Meta",
};

function dateValue(value: unknown) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

const empty = (resource: Resource): Initial => ({
  type: resource === "transactions" ? "EXPENSE" : resource === "accounts" ? "BANK" : resource === "assets" ? "REAL_ESTATE" : "EXPENSE",
  date: dateValue(null),
  acquisitionDate: dateValue(null),
  month: new Date().toISOString().slice(0, 7),
  color: COLORS[0],
  isActive: true,
  isRecurring: false,
  recurrence: "",
});

export function EntityDialog({
  resource,
  familyId,
  open,
  onClose,
  initial,
  accounts = [],
  categories = [],
  documents = [],
  onSuccess,
}: {
  resource: Resource;
  familyId: string;
  open: boolean;
  onClose: () => void;
  initial?: Initial | null;
  accounts?: Option[];
  categories?: Array<Option & { type?: string }>;
  documents?: Option[];
  onSuccess?: () => void;
}) {
  const [form, setForm] = useState<Initial>(empty(resource));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (!initial) {
      setForm(empty(resource));
    } else {
      const normalized: Initial = { ...initial };
      if (initial.id) {
        if (resource === "transactions") normalized.amount = String(Number(initial.amountCents ?? 0) / 100);
        if (resource === "accounts") normalized.balance = String(Number(initial.balanceCents ?? 0) / 100);
        if (resource === "assets") {
          normalized.acquisitionValue = String(Number(initial.acquisitionValueCents ?? 0) / 100);
          normalized.currentValue = String(Number(initial.currentValueCents ?? 0) / 100);
        }
        if (resource === "budgets") normalized.limit = String(Number(initial.limitCents ?? 0) / 100);
        if (resource === "goals") {
          normalized.target = String(Number(initial.targetCents ?? 0) / 100);
          normalized.current = String(Number(initial.currentCents ?? 0) / 100);
        }
      }
      setForm(normalized);
    }
    setError("");
  }, [open, initial, resource]);

  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setForm((previous) => ({ ...previous, [key]: value }));
  };
  const money = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((previous) => ({ ...previous, [key]: event.target.value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const payload: Record<string, unknown> = { ...form };
    if (resource === "transactions") {
      payload.amount = String(form.amount ?? "");
      payload.accountId = form.accountId || null;
      payload.categoryId = form.categoryId || null;
      payload.documentId = form.documentId || null;
      payload.recurrence = form.recurrence || null;
    }
    if (resource === "accounts") payload.balance = String(form.balance ?? "0");
    if (resource === "assets") {
      payload.acquisitionValue = String(form.acquisitionValue ?? "0");
      payload.currentValue = String(form.currentValue ?? "0");
    }
    if (resource === "budgets") payload.limit = String(form.limit ?? "");
    if (resource === "goals") {
      payload.target = String(form.target ?? "");
      payload.current = String(form.current ?? 0);
    }

    const url = `/api/families/${familyId}/${resource}${initial?.id ? `/${initial.id}` : ""}`;
    const response = await fetch(url, {
      method: initial?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(result.error?.message ?? "Não foi possível salvar.");
      return;
    }
    toast.success(`${titles[resource]} ${initial?.id ? "atualizado" : "cadastrado"} com sucesso.`);
    onClose();
    onSuccess?.();
  }

  const categoryOptions = categories.filter((category) => {
    if (resource === "budgets") return category.type === "EXPENSE";
    if (resource === "transactions") return !category.type || category.type === form.type;
    return true;
  });

  return (
    <Modal open={open} onClose={onClose} title={`${initial?.id ? "Editar" : "Novo"} ${titles[resource].toLowerCase()}`} description="Os campos marcados são obrigatórios. Valores em reais.">
      <form onSubmit={submit} className="space-y-4">
        {resource === "transactions" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo"><Select required {...set("type")} value={form.type ?? "EXPENSE"}><option value="INCOME">Receita</option><option value="EXPENSE">Despesa</option><option value="PROFIT">Lucro / rendimento</option><option value="TRANSFER">Transferência</option></Select></Field>
              <Field label="Valor (R$)"><Input required inputMode="decimal" placeholder="0,00" value={form.amount ?? ""} onChange={money("amount")} /></Field>
            </div>
            <Field label="Descrição"><Input required maxLength={160} placeholder="Ex.: Supermercado mensal" value={form.description ?? ""} onChange={set("description")} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data"><Input required type="date" value={dateValue(form.date)} onChange={set("date")} /></Field>
              <Field label="Conta"><Select {...set("accountId")} value={form.accountId ?? ""}><option value="">Sem conta</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</Select></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria"><Select {...set("categoryId")} value={form.categoryId ?? ""}><option value="">Sem categoria</option>{categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></Field>
              <Field label="Comprovante"><Select {...set("documentId")} value={form.documentId ?? ""}><option value="">Nenhum</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.name}</option>)}</Select></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={Boolean(form.isRecurring)} onChange={set("isRecurring")} /> Movimentação recorrente</label>
              {form.isRecurring ? <Field label="Recorrência"><Select {...set("recurrence")} value={form.recurrence ?? ""}><option value="MONTHLY">Mensal</option><option value="QUARTERLY">Trimestral</option><option value="YEARLY">Anual</option></Select></Field> : null}
            </div>
            <Field label="Observações"><Textarea value={form.notes ?? ""} onChange={set("notes")} placeholder="Detalhes opcionais" /></Field>
          </>
        ) : null}

        {resource === "accounts" ? (
          <>
            <Field label="Nome da conta"><Input required placeholder="Ex.: Conta corrente" value={form.name ?? ""} onChange={set("name")} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo"><Select {...set("type")} value={form.type ?? "BANK"}><option value="BANK">Conta bancária</option><option value="INVESTMENT">Investimento</option><option value="CASH">Dinheiro</option><option value="CREDIT">Crédito</option></Select></Field>
              <Field label="Instituição"><Input placeholder="Ex.: Itaú" value={form.institution ?? ""} onChange={set("institution")} /></Field>
            </div>
            <Field label="Saldo atual (R$)"><Input inputMode="decimal" value={form.balance ?? "0"} onChange={money("balance")} /></Field>
            <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={Boolean(form.isActive)} onChange={set("isActive")} /> Conta ativa</label>
          </>
        ) : null}

        {resource === "categories" ? (
          <>
            <Field label="Nome"><Input required placeholder="Ex.: Alimentação" value={form.name ?? ""} onChange={set("name")} /></Field>
            <Field label="Tipo"><Select {...set("type")} value={form.type ?? "EXPENSE"}><option value="EXPENSE">Despesa</option><option value="INCOME">Receita</option><option value="PROFIT">Lucro</option></Select></Field>
            <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
          </>
        ) : null}

        {resource === "assets" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo"><Select {...set("type")} value={form.type ?? "REAL_ESTATE"}><option value="REAL_ESTATE">Imóvel</option><option value="VEHICLE">Veículo</option><option value="INVESTMENT">Investimento</option><option value="BUSINESS">Participação empresarial</option><option value="OTHER">Outro bem</option></Select></Field>
              <Field label="Nome"><Input required placeholder="Ex.: Apartamento Jardins" value={form.name ?? ""} onChange={set("name")} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Valor de aquisição (R$)"><Input required inputMode="decimal" value={form.acquisitionValue ?? ""} onChange={money("acquisitionValue")} /></Field>
              <Field label="Valor atual (R$)"><Input required inputMode="decimal" value={form.currentValue ?? ""} onChange={money("currentValue")} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data de aquisição"><Input required type="date" value={dateValue(form.acquisitionDate)} onChange={set("acquisitionDate")} /></Field>
              <Field label="Localização"><Input placeholder="Cidade / endereço" value={form.location ?? ""} onChange={set("location")} /></Field>
            </div>
            <Field label="Descrição"><Textarea value={form.description ?? ""} onChange={set("description")} /></Field>
          </>
        ) : null}

        {resource === "budgets" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mês"><Input required type="month" value={form.month ?? ""} onChange={set("month")} /></Field>
              <Field label="Limite (R$)"><Input required inputMode="decimal" placeholder="0,00" value={form.limit ?? ""} onChange={money("limit")} /></Field>
            </div>
            <Field label="Categoria"><Select {...set("categoryId")} value={form.categoryId ?? ""}><option value="">Orçamento geral</option>{categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></Field>
          </>
        ) : null}

        {resource === "goals" ? (
          <>
            <Field label="Nome da meta"><Input required placeholder="Ex.: Reserva de emergência" value={form.name ?? ""} onChange={set("name")} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Valor alvo (R$)"><Input required inputMode="decimal" value={form.target ?? ""} onChange={money("target")} /></Field>
              <Field label="Valor atual (R$)"><Input inputMode="decimal" value={form.current ?? "0"} onChange={money("current")} /></Field>
            </div>
            <Field label="Prazo"><Input type="date" value={form.deadline ? dateValue(form.deadline) : ""} onChange={set("deadline")} /></Field>
            <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
            <Field label="Descrição"><Textarea value={form.description ?? ""} onChange={set("description")} /></Field>
          </>
        ) : null}

        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div>
      <span className="label">Cor</span>
      <div className="flex gap-2">
        {COLORS.map((color) => (
          <button key={color} type="button" onClick={() => onChange(color)} className={`h-7 w-7 rounded-full transition-transform ${value === color ? "scale-110 ring-2 ring-slate-400 ring-offset-2 dark:ring-offset-[#111624]" : ""}`} style={{ background: color }} aria-label={`Cor ${color}`} />
        ))}
      </div>
    </div>
  );
}
