"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowRight,
  Plus,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatDate,
  getMonthName,
  calculatePercentage,
  getProgressColor,
} from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

interface DashboardData {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  remainingBudget: number;
  incomes: Array<{
    id: string;
    source: string;
    amount: number;
    date: string;
    type: string;
    user: { id: string; name: string };
  }>;
  expenses: Array<{
    id: string;
    amount: number;
    date: string;
    category: string;
    description?: string;
    pot: { id: string; name: string; color: string } | null;
    user: { id: string; name: string };
  }>;
  pots: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    currentBalance: number;
    targetAmount: number | null;
    monthlyExpenses: number;
    budget: { plannedAmount: number; actualAmount: number } | null;
  }>;
  savingsGoals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    color: string;
    dueDate?: string | null;
  }>;
  household: { name: string; currency: string } | null;
  userName: string;
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const {
    month, year, totalIncome, totalExpenses, remainingBudget,
    incomes, expenses, pots, savingsGoals, household, userName,
  } = data;

  const savingsRate = calculatePercentage(remainingBudget, totalIncome);
  const expenseRate = calculatePercentage(totalExpenses, totalIncome);

  // Pie chart data from pots
  const pieData = pots
    .filter((p) => p.monthlyExpenses > 0)
    .map((p) => ({ name: p.name, value: p.monthlyExpenses, color: p.color }));

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Guten Morgen";
    if (h < 18) return "Guten Tag";
    return "Guten Abend";
  })();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {greeting}, {userName.split(" ")[0]}! 👋
        </h2>
        <p className="text-slate-500 mt-1">
          {getMonthName(month)} {year} · {household?.name || "Familie"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 border-0 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-indigo-200 text-sm font-medium">Einnahmen</p>
              <div className="rounded-lg bg-white/20 p-1.5">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
            <p className="text-indigo-200 text-xs mt-1">{getMonthName(month)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 border-0 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-rose-200 text-sm font-medium">Ausgaben</p>
              <div className="rounded-lg bg-white/20 p-1.5">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            <p className="text-rose-200 text-xs mt-1">{expenseRate}% vom Einkommen</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-emerald-200 text-sm font-medium">Verbleibend</p>
              <div className="rounded-lg bg-white/20 p-1.5">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(remainingBudget)}</p>
            <p className="text-emerald-200 text-xs mt-1">{savingsRate}% gespart</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500 to-violet-600 border-0 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-violet-200 text-sm font-medium">Töpfe aktiv</p>
              <div className="rounded-lg bg-white/20 p-1.5">
                <PiggyBank className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold">{pots.length}</p>
            <p className="text-violet-200 text-xs mt-1">Budget-Töpfe</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Budget Pots */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Konten & Töpfe</CardTitle>
              <Link href="/pots">
                <Button variant="ghost" size="sm" className="text-indigo-600">
                  Alle <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {pots.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Noch keine Töpfe angelegt</p>
                  <Link href="/pots">
                    <Button size="sm" className="mt-3">
                      <Plus className="mr-1 h-3 w-3" />
                      Topf anlegen
                    </Button>
                  </Link>
                </div>
              ) : (
                pots.slice(0, 5).map((pot) => {
                  const spent = pot.monthlyExpenses;
                  const budget = pot.budget?.plannedAmount;
                  const pct = budget ? calculatePercentage(spent, budget) : 0;
                  return (
                    <div key={pot.id} className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: pot.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700 truncate">
                            {pot.name}
                          </span>
                          <span className="text-sm text-slate-600 ml-2 flex-shrink-0">
                            {formatCurrency(spent)}
                            {budget && (
                              <span className="text-slate-400">
                                {" / "}{formatCurrency(budget)}
                              </span>
                            )}
                          </span>
                        </div>
                        {budget && (
                          <Progress
                            value={Math.min(pct, 100)}
                            className="h-1.5"
                            indicatorClassName={getProgressColor(pct)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Letzte Ausgaben</CardTitle>
              <Link href="/expenses">
                <Button variant="ghost" size="sm" className="text-indigo-600">
                  Alle <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">Noch keine Ausgaben erfasst</p>
                  <Link href="/expenses">
                    <Button size="sm" className="mt-3">
                      <Plus className="mr-1 h-3 w-3" />
                      Ausgabe erfassen
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.slice(0, 6).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expense.pot && (
                          <div
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: expense.pot.color }}
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {expense.description || expense.category}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDate(expense.date)} · {expense.user.name}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        -{formatCurrency(expense.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Pie Chart */}
          {pieData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Ausgaben nach Topf</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {pieData.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-600 truncate max-w-[100px]">{item.name}</span>
                      </div>
                      <span className="text-slate-700 font-medium">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Savings Goals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Sparziele</CardTitle>
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="text-indigo-600">
                  <Plus className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {savingsGoals.length === 0 ? (
                <div className="text-center py-4">
                  <Target className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-xs">Noch keine Sparziele</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savingsGoals.map((goal) => {
                    const pct = calculatePercentage(goal.currentAmount, goal.targetAmount);
                    return (
                      <div key={goal.id}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-700">{goal.name}</span>
                          <span className="text-xs text-slate-500">{pct}%</span>
                        </div>
                        <Progress
                          value={pct}
                          className="h-2"
                          indicatorClassName="bg-emerald-500"
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-slate-500">
                            {formatCurrency(goal.currentAmount)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatCurrency(goal.targetAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Schnellzugriff</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Link href="/income">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <Plus className="mr-1 h-3 w-3" />
                  Einnahme
                </Button>
              </Link>
              <Link href="/expenses">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <Plus className="mr-1 h-3 w-3" />
                  Ausgabe
                </Button>
              </Link>
              <Link href="/monthly-plan">
                <Button variant="outline" size="sm" className="w-full text-xs col-span-2">
                  Monatsplan anzeigen
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
