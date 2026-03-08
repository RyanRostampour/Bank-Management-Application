"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2Icon, PencilIcon, CheckIcon, XIcon } from "lucide-react";

type Debt = {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  interestRate: number;
  minimumPayment: number;
  strategy: string;
};

const STRATEGY_STYLES: Record<string, string> = {
  AVALANCHE: "bg-blue-100 text-blue-700 border-blue-200",
  SNOWBALL: "bg-green-100 text-green-700 border-green-200",
};

export function DebtCard({ debt }: { debt: Debt }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [paidValue, setPaidValue] = useState(String(debt.paidAmount));
  const [saving, setSaving] = useState(false);

  const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
  const progressPct = debt.totalAmount > 0
    ? Math.min(100, (debt.paidAmount / debt.totalAmount) * 100)
    : 0;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/debts/${debt.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function handleSavePaid() {
    setSaving(true);
    try {
      const res = await fetch(`/api/debts/${debt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: paidValue }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-base">{debt.name}</CardTitle>
          <Badge className={`mt-1 text-xs border ${STRATEGY_STYLES[debt.strategy] ?? "bg-gray-100 text-gray-700"}`}>
            {debt.strategy === "AVALANCHE" ? "Avalanche" : "Snowball"}
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
          <span className="text-muted-foreground">Remaining</span>
          <span className="font-bold text-base">${remaining.toFixed(2)}</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          ${debt.paidAmount.toFixed(2)} of ${debt.totalAmount.toFixed(2)} paid ({progressPct.toFixed(1)}%)
        </p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Interest Rate</p>
            <p className="font-semibold">{debt.interestRate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Min. Payment</p>
            <p className="font-semibold">${debt.minimumPayment.toFixed(2)}/mo</p>
          </div>
        </div>

        {/* Edit paid amount */}
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              max={debt.totalAmount}
              value={paidValue}
              onChange={(e) => setPaidValue(e.target.value)}
              className="h-7 text-sm"
            />
            <Button size="icon-sm" onClick={handleSavePaid} disabled={saving}>
              <CheckIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => { setEditing(false); setPaidValue(String(debt.paidAmount)); }}
            >
              <XIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setEditing(true)}
          >
            <PencilIcon className="mr-2 h-3.5 w-3.5" />
            Update Paid Amount
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
