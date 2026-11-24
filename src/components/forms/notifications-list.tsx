"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, CheckCheck, CircleAlert, Info, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Item = { id: string; title: string; body: string; type: string; readAt: string | null; createdAt: string; family?: { name: string } | null };

const icons = { INFO: Info, ALERT: CircleAlert, SUCCESS: TrendingUp };

export function NotificationsList({ items, unread }: { items: Item[]; unread: number }) {
  const router = useRouter();
  const [rows, setRows] = useState(items);

  async function mark(id: string) {
    const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, read: true }) });
    if (!response.ok) return;
    setRows((previous) => previous.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    router.refresh();
  }

  async function markAll() {
    const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    if (!response.ok) return toast.error("Não foi possível atualizar.");
    setRows((previous) => previous.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    toast.success("Todas marcadas como lidas.");
    router.refresh();
  }

  async function remove(id: string) {
    const response = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    if (!response.ok) return;
    setRows((previous) => previous.filter((item) => item.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><p className="text-xs text-slate-500">{unread} não lida(s)</p>{unread > 0 ? <Button size="sm" variant="ghost" onClick={markAll}><CheckCheck className="h-3.5 w-3.5" /> Marcar todas como lidas</Button> : null}</div>
      {rows.length ? (
        <div className="space-y-2">
          {rows.map((item) => {
            const Icon = icons[item.type as keyof typeof icons] ?? Info;
            return (
              <div key={item.id} className={cn("flex gap-3 rounded-2xl border p-4 transition", item.readAt ? "border-slate-100 bg-white dark:border-white/[.06] dark:bg-white/[.02]" : "border-brand-200 bg-brand-50/40 dark:border-brand-500/25 dark:bg-brand-500/5")}>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", item.type === "ALERT" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" : item.type === "SUCCESS" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300")}><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>{item.family ? <Badge tone="neutral">{item.family.name}</Badge> : null}</div><p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{item.body}</p><p className="mt-1.5 text-[10px] text-slate-400">{formatDateTime(item.createdAt)}</p></div>
                <div className="flex shrink-0 flex-col gap-1">{!item.readAt ? <Button size="icon" variant="ghost" title="Marcar como lida" onClick={() => mark(item.id)}><CheckCheck className="h-3.5 w-3.5" /></Button> : null}<Button size="icon" variant="ghost" title="Excluir" onClick={() => remove(item.id)}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button></div>
              </div>
            );
          })}
        </div>
      ) : <EmptyState title="Nenhuma notificação" description="Alertas de movimentações e auditoria aparecerão aqui." icon={<Bell className="h-5 w-5" />} />}
    </div>
  );
}
