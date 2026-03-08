import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { NextRequest, NextResponse } from "next/server";
import { DebtStrategy } from "@prisma/client";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const debts = await prisma.debt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(debts);
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { name, totalAmount, paidAmount, interestRate, minimumPayment, strategy } = body;

  if (!name || !totalAmount || !minimumPayment) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const debt = await prisma.debt.create({
    data: {
      userId: user.id,
      name,
      totalAmount: parseFloat(totalAmount),
      paidAmount: parseFloat(paidAmount || "0"),
      interestRate: parseFloat(interestRate || "0"),
      minimumPayment: parseFloat(minimumPayment),
      strategy: (strategy as DebtStrategy) || "AVALANCHE",
    },
  });

  return NextResponse.json(debt, { status: 201 });
}
