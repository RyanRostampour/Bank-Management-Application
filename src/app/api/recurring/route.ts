import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { NextRequest, NextResponse } from "next/server";
import { ExpenseCategory } from "@prisma/client";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const recurring = await prisma.recurringExpense.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(recurring);
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { amount, description, category, dayOfMonth } = body;

  if (!amount || !description || !category || !dayOfMonth) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const item = await prisma.recurringExpense.create({
    data: {
      userId: user.id,
      amount: parseFloat(amount),
      description,
      category: category as ExpenseCategory,
      dayOfMonth: parseInt(dayOfMonth),
    },
  });

  return NextResponse.json(item, { status: 201 });
}
