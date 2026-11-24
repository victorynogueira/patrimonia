import { z } from "zod";
import { authHandler, ok, parseBody } from "@/lib/api";
import { requireFamilyContext, setActiveFamily } from "@/lib/auth";

const schema = z.object({ familyId: z.string().min(1) });

export const POST = authHandler(async ({ request }) => {
  const { familyId } = await parseBody(request, schema);
  await requireFamilyContext(familyId);
  await setActiveFamily(familyId);
  return ok({ familyId });
});
