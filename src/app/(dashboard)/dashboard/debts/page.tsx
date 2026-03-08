import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AddDebtDialog } from "@/components/debts/add-debt-dialog";
import { DebtCard } from "@/components/debts/debt-card";
import { AIDebtStrategy } from "@/components/debts/ai-debt-strategy";

export default async function DebtsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/sign-in");

  const debts = await prisma.debt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const totalDebt = debts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
  const totalMinPayments = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const avgInterestRate =
    debts.length > 0
      ? debts.reduce((sum, d) => sum + d.interestRate, 0) / debts.length
      : 0;

  const serializedDebts = debts.map((d) => ({
    id: d.id,
    name: d.name,
    totalAmount: d.totalAmount,
    paidAmount: d.paidAmount,
    interestRate: d.interestRate,
    minimumPayment: d.minimumPayment,
    strategy: d.strategy,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Debt Tracker</h1>
          <p className="text-sm text-muted-foreground">Track and eliminate your debts</p>
        </div>
        <AddDebtDialog />
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Remaining Debt</p>
            <p className="text-2xl font-bold">${totalDebt.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Monthly Minimum Payments</p>
            <p className="text-2xl font-bold">${totalMinPayments.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Avg. Interest Rate</p>
            <p className="text-2xl font-bold">{avgInterestRate.toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Debt Strategy */}
      <AIDebtStrategy debtCount={debts.length} />

      {/* Debt Cards */}
      {serializedDebts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No debts tracked yet. Add one to start paying them down.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {serializedDebts.map((debt) => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
        </div>
      )}
    </div>
  );
}
