import Link from "next/link";
import { Building2, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { InviteAccept } from "@/components/auth/invite-accept";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/security";

export const metadata = { title: "Convite" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { family: { select: { name: true, color: true } } },
  });
  const user = await getSessionUser();
  const valid = invite && !invite.acceptedAt && invite.expiresAt.getTime() > Date.now();

  return (
    <AuthShell title="Convite para família" subtitle="Você foi convidado a acompanhar finanças e patrimônio familiar." footer={<Link href="/" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Voltar ao início</Link>}>
      {!valid ? <p className="rounded-xl bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">Este convite é inválido ou expirou.</p> : (
        <div className="space-y-5">
          <div className="rounded-2xl surface-soft p-4">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: invite.family.color }}><Building2 className="h-5 w-5" /></span><div><p className="text-sm font-bold text-slate-800 dark:text-white">{invite.family.name}</p><p className="text-[11px] text-slate-500">Função: {invite.role}</p></div></div>
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Mail className="h-3.5 w-3.5" /> Convidado: {invite.email}</p>
          </div>
          {user ? (
            user.email === invite.email ? <InviteAccept token={token} /> : <p className="rounded-xl bg-amber-50 p-4 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">Entre com a conta {invite.email} para aceitar este convite.</p>
          ) : (
            <div className="space-y-2"><Link href={`/login?next=/convite/${token}`} className="block rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white">Entrar para aceitar</Link><Link href={`/cadastro?email=${encodeURIComponent(invite.email)}`} className="block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">Criar conta</Link></div>
          )}
        </div>
      )}
    </AuthShell>
  );
}
