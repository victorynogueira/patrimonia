import { Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/components/ui/card";
import { ProfileForm } from "@/components/forms/profile-form";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Meu perfil" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <SectionHeading title="Meu perfil" subtitle="Gerencie seus dados pessoais e a segurança da sua conta." />
      <Card className="max-w-3xl"><CardHeader><div><CardTitle>Dados da conta</CardTitle><CardDescription>Alterações são registradas na auditoria da plataforma</CardDescription></div></CardHeader><CardContent><ProfileForm user={{ name: user.name, email: user.email, phone: user.phone, avatarColor: user.avatarColor, globalRole: user.globalRole }} /></CardContent></Card>
    </div>
  );
}
