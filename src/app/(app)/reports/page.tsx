"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getYearOptions, getMonthName, formatCurrency, calculatePercentage } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

interface ReportsData {
  monthlyData: Array<{
    month: number;
    income: number;
    expenses: number;
    savings: number;
  }>;
  expensesByCategory: Array<{ name: string; value: number }>;
  potAllocation: Array<{
    id: string;
    name: string;
    color: string;
    totalExpenses: number;
    currentBalance: number;
    targetAmount: number | null;
  }>;
  savingsGoals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    color: string;
    dueDate?: string | null;
  }>;
  year: number;
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
];

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [year]);

  async function fetchReports() {
    setLoading(true);
    const res = await fetch(`/api/reports?year=${year}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  const monthlyChartData = data?.monthlyData.map((m) => ({
    name: getMonthName(m.month).slice(0, 3),
    Einnahmen: m.income,
    Ausgaben: m.expenses,
    Gespart: Math.max(0, m.savings),
  })) || [];

  const savingsLineData = data?.monthlyData.reduce(
    (acc: Array<{ name: string; Sparguthaben: number }>, m, i) => {
      const prev = acc[i - 1]?.Sparguthaben || 0;
      acc.push({
        name: getMonthName(m.month).slice(0, 3),
        Sparguthaben: prev + Math.max(0, m.savings),
      });
      return acc;
    },
    []
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports & Statistiken</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Jahresübersicht und Finanzanalysen
          </p>
        </div>
        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getYearOptions().map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* Annual Summary */}
          {data && (() => {
            const totalIncome = data.monthlyData.reduce((s, m) => s + m.income, 0);
            const totalExpenses = data.monthlyData.reduce((s, m) => s + m.expenses, 0);
            const totalSavings = Math.max(0, totalIncome - totalExpenses);
            return (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 border-0 text-white">
                  <CardContent className="p-5">
                    <p className="text-indigo-200 text-sm mb-1">Jahreseinnahmen</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-rose-500 to-rose-600 border-0 text-white">
                  <CardContent className="p-5">
                    <p className="text-rose-200 text-sm mb-1">Jahresausgaben</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white">
                  <CardContent className="p-5">
                    <p className="text-emerald-200 text-sm mb-1">Gespart</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalSavings)}</p>
                    <p className="text-emerald-200 text-xs mt-1">
                      {calculatePercentage(totalSavings, totalIncome)}% Sparrate
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {/* Monthly Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Monatlicher Überblick {year}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                    />
                    <Legend />
                    <Bar dataKey="Einnahmen" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Ausgaben" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Gespart" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Expenses by Category Pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Ausgaben nach Kategorie</CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.expensesByCategory || data.expensesByCategory.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                    Keine Ausgaben vorhanden
                  </div>
                ) : (
                  <>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.expensesByCategory.slice(0, 8)}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${(name || "").slice(0, 8)} ${((percent || 0) * 100).toFixed(0)}%`
                            }
                            labelLine={false}
                          >
                            {data.expensesByCategory.slice(0, 8).map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v) => formatCurrency(v as number)}
                            contentStyle={{ borderRadius: "12px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 space-y-1">
                      {data.expensesByCategory.slice(0, 5).map((cat, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span className="text-slate-600">{cat.name}</span>
                          </div>
                          <span className="text-slate-700 font-medium">
                            {formatCurrency(cat.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Savings Line Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Kumuliertes Sparguthaben</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={savingsLineData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(v) => formatCurrency(v as number)}
                        contentStyle={{ borderRadius: "12px" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Sparguthaben"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pot Overview */}
          {data?.potAllocation && data.potAllocation.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Topf-Übersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.potAllocation.map((pot) => {
                  const pct = pot.targetAmount
                    ? calculatePercentage(pot.currentBalance, pot.targetAmount)
                    : null;
                  return (
                    <div key={pot.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: pot.color }}
                          />
                          <span className="text-sm font-medium text-slate-700">
                            {pot.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900">
                            {formatCurrency(pot.currentBalance)}
                          </span>
                          {pot.targetAmount && (
                            <span className="text-xs text-slate-500 ml-1">
                              / {formatCurrency(pot.targetAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                      {pct !== null && (
                        <Progress
                          value={Math.min(pct, 100)}
                          className="h-2"
                          indicatorClassName="bg-emerald-500"
                        />
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Ausgaben {year}: {formatCurrency(pot.totalExpenses)}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Savings Goals */}
          {data?.savingsGoals && data.savingsGoals.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Sparziele</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.savingsGoals.map((goal) => {
                  const pct = calculatePercentage(goal.currentAmount, goal.targetAmount);
                  return (
                    <div key={goal.id}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700">{goal.name}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold">{formatCurrency(goal.currentAmount)}</span>
                          <span className="text-xs text-slate-500 ml-1">
                            / {formatCurrency(goal.targetAmount)}
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={pct}
                        className="h-2.5"
                        indicatorClassName="bg-emerald-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">{pct}% erreicht</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
