"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowLeftRight, Bell, Building2, ChartNoAxesCombined, ChevronDown, ChevronRight, FileBarChart,
  FolderOpen, Gauge, Home, LayoutDashboard, LogOut, Menu, Moon, Search, Settings2, ShieldCheck,
  Sun, Target, UserRound, UsersRound, Wallet, X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";

type FamilyOption = { id: string; name: string; color: string };
type NavItem = { href: string; label: string; icon: typeof Home; exact?: boolean };

const adminNav: NavItem[] = [
  { href: "/app/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/app/admin/families", label: "Famílias", icon: UsersRound },
  { href: "/app/admin/users", label: "Usuários e acessos", icon: ShieldCheck },
  { href: "/app/admin/reports", label: "Relatórios gerenciais", icon: ChartNoAxesCombined },
];
const familyNav: NavItem[] = [
  { href: "/app/family", label: "Painel familiar", icon: Home, exact: true },
  { href: "/app/family/transactions", label: "Movimentações", icon: ArrowLeftRight },
  { href: "/app/family/assets", label: "Patrimônio", icon: Building2 },
  { href: "/app/family/accounts", label: "Contas", icon: Wallet },
  { href: "/app/family/budgets", label: "Orçamentos", icon: Gauge },
  { href: "/app/family/goals", label: "Metas", icon: Target },
  { href: "/app/family/reports", label: "Relatórios", icon: FileBarChart },
  { href: "/app/family/members", label: "Integrantes", icon: UserRound },
  { href: "/app/family/documents", label: "Documentos", icon: FolderOpen },
];
const systemNav: NavItem[] = [
  { href: "/app/notifications", label: "Notificações", icon: Bell },
  { href: "/app/profile", label: "Meu perfil", icon: Settings2 },
];

function NavGroup({ title, items, pathname, onNavigate }: { title: string; items: NavItem[]; pathname: string; onNavigate: () => void }) {
  return (
    <div className="mb-5">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400 dark:text-slate-500">{title}</p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                active
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-500/12 dark:text-brand-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[.05] dark:hover:text-white",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand-600 dark:text-brand-300" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200")} />
              <span className="flex-1 truncate">{item.label}</span>
              {active ? <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AppShell({
  user,
  families,
  activeFamilyId,
  unread,
  children,
}: {
  user: { name: string; email: string; avatarColor: string; globalRole: string };
  families: FamilyOption[];
  activeFamilyId: string | null;
  unread: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [familyMenu, setFamilyMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    setDrawer(false);
    setFamilyMenu(false);
    setUserMenu(false);
  }, [pathname]);

  const title = [...adminNav, ...familyNav, ...systemNav]
    .filter((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.label ?? "Patrimônia";

  const activeFamily = families.find((family) => family.id === activeFamilyId) ?? families[0];

  async function switchFamily(familyId: string) {
    setFamilyMenu(false);
    const response = await fetch("/api/session/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyId }),
    });
    if (!response.ok) return toast.error("Não foi possível alternar de família.");
    router.push("/app/family");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("patrimonia-theme", next ? "dark" : "light");
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 text-white shadow-lg shadow-brand-500/25">
          <Building2 className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">Patrimônia</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Gestão familiar</p>
        </div>
        <button className="ml-auto rounded-lg p-1 text-slate-400 lg:hidden" onClick={() => setDrawer(false)} aria-label="Fechar menu"><X className="h-4 w-4" /></button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {user.globalRole === "PROFESSIONAL" ? <NavGroup title="Administração" items={adminNav} pathname={pathname} onNavigate={() => setDrawer(false)} /> : null}
        {families.length ? <NavGroup title="Família" items={familyNav} pathname={pathname} onNavigate={() => setDrawer(false)} /> : null}
        <NavGroup title="Conta" items={systemNav} pathname={pathname} onNavigate={() => setDrawer(false)} />
      </nav>
      <div className="border-t border-slate-200/70 p-3 dark:border-white/[.06]">
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300">
          <LogOut className="h-[18px] w-[18px]" /> Sair da conta
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-white/[.06] dark:bg-[#0D111B]/90 lg:block">{sidebar}</aside>

      {drawer ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setDrawer(false)} aria-label="Fechar menu" />
          <aside className="absolute inset-y-0 left-0 w-[268px] bg-white shadow-float dark:bg-[#0D111B]">{sidebar}</aside>
        </div>
      ) : null}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-xl dark:border-white/[.06] dark:bg-[#0B0F19]/85 sm:px-6">
          <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[.06] lg:hidden" onClick={() => setDrawer(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
            <p className="hidden text-[11px] text-slate-400 sm:block">Patrimônia / {title}</p>
          </div>

          <div className="relative hidden sm:block">
            <button
              onClick={() => setFamilyMenu((value) => !value)}
              className="flex max-w-[210px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-300 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-200"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: activeFamily?.color ?? "#6366F1" }} />
              <span className="truncate">{activeFamily?.name ?? "Nenhuma família"}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            </button>
            {familyMenu ? (
              <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-float dark:border-white/10 dark:bg-[#151A28]">
                <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Alternar família</p>
                {families.map((family) => (
                  <button key={family.id} onClick={() => switchFamily(family.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[.06]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: family.color }} />
                    <span className="flex-1 truncate">{family.name}</span>
                    {family.id === activeFamily?.id ? <span className="text-brand-600">✓</span> : null}
                  </button>
                ))}
                {!families.length ? <p className="px-2 py-2 text-xs text-slate-400">Você ainda não possui famílias.</p> : null}
              </div>
            ) : null}
          </div>

          <button onClick={toggleTheme} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[.06]" aria-label="Alternar tema">
            {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          <Link href="/app/notifications" className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[.06]" aria-label="Notificações">
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 ? <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{unread}</span> : null}
          </Link>
          <div className="relative">
            <button onClick={() => setUserMenu((value) => !value)} className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-slate-100 dark:hover:bg-white/[.06]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold text-white" style={{ background: user.avatarColor }}>{initials(user.name)}</span>
              <ChevronDown className="hidden h-3 w-3 text-slate-400 sm:block" />
            </button>
            {userMenu ? (
              <div className="absolute right-0 top-11 z-50 w-60 rounded-2xl border border-slate-200 bg-white p-3 shadow-float dark:border-white/10 dark:bg-[#151A28]">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-white">{user.name}</p>
                <p className="truncate text-[11px] text-slate-400">{user.email}</p>
                <div className="my-2 h-px bg-slate-100 dark:bg-white/[.07]" />
                <Link href="/app/profile" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[.06]"><Settings2 className="h-3.5 w-3.5" /> Meu perfil</Link>
                <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"><LogOut className="h-3.5 w-3.5" /> Sair</button>
              </div>
            ) : null}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/[.08] dark:bg-[#0D111B]/95 lg:hidden">
        {familyNav.slice(0, 4).map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-1 flex-col items-center gap-1 py-2.5 text-[9px] font-semibold", active ? "text-brand-600 dark:text-brand-300" : "text-slate-400")}>
              <Icon className={cn("h-[19px] w-[19px]", active ? "stroke-[2.4]" : "")} />
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
        <button onClick={() => setDrawer(true)} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[9px] font-semibold text-slate-400">
          <ChevronRight className="h-[19px] w-[19px]" /> Mais
        </button>
      </nav>
    </div>
  );
}
