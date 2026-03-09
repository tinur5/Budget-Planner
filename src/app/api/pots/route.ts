import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/pots - List all pots for the household
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const pots = await prisma.pot.findMany({
    where: { householdId: session.user.householdId },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { expenses: true } },
    },
  });

  return NextResponse.json(pots);
}

// POST /api/pots - Create a new pot
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await req.json();
  const { name, type, color, icon, description, isShared, ownerUserId, targetAmount } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "Name und Typ sind erforderlich" }, { status: 400 });
  }

  const pot = await prisma.pot.create({
    data: {
      householdId: session.user.householdId,
      name,
      type: type || "GENERAL",
      color: color || "#6366f1",
      icon: icon || "wallet",
      description,
      isShared: isShared ?? true,
      ownerUserId,
      targetAmount: targetAmount ? parseFloat(targetAmount) : null,
    },
  });

  return NextResponse.json(pot, { status: 201 });
}
