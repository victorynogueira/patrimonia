"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InviteAccept({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function accept() {
    setLoading(true);
    const response = await fetch(`/api/invites/${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return toast.error(result.error?.message ?? "Não foi possível aceitar o convite.");
    toast.success("Você agora faz parte da família.");
    setDone(true);
    setTimeout(() => {
      router.push("/app/family");
      router.refresh();
    }, 700);
  }

  return (
    <Button size="lg" className="w-full" onClick={accept} disabled={loading || done}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <CheckCircle2 className="h-4 w-4" /> : null}
      {done ? "Convite aceito" : "Aceitar convite"}
    </Button>
  );
}
