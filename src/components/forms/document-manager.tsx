"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { formatBytes } from "@/lib/format";

type Doc = { id: string; name: string; mimeType: string; sizeBytes: number; createdAt: string; uploadedBy: { name: string } };

export function DocumentManager({ familyId, documents, canUpload }: { familyId: string; documents: Doc[]; canUpload: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/families/${familyId}/documents`, { method: "POST", body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) toast.error(`${file.name}: ${result.error?.message ?? "falha no envio"}`);
      else toast.success(`${file.name} enviado.`);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este documento?")) return;
    const response = await fetch(`/api/families/${familyId}/documents/${id}`, { method: "DELETE" });
    if (!response.ok) return toast.error("Não foi possível excluir.");
    toast.success("Documento excluído.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canUpload ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 transition hover:border-brand-400 hover:bg-brand-50/40 dark:border-white/10 dark:bg-white/[.02] dark:hover:border-brand-500/40">
          <input ref={inputRef} type="file" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.docx" onChange={(event) => upload(event.target.files)} />
          {uploading ? <Loader2 className="h-6 w-6 animate-spin text-brand-500" /> : <UploadCloud className="h-6 w-6 text-brand-500" />}
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{uploading ? "Enviando..." : "Selecione comprovantes e documentos"}</span>
          <span className="text-[11px] text-slate-400">PDF, PNG, JPG, TXT, CSV ou DOCX · até 8 MB</span>
        </label>
      ) : null}
      {documents.length ? (
        <div className="divide-y divide-slate-100 dark:divide-white/[.06]">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10"><FileText className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{doc.name}</p><p className="text-[11px] text-slate-400">{formatBytes(doc.sizeBytes)} · {new Date(doc.createdAt).toLocaleDateString("pt-BR")} · {doc.uploadedBy.name}</p></div>
              <a href={`/api/families/${familyId}/documents/${doc.id}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10" title="Abrir"><Download className="h-4 w-4" /></a>
              {canUpload ? <Button size="icon" variant="ghost" onClick={() => remove(doc.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button> : null}
            </div>
          ))}
        </div>
      ) : <EmptyState title="Nenhum documento" description="Envie comprovantes e documentos patrimoniais para centralizar tudo." icon={<FileText className="h-5 w-5" />} />}
    </div>
  );
}
