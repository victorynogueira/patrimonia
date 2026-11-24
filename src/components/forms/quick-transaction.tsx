"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "./entity-dialog";

export function QuickTransaction({
  familyId,
  type = "EXPENSE",
  label,
  variant = "primary",
  accounts = [],
  categories = [],
  documents = [],
}: {
  familyId: string;
  type?: string;
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  accounts?: Array<{ id: string; name: string }>;
  categories?: Array<{ id: string; name: string; type?: string }>;
  documents?: Array<{ id: string; name: string }>;
}) {
  const [open, setOpen] = useState(false);
  const Icon = type === "INCOME" ? ArrowUpRight : type === "PROFIT" ? TrendingUp : type === "EXPENSE" ? ArrowDownRight : Plus;
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}><Icon className="h-4 w-4" /> {label ?? "Nova movimentação"}</Button>
      <EntityDialog
        resource="transactions"
        familyId={familyId}
        open={open}
        onClose={() => setOpen(false)}
        initial={{ type }}
        accounts={accounts}
        categories={categories}
        documents={documents}
      />
    </>
  );
}
