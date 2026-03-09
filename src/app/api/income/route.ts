import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/income - List income entries
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const url = new URL(req.url);
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");

  const where: Record<string, unknown> = { householdId: session.user.householdId };
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);

  const incomes = await prisma.income.findMany({
    where,
    orderBy: { date: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(incomes);
}

// POST /api/income - Create income entry
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await req.json();
  const { source, amount, date, type, note, userId } = body;

  if (!source || !amount || !date) {
    return NextResponse.json(
      { error: "Quelle, Betrag und Datum sind erforderlich" },
      { status: 400 }
    );
  }

  const dateObj = new Date(date);
  const income = await prisma.income.create({
    data: {
      householdId: session.user.householdId,
      userId: userId || session.user.id,
      source,
      amount: parseFloat(amount),
      date: dateObj,
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      type: type || "SALARY",
      note,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(income, { status: 201 });
}
