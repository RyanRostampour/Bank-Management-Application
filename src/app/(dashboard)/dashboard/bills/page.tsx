import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, DollarSign } from "lucide-react";
import { AddBillDialog } from "@/components/bills/add-bill-dialog";
import { BillItem } from "@/components/bills/bill-item";

export default async function BillsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const dbUser = await getCurrentUser();
  if (!dbUser) redirect("/sign-in");

  const bills = await prisma.bill.findMany({
    where: { userId: dbUser.id },
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const serialized = bills.map((b) => {
    const due = new Date(b.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffMs = due.getTime() - now.getTime();
    const daysUntilDue = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return {
      id: b.id,
      name: b.name,
      amount: b.amount,
      dueDate: b.dueDate.toISOString(),
      paid: b.paid,
      recurring: b.recurring,
      daysUntilDue,
    };
  });

  const unpaid = serialized.filter((b) => !b.paid);
  const paid = serialized.filter((b) => b.paid);

  const dueSoon = unpaid.filter((b) => b.daysUntilDue <= 7);
  const upcoming = unpaid.filter((b) => b.daysUntilDue > 7);

  const totalUpcoming = unpaid.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bill Reminders</h1>
          <p className="text-sm text-muted-foreground">Track your upcoming bills and payments</p>
        </div>
        <AddBillDialog />
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Upcoming</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalUpcoming.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{unpaid.length} unpaid bill{unpaid.length !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueSoon.length}</div>
            <p className="text-xs text-muted-foreground">Bills due within 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Due Soon */}
      {dueSoon.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-orange-600 dark:text-orange-400">Due Soon</h2>
          <div className="space-y-2">
            {dueSoon.map((bill) => (
              <BillItem key={bill.id} {...bill} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.map((bill) => (
              <BillItem key={bill.id} {...bill} />
            ))}
          </div>
        </div>
      )}

      {unpaid.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <h3 className="font-semibold">No upcoming bills</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your bills to get reminders before they are due.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Paid bills */}
      {paid.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-muted-foreground">Paid</h2>
          <div className="space-y-2">
            {paid.map((bill) => (
              <BillItem key={bill.id} {...bill} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
