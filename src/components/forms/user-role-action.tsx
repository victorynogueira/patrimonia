"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

export function UserRoleAction({ id, role, currentUserId }: { id: string; role: string; currentUserId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  if (id === currentUserId) return <span className="text-[10px] text-slate-400">Você</span>;
  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const response = await fetch(`/api/admin/users/${id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ globalRole: role === "PROFESSIONAL" ? "MEMBER" : "PROFESSIONAL" }),
        });
        setLoading(false);
        if (!response.ok) return toast.error("Não foi possível alterar a função.");
        toast.success("Função global atualizada.");
        router.refresh();
      }}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
      Tornar {role === "PROFESSIONAL" ? "integrante" : "profissional"}
    </button>
  );
}
