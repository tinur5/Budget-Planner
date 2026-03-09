import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;
  const pot = await prisma.pot.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!pot) {
    return NextResponse.json({ error: "Topf nicht gefunden" }, { status: 404 });
  }

  const body = await req.json();
  const { name, type, color, icon, description, isShared, ownerUserId, targetAmount, currentBalance } = body;

  const updated = await prisma.pot.update({
    where: { id },
    data: {
      name,
      type,
      color,
      icon,
      description,
      isShared,
      ownerUserId,
      targetAmount: targetAmount ? parseFloat(targetAmount) : null,
      currentBalance: currentBalance !== undefined ? parseFloat(currentBalance) : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;
  const pot = await prisma.pot.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!pot) {
    return NextResponse.json({ error: "Topf nicht gefunden" }, { status: 404 });
  }

  await prisma.pot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
