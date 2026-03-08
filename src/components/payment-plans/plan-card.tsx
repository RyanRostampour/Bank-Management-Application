"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2Icon } from "lucide-react";

type PaymentPlan = {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  interestRate: number;
  installments: number;
  startDate: string;
  endDate: string;
  status: string;
  payments: Array<{
    id: string;
    amount: number;
    dueDate: string;
    status: string;
  }>;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
  CANCELLED: "bg-gray-100 text-gray-700 border-gray-200",
  OVERDUE: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  OVERDUE: "Overdue",
};

export function PlanCard({ plan }: { plan: PaymentPlan }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const progressPct = plan.totalAmount > 0
    ? Math.min(100, (plan.paidAmount / plan.totalAmount) * 100)
    : 0;

  const nextPayment = plan.payments
    .filter((p) => p.status === "PENDING")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const monthlyAmount =
    plan.payments.length > 0 ? plan.payments[0].amount : plan.totalAmount / plan.installments;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/payment-plans/${plan.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-base">{plan.name}</CardTitle>
          <Badge className={`mt-1 text-xs border ${STATUS_STYLES[plan.status] ?? ""}`}>
            {STATUS_LABELS[plan.status] ?? plan.status}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          disabled={deleting}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            ${plan.paidAmount.toFixed(2)} / ${plan.totalAmount.toFixed(2)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{progressPct.toFixed(1)}% paid</p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Monthly</p>
            <p className="font-semibold">${monthlyAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Interest Rate</p>
            <p className="font-semibold">{plan.interestRate}%</p>
          </div>
          {nextPayment && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Next Payment</p>
              <p className="font-semibold">
                {new Date(nextPayment.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
