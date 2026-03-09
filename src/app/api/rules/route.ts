import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/rules - List allocation rules
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const rules = await prisma.allocationRule.findMany({
    where: { householdId: session.user.householdId },
    orderBy: { priority: "asc" },
    include: {
      targetPot: { select: { id: true, name: true, color: true } },
      appliesTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(rules);
}

// POST /api/rules - Create a rule
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    type,
    value,
    priority,
    targetPotId,
    appliesToUserId,
    appliesToIncomeType,
    minAmount,
    maxAmount,
    thresholdAmount,
    isActive,
  } = body;

  if (!name || !type || value === undefined || !targetPotId) {
    return NextResponse.json(
      { error: "Name, Typ, Wert und Ziel-Topf sind erforderlich" },
      { status: 400 }
    );
  }

  const rule = await prisma.allocationRule.create({
    data: {
      householdId: session.user.householdId,
      name,
      type,
      value: parseFloat(value),
      priority: priority || 1,
      targetPotId,
      appliesToUserId: appliesToUserId || null,
      appliesToIncomeType: appliesToIncomeType || null,
      minAmount: minAmount ? parseFloat(minAmount) : null,
      maxAmount: maxAmount ? parseFloat(maxAmount) : null,
      thresholdAmount: thresholdAmount ? parseFloat(thresholdAmount) : null,
      isActive: isActive ?? true,
    },
    include: {
      targetPot: { select: { id: true, name: true, color: true } },
      appliesTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(rule, { status: 201 });
}
