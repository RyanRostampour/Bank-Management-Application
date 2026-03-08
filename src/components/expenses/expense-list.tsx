"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2Icon } from "lucide-react";

type Expense = {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "bg-orange-100 text-orange-700 border-orange-200",
  TRANSPORT: "bg-blue-100 text-blue-700 border-blue-200",
  HOUSING: "bg-purple-100 text-purple-700 border-purple-200",
  UTILITIES: "bg-yellow-100 text-yellow-700 border-yellow-200",
  HEALTHCARE: "bg-red-100 text-red-700 border-red-200",
  ENTERTAINMENT: "bg-pink-100 text-pink-700 border-pink-200",
  SHOPPING: "bg-indigo-100 text-indigo-700 border-indigo-200",
  EDUCATION: "bg-teal-100 text-teal-700 border-teal-200",
  SAVINGS: "bg-green-100 text-green-700 border-green-200",
  DEBT_PAYMENT: "bg-rose-100 text-rose-700 border-rose-200",
  OTHER: "bg-gray-100 text-gray-700 border-gray-200",
};

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

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No expenses recorded for this period. Add one to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => {
        const dateObj = new Date(expense.date);
        const formattedDate = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <Card key={expense.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground w-24 shrink-0">
                  {formattedDate}
                </div>
                <div>
                  <p className="text-sm font-medium">{expense.description}</p>
                </div>
                <Badge
                  className={`text-xs border ${CATEGORY_COLORS[expense.category] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {CATEGORY_LABELS[expense.category] ?? expense.category}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">
                  ${expense.amount.toFixed(2)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(expense.id)}
                  disabled={deletingId === expense.id}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
