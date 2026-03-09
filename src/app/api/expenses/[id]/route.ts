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
  const expense = await prisma.expense.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!expense) {
    return NextResponse.json({ error: "Ausgabe nicht gefunden" }, { status: 404 });
  }

  const body = await req.json();
  const { amount, date, category, description, note, potId, tags, isRecurring, userId } = body;

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      amount: amount ? parseFloat(amount) : undefined,
      date: date ? new Date(date) : undefined,
      category,
      description,
      note,
      potId: potId || null,
      tags: tags ? JSON.stringify(tags) : null,
      isRecurring,
      userId: userId || undefined,
    },
    include: {
      user: { select: { id: true, name: true } },
      pot: { select: { id: true, name: true, color: true } },
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
  const expense = await prisma.expense.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!expense) {
    return NextResponse.json({ error: "Ausgabe nicht gefunden" }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
