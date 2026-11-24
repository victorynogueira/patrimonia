"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/fields";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(payload.error?.message ?? "Não foi possível entrar.");
      return;
    }
    toast.success("Bem-vindo de volta!");
    router.push("/app/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="E-mail">
        <Input type="email" autoComplete="email" required placeholder="voce@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} />
      </Field>
      <Field label="Senha">
        <div className="relative">
          <Input type={show ? "text" : "password"} autoComplete="current-password" required placeholder="••••••••" className="pr-11" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="button" onClick={() => setShow((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
      <div className="flex items-center justify-end"><Link href="/esqueci-senha" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">Esqueceu a senha?</Link></div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Entrar na plataforma
      </Button>
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[.02]">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Contas de demonstração</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setEmail("admin@patrimonia.app"); setPassword("Senha@123!"); }} className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:text-brand-600 dark:bg-white/[.07] dark:text-slate-300">Profissional</button>
          <button type="button" onClick={() => { setEmail("marina@exemplo.com"); setPassword("Senha@123!"); }} className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:text-brand-600 dark:bg-white/[.07] dark:text-slate-300">Integrante</button>
          <button type="button" onClick={() => { setEmail("joao@exemplo.com"); setPassword("Senha@123!"); }} className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:text-brand-600 dark:bg-white/[.07] dark:text-slate-300">Somente leitura</button>
        </div>
      </div>
    </form>
  );
}
