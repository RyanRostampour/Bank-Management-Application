import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, PiggyBank } from "lucide-react";
import { BudgetCard } from "@/components/budgets/budget-card";
import { AddBudgetDialog } from "@/components/budgets/add-budget-dialog";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function BudgetsPage({ searchParams }: PageProps) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const { month, year } = await searchParams;

  const now = new Date();
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
  const targetYear = year ? parseInt(year) : now.getFullYear();

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 1);

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id, month: targetMonth, year: targetYear },
    orderBy: { category: "asc" },
  });

  const expenses = await prisma.expense.groupBy({
    by: ["category"],
    where: {
      userId: user.id,
      date: { gte: startDate, lt: endDate },
    },
    _sum: { amount: true },
  });

  const spendingByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = e._sum.amount ?? 0;
    return acc;
  }, {});

  const budgetsWithSpending = budgets.map((b) => ({
    id: b.id,
    category: b.category,
    limit: b.limit,
    month: b.month,
    year: b.year,
    spent: spendingByCategory[b.category] ?? 0,
  }));

  const totalBudgeted = budgetsWithSpending.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            {MONTH_NAMES[targetMonth - 1]} {targetYear}
          </p>
        </div>
        <AddBudgetDialog month={targetMonth} year={targetYear} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudgeted.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across {budgets.length} categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${totalRemaining < 0 ? "text-red-600" : "text-green-600"}`}
            >
              {totalRemaining < 0 ? "-" : ""}${Math.abs(totalRemaining).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalRemaining < 0 ? "Over budget" : "Available"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget cards grid */}
      {budgetsWithSpending.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PiggyBank className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No budgets set</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a budget for each spending category to start tracking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgetsWithSpending.map((budget) => (
            <BudgetCard
              key={budget.id}
              id={budget.id}
              category={budget.category}
              limit={budget.limit}
              spent={budget.spent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
