"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

export function FamilyPicker({ families, activeId }: { families: Array<{ id: string; name: string; color: string }>; activeId: string | null }) {
  const router = useRouter();
  const active = families.find((family) => family.id === activeId);
  return (
    <div className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[.04]">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: active?.color ?? "#6366F1" }} />
      <select
        value={activeId ?? ""}
        onChange={async (event) => {
          const response = await fetch("/api/session/family", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ familyId: event.target.value }) });
          if (!response.ok) return toast.error("Falha ao alternar família.");
          router.refresh();
        }}
        className="max-w-[160px] cursor-pointer appearance-none bg-transparent pr-5 text-xs font-semibold text-slate-700 outline-none dark:text-slate-200"
      >
        {families.map((family) => <option key={family.id} value={family.id} className="text-slate-900">{family.name}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400" />
    </div>
  );
}
