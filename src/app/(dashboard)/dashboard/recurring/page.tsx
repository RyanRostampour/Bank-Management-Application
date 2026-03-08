import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, DollarSign } from "lucide-react";
import { AddRecurringDialog } from "@/components/recurring/add-recurring-dialog";
import { RecurringList } from "@/components/recurring/recurring-list";

export default async function RecurringPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const dbUser = await getCurrentUser();
  if (!dbUser) redirect("/sign-in");

  const recurring = await prisma.recurringExpense.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
  });

  const totalMonthly = recurring
    .filter((r) => r.active)
    .reduce((sum, r) => sum + r.amount, 0);

  const serialized = recurring.map((r) => ({
    id: r.id,
    description: r.description,
    category: r.category,
    amount: r.amount,
    dayOfMonth: r.dayOfMonth,
    active: r.active,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recurring Expenses</h1>
          <p className="text-sm text-muted-foreground">Manage your monthly recurring costs</p>
        </div>
        <AddRecurringDialog />
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMonthly.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Active recurring expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recurring.length}</div>
            <p className="text-xs text-muted-foreground">
              {recurring.filter((r) => r.active).length} active, {recurring.filter((r) => !r.active).length} inactive
            </p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">All Recurring Expenses</h2>
        <RecurringList items={serialized} />
      </div>
    </div>
  );
}
