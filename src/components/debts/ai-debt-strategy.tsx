"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, TrendingDown, Clock, DollarSign, ListOrdered } from "lucide-react";

interface DebtStrategy {
  recommendation: "AVALANCHE" | "SNOWBALL";
  reasoning: string;
  avalancheMonths: number;
  snowballMonths: number;
  interestSavedWithAvalanche: number;
  priorityOrder: string[];
}

interface AIDebtStrategyProps {
  debtCount: number;
}

export function AIDebtStrategy({ debtCount }: AIDebtStrategyProps) {
  const [strategy, setStrategy] = useState<DebtStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (debtCount === 0) {
      setLoading(false);
      return;
    }

    async function fetchStrategy() {
      try {
        const res = await fetch("/api/ai/debt-strategy");
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to load strategy");
          return;
        }
        const data: DebtStrategy = await res.json();
        setStrategy(data);
      } catch {
        setError("Failed to load AI strategy");
      } finally {
        setLoading(false);
      }
    }

    fetchStrategy();
  }, [debtCount]);

  if (debtCount === 0) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-muted animate-pulse" />
            <div className="h-5 w-48 rounded bg-muted animate-pulse" />
            <div className="ml-auto h-5 w-16 rounded-full bg-muted animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-12 w-full rounded bg-muted animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 rounded bg-muted animate-pulse" />
            ))}
          </div>
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error || !strategy) return null;

  const isAvalanche = strategy.recommendation === "AVALANCHE";
  const recommendationColor = isAvalanche
    ? "text-orange-600 dark:text-orange-400"
    : "text-blue-600 dark:text-blue-400";
  const recommendationBg = isAvalanche
    ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
    : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5 text-primary" />
            AI Debt Strategy Advisor
          </CardTitle>
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            <Bot className="h-3 w-3" />
            AI
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommendation badge */}
        <div className={`rounded-lg border p-3 ${recommendationBg}`}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className={`h-4 w-4 ${recommendationColor}`} />
            <span className={`text-sm font-semibold ${recommendationColor}`}>
              Recommended: {isAvalanche ? "Avalanche Method" : "Snowball Method"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {strategy.reasoning}
          </p>
        </div>

        {/* Stats comparison */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
              <Clock className="h-3.5 w-3.5" />
              Avalanche
            </div>
            <p className="text-lg font-bold">{strategy.avalancheMonths}</p>
            <p className="text-xs text-muted-foreground">months</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
              <Clock className="h-3.5 w-3.5" />
              Snowball
            </div>
            <p className="text-lg font-bold">{strategy.snowballMonths}</p>
            <p className="text-xs text-muted-foreground">months</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Interest Saved
            </div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              ${strategy.interestSavedWithAvalanche.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">with avalanche</p>
          </div>
        </div>

        {/* Priority order */}
        {strategy.priorityOrder.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              <ListOrdered className="h-3.5 w-3.5" />
              Recommended Payoff Order
            </div>
            <ol className="space-y-1.5">
              {strategy.priorityOrder.map((debtName, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {i + 1}
                  </span>
                  {debtName}
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
