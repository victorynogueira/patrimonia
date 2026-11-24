import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CircleAlert, Lightbulb, Sparkles, TrendingUp, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { formatMoney, formatPercent } from "@/lib/money";
import type { Insight } from "@/lib/insights";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  change,
  icon,
  footnote,
  tone = "brand",
}: {
  label: string;
  value: string;
  change?: number;
  icon?: ReactNode;
  footnote?: string;
  tone?: "brand" | "success" | "danger" | "amber";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    danger: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  };
  const positive = (change ?? 0) >= 0;
  return (
    <div className="surface p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", tones[tone])}>{icon ?? <Wallet className="h-4 w-4" />}</span>
      </div>
      <p className="mt-3 text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
      <div className="mt-1.5 flex items-center gap-2 text-[11px]">
        {change !== undefined ? (
          <span className={cn("inline-flex items-center gap-0.5 font-semibold", positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {formatPercent(change)}
          </span>
        ) : null}
        {footnote ? <span className="text-slate-400">{footnote}</span> : null}
      </div>
    </div>
  );
}

const typeMeta: Record<string, { label: string; className: string }> = {
  INCOME: { label: "Receita", className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" },
  EXPENSE: { label: "Despesa", className: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" },
  PROFIT: { label: "Lucro", className: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300" },
  TRANSFER: { label: "Transferência", className: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300" },
};

export function TransactionRows({
  items,
  limit = 8,
  href,
}: {
  items: Array<{ id: string; type: string; description: string; amountCents: number; date: Date | string; category?: { name: string } | null; account?: { name: string } | null }>;
  limit?: number;
  href?: string;
}) {
  const rows = items.slice(0, limit);
  if (!rows.length) return <EmptyState title="Nenhuma movimentação" description="Os lançamentos aparecerão aqui assim que forem registrados." />;
  return (
    <div className="divide-y divide-slate-100 dark:divide-white/[.06]">
      {rows.map((tx) => {
        const meta = typeMeta[tx.type] ?? typeMeta.TRANSFER;
        const content = (
          <>
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold", meta.className)}>
              {tx.type === "EXPENSE" ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{tx.description}</span>
              <span className="block truncate text-[11px] text-slate-400">{tx.category?.name ?? meta.label} · {new Date(tx.date).toLocaleDateString("pt-BR")}</span>
            </span>
            <span className={cn("shrink-0 text-sm font-semibold tabular-nums", tx.type === "EXPENSE" || tx.type === "TRANSFER" ? "text-slate-800 dark:text-slate-100" : "text-emerald-600 dark:text-emerald-400")}>
              {tx.type === "EXPENSE" || tx.type === "TRANSFER" ? "−" : "+"}{formatMoney(tx.amountCents)}
            </span>
          </>
        );
        return href ? (
          <Link key={tx.id} href={href} className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50 dark:hover:bg-white/[.03]">{content}</Link>
        ) : (
          <div key={tx.id} className="flex items-center gap-3 px-5 py-3">{content}</div>
        );
      })}
    </div>
  );
}

const severityMeta: Record<Insight["severity"], { icon: ReactNode; badge: "success" | "warning" | "danger" | "brand"; label: string }> = {
  success: { icon: <TrendingUp className="h-4 w-4" />, badge: "success", label: "Positivo" },
  warning: { icon: <CircleAlert className="h-4 w-4" />, badge: "warning", label: "Atenção" },
  critical: { icon: <CircleAlert className="h-4 w-4" />, badge: "danger", label: "Crítico" },
  info: { icon: <Lightbulb className="h-4 w-4" />, badge: "brand", label: "Insight" },
};

export function InsightList({ insights, hrefs }: { insights: Insight[]; hrefs?: Record<string, string> }) {
  if (!insights.length) return <EmptyState title="Tudo em ordem" description="Não encontramos alertas relevantes no momento." icon={<Sparkles className="h-5 w-5" />} />;
  return (
    <div className="space-y-2.5">
      {insights.map((insight) => {
        const meta = severityMeta[insight.severity];
        const href = insight.action ? hrefs?.[insight.action] : undefined;
        const body = (
          <>
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", insight.severity === "critical" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" : insight.severity === "warning" ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300" : insight.severity === "success" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300")}>{meta.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{insight.title}</span><Badge tone={meta.badge}>{meta.label}</Badge></span>
              <span className="mt-1 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{insight.description}</span>
              {insight.action && href ? <span className="mt-1.5 block text-[11px] font-semibold text-brand-600 dark:text-brand-400">{insight.action} →</span> : null}
            </span>
          </>
        );
        return href ? <Link key={insight.id} href={href} className="flex gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-white/[.06] dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5">{body}</Link> : <div key={insight.id} className="flex gap-3 rounded-xl border border-slate-100 p-3 dark:border-white/[.06]">{body}</div>;
      })}
    </div>
  );
}

export function BudgetRows({ budgets }: { budgets: Array<{ id: string; spent: number; limitCents: number; percentage: number; category?: { name: string } | null }> }) {
  if (!budgets.length) return <EmptyState title="Sem orçamentos" description="Defina limites mensais para acompanhar seus gastos." />;
  return (
    <div className="space-y-4">
      {budgets.map((budget) => (
        <div key={budget.id}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-200">{budget.category?.name ?? "Geral"}</span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">{formatMoney(budget.spent)} / {formatMoney(budget.limitCents)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[.07]">
            <div className={cn("h-full rounded-full transition-all", budget.percentage >= 100 ? "bg-rose-500" : budget.percentage >= 80 ? "bg-amber-500" : "bg-brand-500")} style={{ width: `${Math.min(budget.percentage, 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GoalRows({ goals }: { goals: Array<{ id: string; name: string; targetCents: number; currentCents: number; deadline: Date | string | null; color: string }> }) {
  if (!goals.length) return <EmptyState title="Nenhuma meta" description="Crie metas para acompanhar objetivos financeiros." />;
  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const progress = goal.targetCents > 0 ? Math.min(Math.round((goal.currentCents / goal.targetCents) * 100), 100) : 0;
        return (
          <div key={goal.id}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-slate-700 dark:text-slate-200">{goal.name}</span>
              <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[.07]">
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: goal.color }} />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              {formatMoney(goal.currentCents)} de {formatMoney(goal.targetCents)}
              {goal.deadline ? ` · até ${new Date(goal.deadline).toLocaleDateString("pt-BR")}` : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}
