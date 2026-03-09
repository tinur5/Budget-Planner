import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const rule = await prisma.allocationRule.findFirst({
    where: { id: params.id, householdId: session.user.householdId },
  });

  if (!rule) {
    return NextResponse.json({ error: "Regel nicht gefunden" }, { status: 404 });
  }

  const body = await req.json();
  const {
    name, type, value, priority, targetPotId,
    appliesToUserId, appliesToIncomeType,
    minAmount, maxAmount, thresholdAmount, isActive,
  } = body;

  const updated = await prisma.allocationRule.update({
    where: { id: params.id },
    data: {
      name,
      type,
      value: value !== undefined ? parseFloat(value) : undefined,
      priority,
      targetPotId,
      appliesToUserId: appliesToUserId || null,
      appliesToIncomeType: appliesToIncomeType || null,
      minAmount: minAmount ? parseFloat(minAmount) : null,
      maxAmount: maxAmount ? parseFloat(maxAmount) : null,
      thresholdAmount: thresholdAmount ? parseFloat(thresholdAmount) : null,
      isActive,
    },
    include: {
      targetPot: { select: { id: true, name: true, color: true } },
      appliesTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const rule = await prisma.allocationRule.findFirst({
    where: { id: params.id, householdId: session.user.householdId },
  });

  if (!rule) {
    return NextResponse.json({ error: "Regel nicht gefunden" }, { status: 404 });
  }

  await prisma.allocationRule.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
