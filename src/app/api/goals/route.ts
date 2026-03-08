import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { name, targetAmount, savedAmount, targetDate } = body;

  if (!name || !targetAmount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const goal = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name,
      targetAmount: parseFloat(targetAmount),
      savedAmount: savedAmount ? parseFloat(savedAmount) : 0,
      targetDate: targetDate ? new Date(targetDate) : null,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
