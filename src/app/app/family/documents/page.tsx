import { Card, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { DocumentManager } from "@/components/forms/document-manager";
import { prisma } from "@/lib/db";
import { resolveFamilyPage } from "@/lib/page-helpers";

export const metadata = { title: "Documentos" };

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ familyId?: string }> }) {
  const { family, permissions } = await resolveFamilyPage(searchParams);
  if (!family) return <Card><EmptyState title="Nenhuma família selecionada" description="Escolha uma família para acessar documentos." /></Card>;
  if (!permissions.includes("documents.view")) return <Card><EmptyState title="Acesso restrito" description="Você não tem permissão para visualizar documentos." /></Card>;
  const documents = await prisma.document.findMany({
    where: { familyId: family.id },
    select: { id: true, name: true, mimeType: true, sizeBytes: true, createdAt: true, uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <SectionHeading title="Documentos" subtitle="Comprovantes e arquivos patrimoniais com acesso controlado." />
      <Card><div className="p-5"><DocumentManager familyId={family.id} documents={documents.map((doc) => ({ ...doc, createdAt: doc.createdAt.toISOString() }))} canUpload={permissions.includes("documents.upload")} /></div></Card>
    </div>
  );
}
