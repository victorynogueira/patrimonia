import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/app/admin");
  return (
    <AuthShell
      title="Entre na sua conta"
      subtitle="Acesse o painel de gestão financeira e patrimonial da sua família."
      footer={<>Ainda não tem uma conta? <Link href="/cadastro" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Criar conta grátis</Link></>}
    >
      <LoginForm />
    </AuthShell>
  );
}
