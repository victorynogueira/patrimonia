import Link from "next/link";
import { AuthShell, BackLink } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata = { title: "Recuperar senha" };

export default function ForgotPage() {
  return (
    <AuthShell title="Recuperar acesso" subtitle="Informe seu e-mail para receber as instruções de redefinição de senha." footer={<Link href="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Voltar ao login</Link>}>
      <BackLink href="/login">Login</BackLink>
      <ForgotForm />
    </AuthShell>
  );
}
