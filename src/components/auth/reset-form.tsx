"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/fields";

export function ResetForm({ initialToken }: { initialToken: string }) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) return setError("As senhas não coincidem.");
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(payload.error?.message ?? "Não foi possível redefinir a senha.");
    toast.success("Senha atualizada. Entre com a nova senha.");
    router.push("/login");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Token de recuperação"><Input required value={token} onChange={(event) => setToken(event.target.value)} className="text-[11px]" /></Field>
      <Field label="Nova senha"><Input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" /></Field>
      <Field label="Confirmar nova senha"><Input required type="password" minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} /></Field>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Salvar nova senha</Button>
    </form>
  );
}
