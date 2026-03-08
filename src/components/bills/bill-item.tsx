"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, CheckCircle2, Circle, RefreshCw } from "lucide-react";

interface BillItemProps {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  recurring: boolean;
  daysUntilDue: number;
}

export function BillItem({ id, name, amount, dueDate, paid, recurring, daysUntilDue }: BillItemProps) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleTogglePaid() {
    setToggling(true);
    try {
      await fetch(`/api/bills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: !paid }),
      });
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/bills/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const dueDateLabel = new Date(dueDate).toLocaleDateString();
  const isDueSoon = !paid && daysUntilDue >= 0 && daysUntilDue <= 7;
  const isOverdue = !paid && daysUntilDue < 0;

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
      paid ? "opacity-60 bg-muted/30" : isDueSoon || isOverdue ? "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/10" : ""
    }`}>
      <button
        onClick={handleTogglePaid}
        disabled={toggling}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
      >
        {paid ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-medium text-sm ${paid ? "line-through text-muted-foreground" : ""}`}>
            {name}
          </span>
          {recurring && (
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <RefreshCw className="h-2.5 w-2.5" />
              Recurring
            </span>
          )}
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">Overdue</Badge>
          )}
          {isDueSoon && !isOverdue && (
            <span className="inline-flex items-center rounded-md bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              Due soon
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Due {dueDateLabel}
          {!paid && daysUntilDue >= 0 && ` (${daysUntilDue === 0 ? "today" : `in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`})`}
          {!paid && daysUntilDue < 0 && ` (${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"} ago)`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-semibold text-sm">${amount.toFixed(2)}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
