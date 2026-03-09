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

  const income = await prisma.income.findFirst({
    where: { id: params.id, householdId: session.user.householdId },
  });

  if (!income) {
    return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
  }

  const body = await req.json();
  const { source, amount, date, type, note, userId } = body;

  const dateObj = date ? new Date(date) : income.date;
  const updated = await prisma.income.update({
    where: { id: params.id },
    data: {
      source,
      amount: amount ? parseFloat(amount) : undefined,
      date: dateObj,
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      type,
      note,
      userId: userId || undefined,
    },
    include: { user: { select: { id: true, name: true } } },
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

  const income = await prisma.income.findFirst({
    where: { id: params.id, householdId: session.user.householdId },
  });

  if (!income) {
    return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
  }

  await prisma.income.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
