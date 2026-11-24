import Link from "next/link";
import { AuthShell, BackLink } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata = { title: "Redefinir senha" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <AuthShell title="Definir nova senha" subtitle="Escolha uma senha forte para proteger as informações da sua família." footer={<Link href="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Voltar ao login</Link>}>
      <BackLink href="/esqueci-senha">Recuperação</BackLink>
      <ResetForm initialToken={token} />
    </AuthShell>
  );
}
