"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "Food",
  TRANSPORT: "Transport",
  HOUSING: "Housing",
  UTILITIES: "Utilities",
  HEALTHCARE: "Healthcare",
  ENTERTAINMENT: "Entertainment",
  SHOPPING: "Shopping",
  EDUCATION: "Education",
  SAVINGS: "Savings",
  DEBT_PAYMENT: "Debt Payment",
  OTHER: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  TRANSPORT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  HOUSING: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  UTILITIES: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  HEALTHCARE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ENTERTAINMENT: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  SHOPPING: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  EDUCATION: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  SAVINGS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  DEBT_PAYMENT: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}

interface RecurringItem {
  id: string;
  description: string;
  category: string;
  amount: number;
  dayOfMonth: number;
  active: boolean;
}

export function RecurringList({ items }: { items: RecurringItem[] }) {
  const router = useRouter();
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleToggle(id: string, currentActive: boolean) {
    setToggling(id);
    try {
      await fetch(`/api/recurring/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      router.refresh();
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No recurring expenses yet.
      </p>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex items-center gap-3 px-4 py-3 transition-colors ${!item.active ? "opacity-50" : ""}`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-sm">{item.description}</span>
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.OTHER}`}>
                {CATEGORY_LABELS[item.category] ?? item.category}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Due on the {ordinalSuffix(item.dayOfMonth)} each month
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-semibold text-sm">${item.amount.toFixed(2)}</span>
            <button
              onClick={() => handleToggle(item.id, item.active)}
              disabled={toggling === item.id}
              className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                item.active ? "bg-primary" : "bg-muted"
              }`}
              title={item.active ? "Deactivate" : "Activate"}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                  item.active ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(item.id)}
              disabled={deleting === item.id}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
