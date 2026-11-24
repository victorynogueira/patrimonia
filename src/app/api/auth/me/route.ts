import { NextResponse } from "next/server";
import { getAccessibleFamilies, getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { message: "Não autenticado" } }, { status: 401 });
  const families = await getAccessibleFamilies(user);
  return NextResponse.json({ data: { user, families } });
}
