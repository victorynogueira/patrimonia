"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/fields";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", familyName: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: event.target.value });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.password !== form.confirm) return setError("As senhas não coincidem.");
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, familyName: form.familyName || undefined, password: form.password }),
    });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(payload.error?.message ?? "Não foi possível criar a conta.");
    toast.success("Conta criada com sucesso!");
    router.push("/app/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Seu nome"><Input required minLength={2} placeholder="Como podemos chamar você?" value={form.name} onChange={set("name")} /></Field>
      <Field label="E-mail"><Input required type="email" autoComplete="email" placeholder="voce@empresa.com" value={form.email} onChange={set("email")} /></Field>
      <Field label="Nome da família" hint="Opcional — você poderá criar outras famílias depois."><Input placeholder="Ex.: Família Souza" value={form.familyName} onChange={set("familyName")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Senha"><Input required type="password" minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={set("password")} /></Field>
        <Field label="Confirmar senha"><Input required type="password" minLength={8} autoComplete="new-password" placeholder="Repita a senha" value={form.confirm} onChange={set("confirm")} /></Field>
      </div>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Criar minha conta</Button>
    </form>
  );
}
