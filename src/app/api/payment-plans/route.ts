import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const plans = await prisma.paymentPlan.findMany({
    where: { userId: user.id },
    include: { payments: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(plans);
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { name, totalAmount, interestRate, installments, startDate } = body;

  if (!name || !totalAmount || !installments || !startDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + parseInt(installments));

  // Calculate monthly payment with interest
  const principal = parseFloat(totalAmount);
  const rate = parseFloat(interestRate || "0") / 100 / 12;
  const n = parseInt(installments);
  const monthlyPayment =
    rate === 0
      ? principal / n
      : (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);

  const plan = await prisma.paymentPlan.create({
    data: {
      userId: user.id,
      name,
      totalAmount: principal,
      interestRate: parseFloat(interestRate || "0"),
      installments: n,
      startDate: start,
      endDate: end,
    },
  });

  // Create payment schedule
  const payments = [];
  for (let i = 0; i < n; i++) {
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    payments.push({
      paymentPlanId: plan.id,
      amount: monthlyPayment,
      dueDate,
    });
  }

  await prisma.payment.createMany({ data: payments });

  return NextResponse.json(plan, { status: 201 });
}
