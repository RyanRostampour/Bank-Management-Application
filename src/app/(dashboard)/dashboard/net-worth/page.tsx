import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, TrendingDown } from "lucide-react";
import { AddAssetDialog } from "@/components/net-worth/add-asset-dialog";
import { AssetCard } from "@/components/net-worth/asset-card";

export default async function NetWorthPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const dbUser = await getCurrentUser();
  if (!dbUser) redirect("/sign-in");

  const [assets, debts] = await Promise.all([
    prisma.asset.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.debt.findMany({
      where: { userId: dbUser.id },
      select: { id: true, name: true, totalAmount: true, paidAmount: true },
    }),
  ]);

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = debts.reduce((sum, d) => sum + Math.max(0, d.totalAmount - d.paidAmount), 0);
  const netWorth = totalAssets - totalLiabilities;

  const serializedAssets = assets.map((a) => ({
    id: a.id,
    name: a.name,
    value: a.value,
    category: a.category,
  }));

  const serializedDebts = debts.map((d) => ({
    id: d.id,
    name: d.name,
    remaining: Math.max(0, d.totalAmount - d.paidAmount),
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Net Worth</h1>
          <p className="text-sm text-muted-foreground">Assets minus liabilities</p>
        </div>
        <AddAssetDialog />
      </div>

      {/* Net Worth hero */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Net Worth</p>
            <p className={`text-4xl font-bold mt-1 ${netWorth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {netWorth < 0 ? "-" : ""}${Math.abs(netWorth).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              ${totalAssets.toFixed(2)} assets - ${totalLiabilities.toFixed(2)} liabilities
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Two columns: Assets | Liabilities */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Assets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              Assets
            </h2>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              ${totalAssets.toFixed(2)}
            </span>
          </div>
          {serializedAssets.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No assets yet. Add your first asset above.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {serializedAssets.map((asset) => (
                <AssetCard key={asset.id} {...asset} />
              ))}
            </div>
          )}
        </div>

        {/* Liabilities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Liabilities
            </h2>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              ${totalLiabilities.toFixed(2)}
            </span>
          </div>
          {serializedDebts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No debts tracked. Add debts in the Debt Tracker.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {serializedDebts.map((debt) => (
                <Card key={debt.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{debt.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      ${debt.remaining.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Remaining balance</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
