import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthYear } from "@/lib/utils";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.householdId) return null;

  const { month, year } = getCurrentMonthYear();
  const householdId = session.user.householdId;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [incomes, expenses, pots, savingsGoals, household] = await Promise.all([
    prisma.income.findMany({
      where: { householdId, month, year },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.expense.findMany({
      where: { householdId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: "desc" },
      take: 10,
      include: {
        pot: { select: { id: true, name: true, color: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.pot.findMany({
      where: { householdId },
      include: {
        expenses: {
          where: { date: { gte: startDate, lte: endDate } },
          select: { amount: true },
        },
        budgets: {
          where: { month, year },
        },
      },
    }),
    prisma.savingsGoal.findMany({
      where: { householdId, isCompleted: false },
      take: 3,
    }),
    prisma.household.findUnique({ where: { id: householdId } }),
  ]);

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const remainingBudget = totalIncome - totalExpenses;

  // Serialize dates for client component
  const dashboardData = {
    month,
    year,
    totalIncome,
    totalExpenses,
    remainingBudget,
    incomes: incomes.map((i) => ({
      id: i.id,
      source: i.source,
      amount: i.amount,
      date: i.date.toISOString(),
      type: i.type,
      user: i.user,
    })),
    expenses: expenses.map((e) => ({
      id: e.id,
      amount: e.amount,
      date: e.date.toISOString(),
      category: e.category,
      description: e.description ?? undefined,
      pot: e.pot,
      user: e.user,
    })),
    pots: pots.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      icon: p.icon,
      currentBalance: p.currentBalance,
      targetAmount: p.targetAmount,
      monthlyExpenses: p.expenses.reduce((s, e) => s + e.amount, 0),
      budget: p.budgets[0]
        ? {
            plannedAmount: p.budgets[0].plannedAmount,
            actualAmount: p.budgets[0].actualAmount,
          }
        : null,
    })),
    savingsGoals: savingsGoals.map((g) => ({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      color: g.color,
      dueDate: g.dueDate?.toISOString() || null,
    })),
    household: household ? { name: household.name, currency: household.currency } : null,
    userName: session.user.name,
  };

  return <DashboardClient data={dashboardData} />;
}
