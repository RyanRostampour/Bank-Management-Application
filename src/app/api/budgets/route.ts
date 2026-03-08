import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { NextRequest, NextResponse } from "next/server";
import { ExpenseCategory } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = searchParams.get("month")
    ? parseInt(searchParams.get("month")!)
    : now.getMonth() + 1;
  const year = searchParams.get("year")
    ? parseInt(searchParams.get("year")!)
    : now.getFullYear();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id, month, year },
    orderBy: { category: "asc" },
  });

  // Get actual spending per category for the month
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

  const result = budgets.map((b) => ({
    id: b.id,
    category: b.category,
    limit: b.limit,
    month: b.month,
    year: b.year,
    spent: spendingByCategory[b.category] ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { category, limit, month, year } = body;

  if (!category || !limit) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const now = new Date();
  const targetMonth = month ?? now.getMonth() + 1;
  const targetYear = year ?? now.getFullYear();

  // Upsert: update if exists for this category/month/year, else create
  const existing = await prisma.budget.findFirst({
    where: {
      userId: user.id,
      category: category as ExpenseCategory,
      month: targetMonth,
      year: targetYear,
    },
  });

  let budget;
  if (existing) {
    budget = await prisma.budget.update({
      where: { id: existing.id },
      data: { limit: parseFloat(limit) },
    });
  } else {
    budget = await prisma.budget.create({
      data: {
        userId: user.id,
        category: category as ExpenseCategory,
        limit: parseFloat(limit),
        month: targetMonth,
        year: targetYear,
      },
    });
  }

  return NextResponse.json(budget, { status: 201 });
}
