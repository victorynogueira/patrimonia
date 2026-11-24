"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/fields";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    setMessage(payload.data?.message ?? "Solicitação enviada.");
    setToken(payload.data?.devToken ?? null);
    toast.success("Solicitação processada.");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="E-mail cadastrado"><Input required type="email" placeholder="voce@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
      {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{message}</p> : null}
      {token ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50/70 p-3 dark:border-brand-500/20 dark:bg-brand-500/5">
          <p className="text-[11px] font-semibold text-brand-800 dark:text-brand-200">Modo desenvolvimento: use o token abaixo</p>
          <code className="mt-1 block break-all text-[11px] text-brand-700 dark:text-brand-300">{token}</code>
          <Link href={`/redefinir-senha?token=${encodeURIComponent(token)}`} className="mt-2 inline-block text-xs font-bold text-brand-700 underline dark:text-brand-300">Definir nova senha →</Link>
        </div>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar instruções</Button>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><Mail className="h-3 w-3" /> O link expira em 60 minutos.</p>
    </form>
  );
}
