"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, PlusCircle, CheckCircle2 } from "lucide-react";

interface GoalCardProps {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string | null;
}

export function GoalCard({ id, name, targetAmount, savedAmount, targetDate }: GoalCardProps) {
  const router = useRouter();
  const [contributing, setContributing] = useState(false);
  const [contribution, setContribution] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const percentage = targetAmount > 0 ? Math.min(100, (savedAmount / targetAmount) * 100) : 0;
  const remaining = Math.max(0, targetAmount - savedAmount);
  const isComplete = savedAmount >= targetAmount;

  async function handleContribute(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(contribution);
    if (isNaN(amount) || amount <= 0) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedAmount: savedAmount + amount }),
      });
      if (res.ok) {
        setContributing(false);
        setContribution("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/goals/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isComplete && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
            <CardTitle className="text-base truncate">{name}</CardTitle>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isComplete && (
              <Badge variant="secondary" className="text-green-600 bg-green-100 dark:bg-green-900/30">
                Complete
              </Badge>
            )}
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
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{percentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Saved</p>
            <p className="font-semibold">${savedAmount.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Target</p>
            <p className="font-semibold">${targetAmount.toFixed(2)}</p>
          </div>
        </div>

        {remaining > 0 && (
          <p className="text-xs text-muted-foreground">
            ${remaining.toFixed(2)} remaining
            {targetDate && ` by ${new Date(targetDate).toLocaleDateString()}`}
          </p>
        )}

        {targetDate && !remaining && (
          <p className="text-xs text-muted-foreground">
            Goal date: {new Date(targetDate).toLocaleDateString()}
          </p>
        )}

        {!isComplete && (
          contributing ? (
            <form onSubmit={handleContribute} className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Amount"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
              <Button type="submit" size="sm" disabled={loading} className="h-8 shrink-0">
                {loading ? "..." : "Add"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0"
                onClick={() => { setContributing(false); setContribution(""); }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setContributing(true)}
            >
              <PlusCircle className="mr-2 h-3.5 w-3.5" />
              Add Contribution
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
}
