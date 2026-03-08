import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AddPlanDialog } from "@/components/payment-plans/add-plan-dialog";
import { PlanCard } from "@/components/payment-plans/plan-card";

export default async function PaymentPlansPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/sign-in");

  const plans = await prisma.paymentPlan.findMany({
    where: { userId: user.id },
    include: { payments: { orderBy: { dueDate: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const activePlans = plans.filter((p) => p.status === "ACTIVE");
  const totalMonthly = plans
    .filter((p) => p.status === "ACTIVE")
    .reduce((sum, p) => {
      if (p.payments.length > 0) return sum + p.payments[0].amount;
      return sum + p.totalAmount / p.installments;
    }, 0);

  const serializedPlans = plans.map((p) => ({
    ...p,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    payments: p.payments.map((pay) => ({
      ...pay,
      dueDate: pay.dueDate.toISOString(),
      paidDate: pay.paidDate?.toISOString() ?? null,
    })),
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Plans</h1>
          <p className="text-sm text-muted-foreground">Manage your installment payments</p>
        </div>
        <AddPlanDialog />
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Plans</p>
            <p className="text-2xl font-bold">{plans.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Active Plans</p>
            <p className="text-2xl font-bold">{activePlans.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Monthly Obligations</p>
            <p className="text-2xl font-bold">${totalMonthly.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      {serializedPlans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No payment plans yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {serializedPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
