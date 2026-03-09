"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  formatCurrency,
  formatDate,
  getMonthName,
  getMonthOptions,
  getYearOptions,
  getCurrentMonthYear,
} from "@/lib/utils";
import { INCOME_TYPE_LABELS } from "@/types";

interface Income {
  id: string;
  source: string;
  amount: number;
  date: string;
  type: string;
  note?: string | null;
  user: { id: string; name: string };
}

interface User {
  id: string;
  name: string;
}

export default function IncomePage() {
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [formData, setFormData] = useState({
    source: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    type: "SALARY",
    note: "",
    userId: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchIncomes();
  }, [month, year]);

  async function fetchUsers() {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
  }

  async function fetchIncomes() {
    setLoading(true);
    const res = await fetch(`/api/income?month=${month}&year=${year}`);
    if (res.ok) {
      const data = await res.json();
      setIncomes(data);
    }
    setLoading(false);
  }

  function openCreateDialog() {
    setEditingIncome(null);
    setFormData({
      source: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      type: "SALARY",
      note: "",
      userId: users[0]?.id || "",
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(income: Income) {
    setEditingIncome(income);
    setFormData({
      source: income.source,
      amount: String(income.amount),
      date: income.date.split("T")[0],
      type: income.type,
      note: income.note || "",
      userId: income.user.id,
    });
    setIsDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.source || !formData.amount || !formData.date) {
      toast({
        title: "Fehler",
        description: "Quelle, Betrag und Datum sind erforderlich",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const url = editingIncome ? `/api/income/${editingIncome.id}` : "/api/income";
      const method = editingIncome ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast({
          title: "Gespeichert",
          description: `Einnahme wurde ${editingIncome ? "aktualisiert" : "erfasst"}.`,
          variant: "success",
        });
        setIsDialogOpen(false);
        fetchIncomes();
      } else {
        const err = await res.json();
        toast({ title: "Fehler", description: err.error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(income: Income) {
    if (!confirm("Einnahme wirklich löschen?")) return;
    const res = await fetch(`/api/income/${income.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Gelöscht", description: "Einnahme wurde gelöscht.", variant: "default" });
      fetchIncomes();
    }
  }

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);

  const incomeByType = Object.entries(INCOME_TYPE_LABELS).map(([type, label]) => ({
    type,
    label,
    total: incomes
      .filter((i) => i.type === type)
      .reduce((s, i) => s + i.amount, 0),
  })).filter((x) => x.total > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Einnahmen</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Erfassen Sie Ihre monatlichen Einnahmen
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Einnahme erfassen
        </Button>
      </div>

      {/* Month/Year Filter */}
      <div className="flex items-center gap-3">
        <Select
          value={String(month)}
          onValueChange={(v) => setMonth(parseInt(v))}
        >
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
        <Select
          value={String(year)}
          onValueChange={(v) => setYear(parseInt(v))}
        >
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

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-700 border-0 text-white">
          <CardContent className="p-5">
            <p className="text-indigo-200 text-sm mb-1">Gesamteinnahmen</p>
            <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
            <p className="text-indigo-200 text-xs mt-1">
              {getMonthName(month)} {year}
            </p>
          </CardContent>
        </Card>
        {incomeByType.map((t) => (
          <Card key={t.type}>
            <CardContent className="p-5">
              <p className="text-slate-500 text-sm mb-1">{t.label}</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(t.total)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Incomes List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Einnahmen {getMonthName(month)} {year}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : incomes.length === 0 ? (
            <div className="text-center py-10">
              <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Keine Einnahmen in diesem Monat</p>
              <Button size="sm" className="mt-3" onClick={openCreateDialog}>
                <Plus className="mr-1 h-3 w-3" />
                Einnahme erfassen
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {incomes.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
                      <TrendingUp className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {income.source}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">
                          {formatDate(income.date)}
                        </span>
                        <Badge variant="secondary" className="text-xs py-0">
                          {INCOME_TYPE_LABELS[income.type as keyof typeof INCOME_TYPE_LABELS] || income.type}
                        </Badge>
                        <span className="text-xs text-slate-500">{income.user.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-emerald-600">
                      +{formatCurrency(income.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditDialog(income)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(income)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingIncome ? "Einnahme bearbeiten" : "Einnahme erfassen"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quelle / Beschreibung *</Label>
              <Input
                placeholder="z.B. Lohn März"
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Betrag (CHF) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Datum *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Typ</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INCOME_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {users.length > 0 && (
                <div className="space-y-2">
                  <Label>Person</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(v) => setFormData({ ...formData, userId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notiz</Label>
              <Input
                placeholder="Optional"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
