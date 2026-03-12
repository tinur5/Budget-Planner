/**
 * Seed script for Familie Graf demo data
 * Run with: npx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.transferSuggestion.deleteMany();
  await prisma.monthlyPlan.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.income.deleteMany();
  await prisma.allocationRule.deleteMany();
  await prisma.savingsGoal.deleteMany();
  await prisma.pot.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.household.deleteMany();

  // Create Household
  const household = await prisma.household.create({
    data: {
      name: "Familie Graf",
      currency: "CHF",
    },
  });
  console.log("✅ Haushalt erstellt:", household.name);

  // Create Users
  const passwordHash = await bcrypt.hash("welcome", 12);

  const martin = await prisma.user.create({
    data: {
      name: "Martin Graf",
      email: "tinur5@hotmail.com",
      passwordHash,
      role: "ADMIN",
      householdId: household.id,
    },
  });

  const francine = await prisma.user.create({
    data: {
      name: "Francine Graf",
      email: "francine.graf@outlook.com",
      passwordHash,
      role: "PARTNER",
      householdId: household.id,
    },
  });
  console.log("✅ Benutzer erstellt: Martin & Francine");

  // Create Pots
  const businessPot = await prisma.pot.create({
    data: {
      householdId: household.id,
      name: "Business Francine",
      type: "BUSINESS",
      color: "#6366f1",
      icon: "briefcase",
      description: "Events, Produkte, Geschäftsessen, Business-Aufwand",
      isShared: false,
      ownerUserId: francine.id,
      currentBalance: 2400,
    },
  });

  const personalPot = await prisma.pot.create({
    data: {
      householdId: household.id,
      name: "Persönlich Francine",
      type: "PERSONAL",
      color: "#ec4899",
      icon: "heart",
      description: "Friseur, Kleider, Ausflüge, Essen",
      isShared: false,
      ownerUserId: francine.id,
      currentBalance: 3000,
    },
  });

  const sharedPot = await prisma.pot.create({
    data: {
      householdId: household.id,
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
      householdId: household.id,
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
      householdId: household.id,
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

  const martinPot = await prisma.pot.create({
    data: {
      householdId: household.id,
      name: "Persönlich Martin",
      type: "PERSONAL",
      color: "#3b82f6",
      icon: "wallet",
      description: "Persönliches Budget Martin",
      isShared: false,
      ownerUserId: martin.id,
      currentBalance: 1200,
    },
  });
  console.log("✅ 6 Töpfe erstellt");

  // Create Allocation Rules
  await prisma.allocationRule.create({
    data: {
      householdId: household.id,
      name: "20% Business Francine",
      type: "PERCENTAGE",
      value: 20,
      priority: 1,
      targetPotId: businessPot.id,
      appliesToUserId: francine.id,
      isActive: true,
    },
  });

  await prisma.allocationRule.create({
    data: {
      householdId: household.id,
      name: "15% AHV Rücklage",
      type: "PERCENTAGE",
      value: 15,
      priority: 2,
      targetPotId: ahvPot.id,
      appliesToUserId: francine.id,
      isActive: true,
    },
  });

  await prisma.allocationRule.create({
    data: {
      householdId: household.id,
      name: "CHF 1'000 Persönlich Francine",
      type: "FIXED",
      value: 1000,
      priority: 3,
      targetPotId: personalPot.id,
      appliesToUserId: francine.id,
      isActive: true,
    },
  });

  await prisma.allocationRule.create({
    data: {
      householdId: household.id,
      name: "CHF 1'500 Gemeinsames Konto",
      type: "FIXED",
      value: 1500,
      priority: 4,
      targetPotId: sharedPot.id,
      isActive: true,
    },
  });

  await prisma.allocationRule.create({
    data: {
      householdId: household.id,
      name: "Restbetrag → Sparkonto",
      type: "REMAINDER",
      value: 0,
      priority: 10,
      targetPotId: savingsPot.id,
      isActive: true,
    },
  });
  console.log("✅ 5 Verteilungsregeln erstellt");

  // Create Incomes for last 3 months
  const now = new Date();
  const months = [
    { month: now.getMonth() - 1, year: now.getFullYear(), amount: 5200 },
    { month: now.getMonth(), year: now.getFullYear(), amount: 4300 },
    { month: now.getMonth() + 1, year: now.getFullYear(), amount: 6100 },
  ];

  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];

  for (const m of months) {
    const actualMonth = ((m.month - 1 + 12) % 12) + 1;
    const actualYear = m.month <= 0 ? m.year - 1 : m.year;
    const date = new Date(actualYear, actualMonth - 1, 1);

    await prisma.income.create({
      data: {
        householdId: household.id,
        userId: francine.id,
        source: `Honorar ${monthNames[actualMonth - 1]}`,
        amount: m.amount,
        date,
        month: actualMonth,
        year: actualYear,
        type: "BUSINESS",
        note: "Monatliches Honorar aus selbstständiger Tätigkeit",
      },
    });
  }

  // Martin's income
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  await prisma.income.create({
    data: {
      householdId: household.id,
      userId: martin.id,
      source: "Lohn Martin",
      amount: 7200,
      date: new Date(currentYear, currentMonth - 1, 25),
      month: currentMonth,
      year: currentYear,
      type: "SALARY",
    },
  });
  console.log("✅ Einnahmen erstellt");

  // Create Expenses
  const expensesData = [
    // Current month
    {
      userId: francine.id,
      potId: businessPot.id,
      amount: 180,
      date: new Date(currentYear, currentMonth - 1, 5),
      category: "Eventmaterial",
      description: "Drucksachen für Event",
    },
    {
      userId: francine.id,
      potId: businessPot.id,
      amount: 95,
      date: new Date(currentYear, currentMonth - 1, 8),
      category: "Geschäftsessen",
      description: "Kundenessen Restaurant Krone",
    },
    {
      userId: francine.id,
      potId: personalPot.id,
      amount: 145,
      date: new Date(currentYear, currentMonth - 1, 10),
      category: "Beauty & Körperpflege",
      description: "Friseur & Färben",
    },
    {
      userId: francine.id,
      potId: personalPot.id,
      amount: 280,
      date: new Date(currentYear, currentMonth - 1, 12),
      category: "Kleider & Mode",
      description: "Neue Jeans & Bluse",
    },
    {
      userId: martin.id,
      potId: sharedPot.id,
      amount: 850,
      date: new Date(currentYear, currentMonth - 1, 1),
      category: "Wohnen",
      description: "Miete März",
    },
    {
      userId: martin.id,
      potId: sharedPot.id,
      amount: 320,
      date: new Date(currentYear, currentMonth - 1, 3),
      category: "Lebensmittel",
      description: "Wocheneinkauf Coop & Migros",
    },
    {
      userId: martin.id,
      potId: sharedPot.id,
      amount: 125,
      date: new Date(currentYear, currentMonth - 1, 6),
      category: "Transport",
      description: "Monatskarte SBB",
    },
    {
      userId: francine.id,
      potId: personalPot.id,
      amount: 75,
      date: new Date(currentYear, currentMonth - 1, 15),
      category: "Restaurant & Essen",
      description: "Mittagessen mit Freundin",
    },
    {
      userId: martin.id,
      potId: savingsPot.id,
      amount: 500,
      date: new Date(currentYear, currentMonth - 1, 28),
      category: "Sparen",
      description: "Monatlicher Sparübertrag",
    },
    {
      userId: francine.id,
      potId: ahvPot.id,
      amount: 645,
      date: new Date(currentYear, currentMonth - 1, 28),
      category: "Rücklagen",
      description: "AHV Rücklage März",
    },
  ];

  for (const exp of expensesData) {
    await prisma.expense.create({
      data: {
        householdId: household.id,
        userId: exp.userId,
        potId: exp.potId,
        amount: exp.amount,
        date: exp.date,
        category: exp.category,
        description: exp.description,
      },
    });
  }
  console.log("✅ Ausgaben erstellt");

  // Create Savings Goals
  await prisma.savingsGoal.create({
    data: {
      householdId: household.id,
      name: "Notfallfonds",
      targetAmount: 15000,
      currentAmount: 8750,
      color: "#10b981",
      icon: "shield",
    },
  });

  await prisma.savingsGoal.create({
    data: {
      householdId: household.id,
      name: "Ferien 2025",
      targetAmount: 5000,
      currentAmount: 1800,
      dueDate: new Date("2025-07-01"),
      color: "#6366f1",
      icon: "sun",
    },
  });

  await prisma.savingsGoal.create({
    data: {
      householdId: household.id,
      userId: francine.id,
      name: "Weiterbildung",
      targetAmount: 3500,
      currentAmount: 900,
      dueDate: new Date("2025-12-31"),
      color: "#8b5cf6",
      icon: "book",
    },
  });
  console.log("✅ Sparziele erstellt");

  // Create Budgets for current month
  const budgetsData = [
    { potId: businessPot.id, plannedAmount: 1040 },
    { potId: personalPot.id, plannedAmount: 1000 },
    { potId: sharedPot.id, plannedAmount: 1500 },
    { potId: ahvPot.id, plannedAmount: 645 },
    { potId: savingsPot.id, plannedAmount: 1115 },
  ];

  for (const budget of budgetsData) {
    await prisma.budget.create({
      data: {
        householdId: household.id,
        potId: budget.potId,
        month: currentMonth,
        year: currentYear,
        plannedAmount: budget.plannedAmount,
        actualAmount: 0,
      },
    });
  }
  console.log("✅ Budgets erstellt");

  console.log("\n🎉 Seed abgeschlossen!");
  console.log("📧 Demo-Zugänge:");
  console.log("   tinur5@hotmail.com / welcome (Admin)");
  console.log("   francine.graf@outlook.com / welcome (Partner)");
}

main()
  .catch((e) => {
    console.error("❌ Seed fehlgeschlagen:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
