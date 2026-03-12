import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/setup-users
 *
 * One-time initialisation endpoint: creates the household and the two demo
 * users if they do not exist yet.  Returns 409 when the admin account is
 * already present so the endpoint is safe to call multiple times.
 *
 * This endpoint is intentionally public so it can be triggered from the
 * login page on the first deployment (before any user exists).  It becomes
 * a no-op (HTTP 409) as soon as the admin account exists, so it cannot be
 * used to overwrite or duplicate data.
 *
 * ⚠️  Change the default password after the first login via Settings.
 */
export async function POST() {
  // Guard: refuse if the admin user already exists
  const existing = await prisma.user.findUnique({
    where: { email: "tinur5@hotmail.com" },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Benutzer bereits vorhanden" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash("welcome", 12);

  // Create household
  const household = await prisma.household.create({
    data: {
      name: "Familie Graf",
      currency: "CHF",
    },
  });

  // Create admin user
  await prisma.user.create({
    data: {
      name: "Martin Graf",
      email: "tinur5@hotmail.com",
      passwordHash,
      role: "ADMIN",
      householdId: household.id,
    },
  });

  // Create partner user
  await prisma.user.create({
    data: {
      name: "Francine Graf",
      email: "francine.graf@outlook.com",
      passwordHash,
      role: "PARTNER",
      householdId: household.id,
    },
  });

  return NextResponse.json({
    message: "Benutzer erfolgreich erstellt",
    users: [
      { email: "tinur5@hotmail.com", role: "ADMIN" },
      { email: "francine.graf@outlook.com", role: "PARTNER" },
    ],
  });
}
