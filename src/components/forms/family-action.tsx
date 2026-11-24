"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FamilyDialog } from "./family-dialog";

export function FamilyAction({
  initial,
  label,
  variant = "primary",
  size = "md",
}: {
  initial?: { id: string; name: string; description: string | null; color: string; status: string; features: string };
  label?: string;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        {initial ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        <span className="hidden sm:inline">{label ?? (initial ? "Editar" : "Nova família")}</span>
      </Button>
      <FamilyDialog open={open} onClose={() => setOpen(false)} initial={initial} />
    </>
  );
}
