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

  const asset = await prisma.asset.findFirst({
    where: { id, userId: user.id },
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.asset.update({
    where: { id },
    data: {
      value: body.value !== undefined ? parseFloat(body.value) : undefined,
      name: body.name ?? undefined,
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

  const asset = await prisma.asset.findFirst({
    where: { id, userId: user.id },
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
