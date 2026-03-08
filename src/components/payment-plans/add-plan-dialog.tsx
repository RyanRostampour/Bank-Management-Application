"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";

function calcMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0;
  const rate = annualRate / 100 / 12;
  if (rate === 0) return principal / months;
  return (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
}

export function AddPlanDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [installments, setInstallments] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const principal = parseFloat(totalAmount) || 0;
  const rate = parseFloat(interestRate) || 0;
  const months = parseInt(installments) || 0;
  const monthlyPreview = calcMonthlyPayment(principal, rate, months);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !totalAmount || !installments || !startDate) return;

    setLoading(true);
    try {
      const res = await fetch("/api/payment-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, totalAmount, interestRate, installments, startDate }),
      });

      if (res.ok) {
        setOpen(false);
        setName("");
        setTotalAmount("");
        setInterestRate("");
        setInstallments("");
        setStartDate(new Date().toISOString().split("T")[0]);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Payment Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Plan Name</label>
            <Input
              type="text"
              placeholder="e.g. Car Loan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Total Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Interest Rate (%)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Installments (months)</label>
              <Input
                type="number"
                min="1"
                placeholder="12"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          {monthlyPreview > 0 && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Monthly Payment Preview</p>
              <p className="text-lg font-bold">${monthlyPreview.toFixed(2)}/mo</p>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
