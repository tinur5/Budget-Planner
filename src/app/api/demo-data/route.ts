import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/demo-data - Load sample data into the current household
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // householdId may be absent from a stale JWT; fall back to a DB lookup
  let householdId = session.user.householdId;
  if (!householdId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { householdId: true },
    });
    householdId = dbUser?.householdId ?? null;
  }

  if (!householdId) {
    return NextResponse.json({ error: "Kein Haushalt gefunden" }, { status: 400 });
  }

  // Get household users
  const users = await prisma.user.findMany({
    where: { householdId },
    orderBy: { createdAt: "asc" },
  });

  if (users.length === 0) {
    return NextResponse.json({ error: "Keine Benutzer gefunden" }, { status: 400 });
  }

  const adminUser = users.find((u) => u.role === "ADMIN") ?? users[0];
  const partnerUser = users.find((u) => u.id !== adminUser.id) ?? adminUser;

  // Clear existing household data
  await prisma.transferSuggestion.deleteMany({ where: { householdId } });
  await prisma.monthlyPlan.deleteMany({ where: { householdId } });
  await prisma.budget.deleteMany({ where: { householdId } });
  await prisma.expense.deleteMany({ where: { householdId } });
  await prisma.income.deleteMany({ where: { householdId } });
  await prisma.allocationRule.deleteMany({ where: { householdId } });
  await prisma.savingsGoal.deleteMany({ where: { householdId } });
  await prisma.pot.deleteMany({ where: { householdId } });

  // Create sample pots
  const businessPot = await prisma.pot.create({
    data: {
      householdId,
      name: "Business",
      type: "BUSINESS",
      color: "#6366f1",
      icon: "briefcase",
      description: "Events, Produkte, Geschäftsessen, Business-Aufwand",
      isShared: false,
      ownerUserId: partnerUser.id,
      currentBalance: 2400,
    },
  });

  const personalPot = await prisma.pot.create({
    data: {
      householdId,
      name: "Persönlich",
      type: "PERSONAL",
      color: "#ec4899",
      icon: "heart",
      description: "Friseur, Kleider, Ausflüge, Essen",
      isShared: false,
      ownerUserId: partnerUser.id,
      currentBalance: 3000,
    },
  });

  const sharedPot = await prisma.pot.create({
    data: {
      householdId,
      name: "Gemeinsames Konto",
      type: "SHARED",
      color: "#14b8a6",
      icon: "home",
      description: "Haushalt, Familie, Fixkosten",
      isShared: true,
      currentBalance: 4500,
    },
  });

  const ahvPot = await prisma.pot.create({
    data: {
      householdId,
      name: "AHV Rücklage",
      type: "AHV",
      color: "#f97316",
      icon: "shield",
      description: "AHV-Rückstellungen",
      isShared: true,
      currentBalance: 3870,
      targetAmount: 15000,
    },
  });

  const savingsPot = await prisma.pot.create({
    data: {
      householdId,
      name: "Sparkonto",
      type: "SAVINGS",
      color: "#22c55e",
      icon: "piggy-bank",
      description: "Überschuss, Zielersparnis",
      isShared: true,
      currentBalance: 8750,
      targetAmount: 20000,
    },
  });

  const adminFirstName = adminUser.name.split(" ")[0];
  await prisma.pot.create({
    data: {
      householdId,
      name: `Persönlich ${adminFirstName}`,
      type: "PERSONAL",
      color: "#3b82f6",
      icon: "wallet",
      description: `Persönliches Budget ${adminUser.name}`,
      isShared: false,
      ownerUserId: adminUser.id,
      currentBalance: 1200,
    },
  });

  // Create allocation rules
  await prisma.allocationRule.createMany({
    data: [
      {
        householdId,
        name: "20% Business",
        type: "PERCENTAGE",
        value: 20,
        priority: 1,
        targetPotId: businessPot.id,
        appliesToUserId: partnerUser.id,
        isActive: true,
      },
      {
        householdId,
        name: "15% AHV Rücklage",
        type: "PERCENTAGE",
        value: 15,
        priority: 2,
        targetPotId: ahvPot.id,
        appliesToUserId: partnerUser.id,
        isActive: true,
      },
      {
        householdId,
        name: "CHF 1'000 Persönlich",
        type: "FIXED",
        value: 1000,
        priority: 3,
        targetPotId: personalPot.id,
        appliesToUserId: partnerUser.id,
        isActive: true,
      },
      {
        householdId,
        name: "CHF 1'500 Gemeinsames Konto",
        type: "FIXED",
        value: 1500,
        priority: 4,
        targetPotId: sharedPot.id,
        isActive: true,
      },
      {
        householdId,
        name: "Restbetrag → Sparkonto",
        type: "REMAINDER",
        value: 0,
        priority: 10,
        targetPotId: savingsPot.id,
        isActive: true,
      },
    ],
  });

  // Create sample incomes (current month ±1)
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];

  const incomeOffsets = [-1, 0, 1];
  for (const offset of incomeOffsets) {
    let month = currentMonth + offset;
    let year = currentYear;
    if (month < 1) { month += 12; year -= 1; }
    if (month > 12) { month -= 12; year += 1; }
    await prisma.income.create({
      data: {
        householdId,
        userId: partnerUser.id,
        source: `Honorar ${monthNames[month - 1]}`,
        amount: [5200, 4300, 6100][offset + 1],
        date: new Date(year, month - 1, 1),
        month,
        year,
        type: "BUSINESS",
        note: "Monatliches Honorar aus selbstständiger Tätigkeit",
      },
    });
  }

  await prisma.income.create({
    data: {
      householdId,
      userId: adminUser.id,
      source: `Lohn ${adminFirstName}`,
      amount: 7200,
      date: new Date(currentYear, currentMonth - 1, 25),
      month: currentMonth,
      year: currentYear,
      type: "SALARY",
    },
  });

  // Create sample expenses for current month
  const expensesData = [
    { userId: partnerUser.id, potId: businessPot.id, amount: 180, day: 5, category: "Eventmaterial", description: "Drucksachen für Event" },
    { userId: partnerUser.id, potId: businessPot.id, amount: 95, day: 8, category: "Geschäftsessen", description: "Kundenessen Restaurant Krone" },
    { userId: partnerUser.id, potId: personalPot.id, amount: 145, day: 10, category: "Beauty & Körperpflege", description: "Friseur & Färben" },
    { userId: partnerUser.id, potId: personalPot.id, amount: 280, day: 12, category: "Kleider & Mode", description: "Neue Jeans & Bluse" },
    { userId: adminUser.id, potId: sharedPot.id, amount: 850, day: 1, category: "Wohnen", description: "Miete" },
    { userId: adminUser.id, potId: sharedPot.id, amount: 320, day: 3, category: "Lebensmittel", description: "Wocheneinkauf Coop & Migros" },
    { userId: adminUser.id, potId: sharedPot.id, amount: 125, day: 6, category: "Transport", description: "Monatskarte SBB" },
    { userId: partnerUser.id, potId: personalPot.id, amount: 75, day: 15, category: "Restaurant & Essen", description: "Mittagessen mit Freundin" },
    { userId: adminUser.id, potId: savingsPot.id, amount: 500, day: 28, category: "Sparen", description: "Monatlicher Sparübertrag" },
    { userId: partnerUser.id, potId: ahvPot.id, amount: 645, day: 28, category: "Rücklagen", description: "AHV Rücklage" },
  ];

  for (const exp of expensesData) {
    await prisma.expense.create({
      data: {
        householdId,
        userId: exp.userId,
        potId: exp.potId,
        amount: exp.amount,
        date: new Date(currentYear, currentMonth - 1, exp.day),
        category: exp.category,
        description: exp.description,
      },
    });
  }

  // Create savings goals
  const nextYear = currentYear + 1;
  await prisma.savingsGoal.createMany({
    data: [
      {
        householdId,
        name: "Notfallfonds",
        targetAmount: 15000,
        currentAmount: 8750,
        color: "#10b981",
        icon: "shield",
      },
      {
        householdId,
        name: `Ferien ${nextYear}`,
        targetAmount: 5000,
        currentAmount: 1800,
        dueDate: new Date(`${nextYear}-07-01`),
        color: "#6366f1",
        icon: "sun",
      },
      {
        householdId,
        userId: partnerUser.id,
        name: "Weiterbildung",
        targetAmount: 3500,
        currentAmount: 900,
        dueDate: new Date(`${nextYear}-12-31`),
        color: "#8b5cf6",
        icon: "book",
      },
    ],
  });

  // Create budgets for current month
  await prisma.budget.createMany({
    data: [
      { householdId, potId: businessPot.id, month: currentMonth, year: currentYear, plannedAmount: 1040, actualAmount: 0 },
      { householdId, potId: personalPot.id, month: currentMonth, year: currentYear, plannedAmount: 1000, actualAmount: 0 },
      { householdId, potId: sharedPot.id, month: currentMonth, year: currentYear, plannedAmount: 1500, actualAmount: 0 },
      { householdId, potId: ahvPot.id, month: currentMonth, year: currentYear, plannedAmount: 645, actualAmount: 0 },
      { householdId, potId: savingsPot.id, month: currentMonth, year: currentYear, plannedAmount: 1115, actualAmount: 0 },
    ],
  });

  return NextResponse.json({
    message: "Beispieldaten erfolgreich geladen",
  });
}
