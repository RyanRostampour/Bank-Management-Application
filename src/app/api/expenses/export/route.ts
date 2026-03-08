import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

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

  type WhereClause = {
    userId: string;
    date?: { gte: Date; lt: Date };
  };

  const where: WhereClause = { userId: user.id };

  if (month && year) {
    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);
    where.date = {
      gte: new Date(targetYear, targetMonth - 1, 1),
      lt: new Date(targetYear, targetMonth, 1),
    };
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
  });

  const csvRows = [
    ["Date", "Description", "Category", "Amount"],
    ...expenses.map((e) => [
      e.date.toISOString().split("T")[0],
      `"${e.description.replace(/"/g, '""')}"`,
      CATEGORY_LABELS[e.category] ?? e.category,
      e.amount.toFixed(2),
    ]),
  ];

  const csvContent = csvRows.map((row) => row.join(",")).join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="expenses.csv"',
    },
  });
}
