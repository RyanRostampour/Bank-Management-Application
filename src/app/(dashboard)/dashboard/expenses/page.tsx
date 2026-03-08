import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Tag, Receipt, Download } from "lucide-react";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { ImportCsvDialog } from "@/components/expenses/import-csv-dialog";
import { ExpenseList } from "@/components/expenses/expense-list";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { AISpendingInsights } from "@/components/expenses/ai-spending-insights";
import { Suspense } from "react";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const { month, year } = await searchParams;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/sign-in");

  const now = new Date();
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
  const targetYear = year ? parseInt(year) : now.getFullYear();

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 1);

  const expenses = await prisma.expense.findMany({
    where: {
      userId: user.id,
      date: { gte: startDate, lt: endDate },
    },
    orderBy: { date: "desc" },
  });

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const topCategory =
    expenses.length > 0
      ? Object.entries(
          expenses.reduce<Record<string, number>>((acc, e) => {
            acc[e.category] = (acc[e.category] ?? 0) + e.amount;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-"
      : "-";

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

  const serializedExpenses = expenses.map((e) => ({
    id: e.id,
    amount: e.amount,
    description: e.description,
    category: e.category,
    date: e.date.toISOString(),
  }));

  const exportUrl = `/api/expenses/export?month=${targetMonth}&year=${targetYear}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track and manage your spending</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={exportUrl}
            download
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <ImportCsvDialog />
          <AddExpenseDialog />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topCategory !== "-" ? (CATEGORY_LABELS[topCategory] ?? topCategory) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Highest spending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Spending Insights */}
      <AISpendingInsights expenseCount={expenses.length} />

      {/* Filters + List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transactions</h2>
          <Suspense>
            <ExpenseFilters />
          </Suspense>
        </div>
        <ExpenseList expenses={serializedExpenses} />
      </div>
    </div>
  );
}
