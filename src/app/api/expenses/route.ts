import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/expenses - List expenses
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const url = new URL(req.url);
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");
  const potId = url.searchParams.get("potId");
  const limit = url.searchParams.get("limit");

  const where: Record<string, unknown> = { householdId: session.user.householdId };
  if (potId) where.potId = potId;

  // Filter by month/year using date range
  if (month && year) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    where.date = { gte: startDate, lte: endDate };
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    take: limit ? parseInt(limit) : undefined,
    include: {
      user: { select: { id: true, name: true } },
      pot: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json(expenses);
}

// POST /api/expenses - Create expense
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await req.json();
  const { amount, date, category, description, note, potId, tags, isRecurring, userId } = body;

  if (!amount || !date || !category) {
    return NextResponse.json(
      { error: "Betrag, Datum und Kategorie sind erforderlich" },
      { status: 400 }
    );
  }

  const expense = await prisma.expense.create({
    data: {
      householdId: session.user.householdId,
      userId: userId || session.user.id,
      amount: parseFloat(amount),
      date: new Date(date),
      category,
      description,
      note,
      potId: potId || null,
      tags: tags ? JSON.stringify(tags) : null,
      isRecurring: isRecurring || false,
    },
    include: {
      user: { select: { id: true, name: true } },
      pot: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
