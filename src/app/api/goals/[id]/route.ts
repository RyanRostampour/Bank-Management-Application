import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const body = await request.json();

  const goal = await prisma.savingsGoal.findFirst({
    where: { id, userId: user.id },
  });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.savingsGoal.update({
    where: { id },
    data: {
      savedAmount: body.savedAmount !== undefined ? parseFloat(body.savedAmount) : undefined,
      name: body.name ?? undefined,
      targetAmount: body.targetAmount !== undefined ? parseFloat(body.targetAmount) : undefined,
      targetDate: body.targetDate !== undefined ? (body.targetDate ? new Date(body.targetDate) : null) : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  const goal = await prisma.savingsGoal.findFirst({
    where: { id, userId: user.id },
  });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.savingsGoal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
