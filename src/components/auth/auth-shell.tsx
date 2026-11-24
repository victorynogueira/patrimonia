import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-[#0B1020] p-12 text-white lg:flex">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand-600/30 blur-[100px]" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-[100px]" />
        <div className="absolute inset-0 opacity-[.06]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "56px 56px" }} />
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-indigo-600 shadow-lg shadow-brand-500/30"><Building2 className="h-5 w-5" /></span>
          <div><p className="text-lg font-extrabold tracking-tight">Patrimônia</p><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/50">Gestão familiar</p></div>
        </Link>

        <div className="relative z-10 max-w-md">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-[11px] font-medium text-white/70"><Sparkles className="h-3.5 w-3.5 text-brand-300" /> Inteligência financeira para sua família</span>
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Tudo o que sua família possui, <span className="bg-gradient-to-r from-brand-300 to-cyan-300 bg-clip-text text-transparent">em um só lugar.</span></h2>
          <p className="mt-5 text-sm leading-relaxed text-white/55">Receitas, despesas, lucros e patrimônio com visão consolidada, permissões granulares e relatórios prontos para decisões importantes.</p>
          <div className="mt-8 space-y-3">
            {["Ambientes separados para profissionais e famílias", "Controle de acesso por integrante e por família", "Insights automáticos e projeções financeiras"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-[13px] text-white/70"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> {item}</div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[11px] text-white/35"><ShieldCheck className="h-4 w-4" /> Dados isolados e criptografados · LGPD</div>
      </div>

      <div className="relative flex flex-1 flex-col bg-white px-5 py-6 dark:bg-[#080B12] sm:px-10 lg:px-16">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="flex items-center gap-2 lg:hidden"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white"><Building2 className="h-4 w-4" /></span><span className="text-sm font-bold">Patrimônia</span></Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><LockKeyhole className="h-3 w-3" /> Acesso seguro</span>
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-7 text-center text-[13px] text-slate-500 dark:text-slate-400">{footer}</div> : null}
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><LockKeyhole className="h-3 w-3" /> Conexão protegida · Seus dados são privados</div>
      </div>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-brand-600 dark:text-slate-400"><ArrowLeft className="h-3.5 w-3.5" /> {children}</Link>;
}
