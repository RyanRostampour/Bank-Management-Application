"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Lightbulb, TrendingUp, DollarSign } from "lucide-react";

interface SpendingAnalysis {
  summary: string;
  insights: string[];
  recommendations: string[];
  topCategory: string;
  savingsPotential: number;
}

interface AISpendingInsightsProps {
  expenseCount: number;
}

export function AISpendingInsights({ expenseCount }: AISpendingInsightsProps) {
  const [analysis, setAnalysis] = useState<SpendingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (expenseCount < 3) {
      setLoading(false);
      return;
    }

    async function fetchAnalysis() {
      try {
        const res = await fetch("/api/ai/analyze-spending");
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to load analysis");
          return;
        }
        const data: SpendingAnalysis = await res.json();
        setAnalysis(data);
      } catch {
        setError("Failed to load AI analysis");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [expenseCount]);

  if (expenseCount < 3) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-muted animate-pulse" />
            <div className="h-5 w-40 rounded bg-muted animate-pulse" />
            <div className="ml-auto h-5 w-16 rounded-full bg-muted animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
          <div className="h-4 w-4/6 rounded bg-muted animate-pulse" />
          <div className="grid gap-2 mt-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-4 w-full rounded bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) return null;

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

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5 text-primary" />
            AI Spending Analysis
          </CardTitle>
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            <Bot className="h-3 w-3" />
            AI
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Top Category
            </div>
            <p className="text-sm font-semibold">
              {CATEGORY_LABELS[analysis.topCategory] ?? analysis.topCategory}
            </p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              Savings Potential
            </div>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              ${analysis.savingsPotential.toFixed(0)}/mo
            </p>
          </div>
        </div>

        {/* Insights */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            <Lightbulb className="h-3.5 w-3.5" />
            Insights
          </div>
          <ul className="space-y-1.5">
            {analysis.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {insight}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Recommendations
          </div>
          <ul className="space-y-1.5">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
