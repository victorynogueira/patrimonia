import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Comece a organizar seu patrimônio"
      subtitle="Crie sua conta profissional e cadastre a primeira família em menos de um minuto."
      footer={<>Já possui conta? <Link href="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Entrar</Link></>}
    >
      <RegisterForm />
    </AuthShell>
  );
}
