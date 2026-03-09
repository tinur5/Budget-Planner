"use client";

import { useState, useEffect } from "react";
import { CalendarDays, RefreshCw, CheckCircle, XCircle, Clock, Loader2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  formatCurrency,
  getMonthName,
  getMonthOptions,
  getYearOptions,
  getCurrentMonthYear,
  calculatePercentage,
} from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Allocation {
  potId: string;
  potName: string;
  suggestedAmount: number;
  rationale: string;
  ruleName: string;
  ruleType: string;
}

interface AllocationSummary {
  totalIncome: number;
  totalAllocated: number;
  remainder: number;
  allocations: Allocation[];
}

interface Suggestion {
  id: string;
  sourceDescription: string;
  suggestedAmount: number;
  rationale: string;
  status: string;
  targetPot: { id: string; name: string; color: string } | null;
}

interface MonthlyPlanData {
  plan: {
    totalIncome: number;
    allocatedAmount: number;
    remainderAmount: number;
  };
  totalIncome: number;
  totalExpenses: number;
  allocationSummary: AllocationSummary;
  suggestions: Suggestion[];
}

export default function MonthlyPlanPage() {
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [data, setData] = useState<MonthlyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPlan();
  }, [month, year]);

  async function fetchPlan() {
    setLoading(true);
    const res = await fetch(`/api/monthly-plan?month=${month}&year=${year}`);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }

  async function generateSuggestions() {
    setGenerating(true);
    const res = await fetch("/api/monthly-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year }),
    });
    if (res.ok) {
      toast({
        title: "Verteilungsvorschläge erstellt",
        description: "Der Monatsplan wurde aktualisiert.",
        variant: "success",
      });
      fetchPlan();
    } else {
      toast({
        title: "Fehler",
        description: "Konnte keine Vorschläge generieren.",
        variant: "destructive",
      });
    }
    setGenerating(false);
  }

  async function updateSuggestionStatus(suggestionId: string, status: string) {
    const res = await fetch("/api/monthly-plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestionId, status }),
    });
    if (res.ok) {
      fetchPlan();
      toast({
        title: status === "DONE" ? "Als erledigt markiert" : "Als übersprungen markiert",
        variant: "success",
      });
    }
  }

  const statusConfig = {
    PENDING: { label: "Ausstehend", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    DONE: { label: "Erledigt", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    SKIPPED: { label: "Übersprungen", color: "bg-slate-100 text-slate-600", icon: XCircle },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Monatsplan</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Automatische Verteilung Ihres Einkommens
          </p>
        </div>
        <Button onClick={generateSuggestions} disabled={generating}>
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Vorschläge generieren
        </Button>
      </div>

      {/* Month/Year Filter */}
      <div className="flex items-center gap-3">
        <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getMonthOptions().map((m) => (
              <SelectItem key={m.value} value={String(m.value)}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 border-0 text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-indigo-200" />
                  <p className="text-indigo-200 text-sm">Einnahmen</p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(data?.totalIncome || 0)}
                </p>
                <p className="text-indigo-200 text-xs mt-1">
                  {getMonthName(month)} {year}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-500 to-rose-600 border-0 text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-rose-200" />
                  <p className="text-rose-200 text-sm">Ausgaben</p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(data?.totalExpenses || 0)}
                </p>
                <p className="text-rose-200 text-xs mt-1">
                  {calculatePercentage(
                    data?.totalExpenses || 0,
                    data?.totalIncome || 1
                  )}% vom Einkommen
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-emerald-200" />
                  <p className="text-emerald-200 text-sm">Restbetrag</p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(data?.allocationSummary?.remainder || 0)}
                </p>
                <p className="text-emerald-200 text-xs mt-1">Noch nicht zugeteilt</p>
              </CardContent>
            </Card>
          </div>

          {/* Allocation Plan */}
          {data?.allocationSummary && data.allocationSummary.allocations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Verteilungsplan</CardTitle>
                <p className="text-sm text-slate-500">
                  Von {formatCurrency(data.allocationSummary.totalIncome)} Gesamteinkommen
                  werden {formatCurrency(data.allocationSummary.totalAllocated)} verteilt
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.allocationSummary.allocations.map((alloc, i) => {
                  const pct = calculatePercentage(
                    alloc.suggestedAmount,
                    data.allocationSummary.totalIncome
                  );
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          {alloc.potName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{pct}%</span>
                          <span className="text-sm font-bold text-slate-900">
                            {formatCurrency(alloc.suggestedAmount)}
                          </span>
                        </div>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <p className="text-xs text-slate-500 italic">{alloc.rationale}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Transfer Suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Überweisungsvorschläge</CardTitle>
              <p className="text-sm text-slate-500">
                Klicken Sie auf &quot;Generieren&quot;, um aktuelle Vorschläge zu erhalten
              </p>
            </CardHeader>
            <CardContent>
              {!data?.suggestions || data.suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Noch keine Vorschläge für diesen Monat</p>
                  <Button className="mt-3" onClick={generateSuggestions} disabled={generating}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Vorschläge generieren
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.suggestions.map((suggestion) => {
                    const status = statusConfig[suggestion.status as keyof typeof statusConfig] || statusConfig.PENDING;
                    const StatusIcon = status.icon;
                    return (
                      <div
                        key={suggestion.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {suggestion.targetPot && (
                                <div
                                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: suggestion.targetPot.color }}
                                />
                              )}
                              <span className="text-sm font-semibold text-slate-900">
                                {suggestion.targetPot?.name || "Unbekannt"}
                              </span>
                              <span className="text-base font-bold text-indigo-600">
                                {formatCurrency(suggestion.suggestedAmount)}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${status.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                              {suggestion.rationale}
                            </p>
                          </div>

                          {suggestion.status === "PENDING" && (
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="success"
                                className="h-8 px-3 text-xs"
                                onClick={() => updateSuggestionStatus(suggestion.id, "DONE")}
                              >
                                Erledigt
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-3 text-xs text-slate-500"
                                onClick={() => updateSuggestionStatus(suggestion.id, "SKIPPED")}
                              >
                                Überspringen
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
