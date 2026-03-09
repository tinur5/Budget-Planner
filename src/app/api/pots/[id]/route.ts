import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/pots/[id] - Update a pot
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const pot = await prisma.pot.findFirst({
    where: { id: params.id, householdId: session.user.householdId },
  });

  if (!pot) {
    return NextResponse.json({ error: "Topf nicht gefunden" }, { status: 404 });
  }

  const body = await req.json();
  const { name, type, color, icon, description, isShared, ownerUserId, targetAmount, currentBalance } = body;

  const updated = await prisma.pot.update({
    where: { id: params.id },
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

// DELETE /api/pots/[id] - Delete a pot
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const pot = await prisma.pot.findFirst({
    where: { id: params.id, householdId: session.user.householdId },
  });

  if (!pot) {
    return NextResponse.json({ error: "Topf nicht gefunden" }, { status: 404 });
  }

  await prisma.pot.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
