import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/settings - Get household settings and users
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const [household, users] = await Promise.all([
    prisma.household.findUnique({
      where: { id: session.user.householdId },
    }),
    prisma.user.findMany({
      where: { householdId: session.user.householdId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hidePersonalBudgets: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ household, users });
}

// PATCH /api/settings - Update user settings
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await req.json();
  const { name, hidePersonalBudgets, currentPassword, newPassword } = body;

  // Handle password change
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Aktuelles Passwort ist erforderlich" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Aktuelles Passwort ist falsch" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: hash },
    });
  }

  // Update profile
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || undefined,
      hidePersonalBudgets: hidePersonalBudgets,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      hidePersonalBudgets: true,
    },
  });

  return NextResponse.json(updated);
}
