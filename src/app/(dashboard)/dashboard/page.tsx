import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Bot,
  ArrowRight,
  BarChart2,
  Bell,
  Target,
} from "lucide-react";
import { MonthlyTrend } from "@/components/charts/monthly-trend";
import { SpendingByCategory } from "@/components/charts/spending-by-category";

const MONTH_ABBREVS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await currentUser();
  const dbUser = await getCurrentUser();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  let totalExpenses = 0;
  let activePlansCount = 0;
  let totalDebtRemaining = 0;
  let budgetRemaining = 0;
  let monthlyTrendData: { month: string; amount: number }[] = [];
  let categoryData: { category: string; amount: number }[] = [];
  let billsDueSoon: { id: string; name: string; amount: number; dueDate: string; daysUntilDue: number }[] = [];
  let totalSavedGoals = 0;
  let totalTargetGoals = 0;

  if (dbUser) {
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);

    const [
      expenseAgg,
      plans,
      debts,
      last6MonthsExpenses,
      currentMonthByCategory,
      budgets,
      bills,
      goals,
    ] = await Promise.all([
      prisma.expense.aggregate({
        where: { userId: dbUser.id, date: { gte: startOfMonth, lt: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.paymentPlan.findMany({
        where: { userId: dbUser.id, status: "ACTIVE" },
        select: { id: true },
      }),
      prisma.debt.findMany({
        where: { userId: dbUser.id },
        select: { totalAmount: true, paidAmount: true },
      }),
      prisma.expense.findMany({
        where: { userId: dbUser.id, date: { gte: sixMonthsAgo, lt: endOfMonth } },
        select: { date: true, amount: true },
      }),
      prisma.expense.groupBy({
        by: ["category"],
        where: { userId: dbUser.id, date: { gte: startOfMonth, lt: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.budget.findMany({
        where: { userId: dbUser.id, month: now.getMonth() + 1, year: now.getFullYear() },
      }),
      prisma.bill.findMany({
        where: {
          userId: dbUser.id,
          paid: false,
          dueDate: { lte: sevenDaysFromNow },
        },
        orderBy: { dueDate: "asc" },
        take: 3,
      }),
      prisma.savingsGoal.findMany({
        where: { userId: dbUser.id },
        select: { savedAmount: true, targetAmount: true },
      }),
    ]);

    totalExpenses = expenseAgg._sum.amount ?? 0;
    activePlansCount = plans.length;
    totalDebtRemaining = debts.reduce((sum, d) => sum + Math.max(0, d.totalAmount - d.paidAmount), 0);

    // Budget remaining: sum of limits minus expenses for budgeted categories
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
    const budgetedCategoryExpenses = currentMonthByCategory
      .filter((e) => budgets.some((b) => b.category === e.category))
      .reduce((sum, e) => sum + (e._sum.amount ?? 0), 0);
    budgetRemaining = Math.max(0, totalBudgetLimit - budgetedCategoryExpenses);

    // Monthly trend
    const byMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      byMonth[key] = 0;
    }
    for (const e of last6MonthsExpenses) {
      const key = `${e.date.getFullYear()}-${e.date.getMonth()}`;
      if (key in byMonth) {
        byMonth[key] = (byMonth[key] ?? 0) + e.amount;
      }
    }
    monthlyTrendData = Object.entries(byMonth).map(([key, amount]) => {
      const [yr, mo] = key.split("-").map(Number);
      return { month: `${MONTH_ABBREVS[mo!]} ${yr}`, amount };
    });

    categoryData = currentMonthByCategory.map((e) => ({
      category: e.category,
      amount: e._sum.amount ?? 0,
    }));

    // Bills due soon
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    billsDueSoon = bills.map((b) => {
      const due = new Date(b.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffMs = due.getTime() - todayStart.getTime();
      const daysUntilDue = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return {
        id: b.id,
        name: b.name,
        amount: b.amount,
        dueDate: b.dueDate.toISOString(),
        daysUntilDue,
      };
    });

    // Goals
    totalSavedGoals = goals.reduce((sum, g) => sum + g.savedAmount, 0);
    totalTargetGoals = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  }

  const stats = [
    {
      title: "Total Expenses",
      value: `$${totalExpenses.toFixed(2)}`,
      description: "This month",
      icon: DollarSign,
    },
    {
      title: "Active Payment Plans",
      value: String(activePlansCount),
      description: "Plans in progress",
      icon: CreditCard,
    },
    {
      title: "Total Debt",
      value: `$${totalDebtRemaining.toFixed(2)}`,
      description: "Outstanding balance",
      icon: TrendingDown,
    },
    {
      title: "Budget Remaining",
      value: `$${budgetRemaining.toFixed(2)}`,
      description: "Left this month (budgeted categories)",
      icon: TrendingUp,
    },
  ];

  const quickActions = [
    { label: "Add Expense", href: "/dashboard/expenses" },
    { label: "Create Payment Plan", href: "/dashboard/payment-plans" },
    { label: "Track Debt", href: "/dashboard/debts" },
    { label: "Use Calculators", href: "/dashboard/calculators" },
  ];

  const hasExpenseData = monthlyTrendData.some((d) => d.amount > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.firstName ?? "there"} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s an overview of your financial health.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bills Due Soon + Savings Goals widgets */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bills Due Soon */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Bills Due Soon</CardTitle>
              <CardDescription>Within the next 7 days</CardDescription>
            </div>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {billsDueSoon.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No bills due in the next 7 days.</p>
            ) : (
              <div className="space-y-2">
                {billsDueSoon.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{bill.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {bill.daysUntilDue === 0 ? "today" : `in ${bill.daysUntilDue} day${bill.daysUntilDue === 1 ? "" : "s"}`}
                      </span>
                    </div>
                    <span className="font-medium">${bill.amount.toFixed(2)}</span>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="mt-1 w-full justify-between text-xs" render={<Link href="/dashboard/bills" />} nativeButton={false}>
                  View all bills
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Savings Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Savings Goals</CardTitle>
              <CardDescription>Progress across all goals</CardDescription>
            </div>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {totalTargetGoals === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No savings goals yet.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saved</span>
                  <span className="font-medium">${totalSavedGoals.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, totalTargetGoals > 0 ? (totalSavedGoals / totalTargetGoals) * 100 : 0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${totalSavedGoals.toFixed(2)} saved</span>
                  <span>${totalTargetGoals.toFixed(2)} target</span>
                </div>
                <Button variant="ghost" size="sm" className="mt-1 w-full justify-between text-xs" render={<Link href="/dashboard/goals" />} nativeButton={false}>
                  View all goals
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Spending Overview Charts */}
      {hasExpenseData ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Monthly Spending Trend</CardTitle>
              <CardDescription>Last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <MonthlyTrend data={monthlyTrendData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Spending by Category</CardTitle>
              <CardDescription>Current month breakdown</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <SpendingByCategory expenses={categoryData} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <h3 className="font-semibold">No spending data yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add expenses to see your spending insights here.
            </p>
            <Button className="mt-4" variant="outline" render={<Link href="/dashboard/expenses" />} nativeButton={false}>
              Add your first expense
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions + AI Advisor */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump to common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant="ghost"
                className="w-full justify-between"
                render={<Link href={action.href} />}
                nativeButton={false}
              >
                {action.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* AI Advisor teaser */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle>AI Financial Advisor</CardTitle>
            </div>
            <CardDescription>
              Get personalized financial insights powered by Claude AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              {[
                "Analyze your spending patterns",
                "Get debt payoff strategies",
                "Ask financial questions in plain English",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="h-1.5 w-1.5 rounded-full p-0" />
                  {feature}
                </div>
              ))}
            </div>
            <Button className="w-full" render={<Link href="/dashboard/ai-advisor" />} nativeButton={false}>
              <Bot className="mr-2 h-4 w-4" />
              Chat with AI Advisor
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
