import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAllocationEngine } from "@/lib/allocation-engine";

// GET /api/monthly-plan - Get monthly plan and generate suggestions
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const url = new URL(req.url);
  const now = new Date();
  const month = parseInt(url.searchParams.get("month") || String(now.getMonth() + 1));
  const year = parseInt(url.searchParams.get("year") || String(now.getFullYear()));

  const householdId = session.user.householdId;

  // Get monthly incomes
  const incomes = await prisma.income.findMany({
    where: { householdId, month, year },
    include: { user: { select: { id: true, name: true } } },
  });

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  // Get allocation rules
  const rules = await prisma.allocationRule.findMany({
    where: { householdId, isActive: true },
    orderBy: { priority: "asc" },
    include: { targetPot: true },
  });

  // Run the allocation engine
  const allocationSummary = runAllocationEngine({ totalIncome, rules });

  // Get monthly expenses
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const expenses = await prisma.expense.findMany({
    where: { householdId, date: { gte: startDate, lte: endDate } },
    include: {
      pot: { select: { id: true, name: true, color: true } },
    },
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Get or create monthly plan
  let plan = await prisma.monthlyPlan.findUnique({
    where: { householdId_month_year: { householdId, month, year } },
  });

  if (!plan) {
    plan = await prisma.monthlyPlan.create({
      data: {
        householdId,
        month,
        year,
        totalIncome,
        allocatedAmount: allocationSummary.totalAllocated,
        remainderAmount: allocationSummary.remainder,
      },
    });
  } else {
    plan = await prisma.monthlyPlan.update({
      where: { id: plan.id },
      data: {
        totalIncome,
        allocatedAmount: allocationSummary.totalAllocated,
        remainderAmount: allocationSummary.remainder,
      },
    });
  }

  // Get transfer suggestions for this month
  const existingSuggestions = await prisma.transferSuggestion.findMany({
    where: { householdId, month, year },
    include: { targetPot: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json({
    plan,
    incomes,
    totalIncome,
    totalExpenses,
    allocationSummary,
    suggestions: existingSuggestions,
  });
}

// POST /api/monthly-plan/generate - Generate and save transfer suggestions
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await req.json();
  const now = new Date();
  const month = body.month || now.getMonth() + 1;
  const year = body.year || now.getFullYear();
  const householdId = session.user.householdId;

  // Get incomes for this month
  const incomes = await prisma.income.findMany({
    where: { householdId, month, year },
  });
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  // Get rules
  const rules = await prisma.allocationRule.findMany({
    where: { householdId, isActive: true },
    orderBy: { priority: "asc" },
    include: { targetPot: true },
  });

  // Run engine
  const summary = runAllocationEngine({ totalIncome, rules });

  // Delete old suggestions for this month
  await prisma.transferSuggestion.deleteMany({
    where: { householdId, month, year },
  });

  // Create new suggestions
  const newSuggestions = await Promise.all(
    summary.allocations.map((alloc) =>
      prisma.transferSuggestion.create({
        data: {
          householdId,
          month,
          year,
          sourceDescription: `Einkommen ${month}/${year}`,
          targetPotId: alloc.potId,
          suggestedAmount: alloc.suggestedAmount,
          rationale: alloc.rationale,
          status: "PENDING",
        },
        include: { targetPot: { select: { id: true, name: true, color: true } } },
      })
    )
  );

  return NextResponse.json({ suggestions: newSuggestions, summary });
}

// PATCH /api/monthly-plan - Update suggestion status
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await req.json();
  const { suggestionId, status } = body;

  if (!suggestionId || !status) {
    return NextResponse.json({ error: "Fehler" }, { status: 400 });
  }

  const suggestion = await prisma.transferSuggestion.findFirst({
    where: { id: suggestionId, householdId: session.user.householdId },
  });

  if (!suggestion) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const updated = await prisma.transferSuggestion.update({
    where: { id: suggestionId },
    data: { status },
  });

  return NextResponse.json(updated);
}
