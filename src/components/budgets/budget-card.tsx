"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface BudgetCardProps {
  id: string;
  category: string;
  limit: number;
  spent: number;
}

export function BudgetCard({ id, category, limit, spent }: BudgetCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const overBudget = spent > limit;
  const remaining = limit - spent;

  const barColor =
    percentage >= 100
      ? "bg-red-500"
      : percentage >= 80
        ? "bg-yellow-500"
        : "bg-green-500";

  const statusBadge = overBudget ? (
    <Badge variant="destructive" className="text-xs">Over budget</Badge>
  ) : percentage >= 80 ? (
    <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">Near limit</Badge>
  ) : (
    <Badge variant="secondary" className="text-xs">On track</Badge>
  );

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            {CATEGORY_LABELS[category] ?? category}
          </CardTitle>
          <div className="flex items-center gap-2">
            {statusBadge}
            <Button
              size="icon-sm"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spent</span>
          <span className={overBudget ? "font-semibold text-red-600" : "font-semibold"}>
            ${spent.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Budget</span>
          <span className="font-medium">${limit.toFixed(2)}</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{percentage.toFixed(0)}% used</span>
          <span>
            {overBudget
              ? `$${Math.abs(remaining).toFixed(2)} over`
              : `$${remaining.toFixed(2)} left`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
