import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports - Aggregated reports data
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const url = new URL(req.url);
  const now = new Date();
  const year = parseInt(url.searchParams.get("year") || String(now.getFullYear()));
  const householdId = session.user.householdId;

  // Monthly income/expense data for the year
  const monthlyData = [];
  for (let m = 1; m <= 12; m++) {
    const startDate = new Date(year, m - 1, 1);
    const endDate = new Date(year, m, 0, 23, 59, 59);

    const [incomes, expenses] = await Promise.all([
      prisma.income.aggregate({
        where: { householdId, month: m, year },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { householdId, date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
    ]);

    monthlyData.push({
      month: m,
      income: incomes._sum.amount || 0,
      expenses: expenses._sum.amount || 0,
      savings: (incomes._sum.amount || 0) - (expenses._sum.amount || 0),
    });
  }

  // Expense by category (current year)
  const startYear = new Date(year, 0, 1);
  const endYear = new Date(year, 11, 31, 23, 59, 59);
  const allExpenses = await prisma.expense.findMany({
    where: { householdId, date: { gte: startYear, lte: endYear } },
    select: { category: true, amount: true },
  });

  const categoryMap: Record<string, number> = {};
  allExpenses.forEach((exp) => {
    categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
  });

  const expensesByCategory = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Pot allocation overview
  const pots = await prisma.pot.findMany({
    where: { householdId },
    include: {
      expenses: {
        where: { date: { gte: startYear, lte: endYear } },
        select: { amount: true },
      },
    },
  });

  const potAllocation = pots.map((pot) => ({
    id: pot.id,
    name: pot.name,
    color: pot.color,
    totalExpenses: pot.expenses.reduce((s, e) => s + e.amount, 0),
    currentBalance: pot.currentBalance,
    targetAmount: pot.targetAmount,
  }));

  // Savings trend (running total)
  const savingsGoals = await prisma.savingsGoal.findMany({
    where: { householdId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    monthlyData,
    expensesByCategory,
    potAllocation,
    savingsGoals,
    year,
  });
}
