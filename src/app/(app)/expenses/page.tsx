"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Receipt, Loader2, Search } from "lucide-react";
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
import { EXPENSE_CATEGORIES } from "@/types";

interface Expense {
  id: string;
  amount: number;
  date: string;
  category: string;
  description?: string | null;
  note?: string | null;
  pot: { id: string; name: string; color: string } | null;
  user: { id: string; name: string } | null;
}

interface Pot {
  id: string;
  name: string;
  color: string;
}

interface User {
  id: string;
  name: string;
}

export default function ExpensesPage() {
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pots, setPots] = useState<Pot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "",
    description: "",
    note: "",
    potId: "",
    userId: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPots();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [month, year]);

  async function fetchPots() {
    const res = await fetch("/api/pots");
    if (res.ok) setPots(await res.json());
  }

  async function fetchUsers() {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
  }

  async function fetchExpenses() {
    setLoading(true);
    const res = await fetch(`/api/expenses?month=${month}&year=${year}`);
    if (res.ok) setExpenses(await res.json());
    setLoading(false);
  }

  function openCreateDialog() {
    setEditingExpense(null);
    setFormData({
      amount: "",
      date: new Date().toISOString().split("T")[0],
      category: "",
      description: "",
      note: "",
      potId: "",
      userId: users[0]?.id || "",
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(expense: Expense) {
    setEditingExpense(expense);
    setFormData({
      amount: String(expense.amount),
      date: expense.date.split("T")[0],
      category: expense.category,
      description: expense.description || "",
      note: expense.note || "",
      potId: expense.pot?.id || "",
      userId: expense.user?.id || "",
    });
    setIsDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.amount || !formData.date || !formData.category) {
      toast({
        title: "Fehler",
        description: "Betrag, Datum und Kategorie sind erforderlich",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses";
      const method = editingExpense ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          potId: formData.potId || null,
        }),
      });
      if (res.ok) {
        toast({
          title: "Gespeichert",
          description: `Ausgabe wurde ${editingExpense ? "aktualisiert" : "erfasst"}.`,
          variant: "success",
        });
        setIsDialogOpen(false);
        fetchExpenses();
      } else {
        const err = await res.json();
        toast({ title: "Fehler", description: err.error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense: Expense) {
    if (!confirm("Ausgabe wirklich löschen?")) return;
    const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Gelöscht", description: "Ausgabe wurde gelöscht." });
      fetchExpenses();
    }
  }

  const filteredExpenses = expenses.filter((e) => {
    const q = search.toLowerCase();
    return (
      !search ||
      e.description?.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.pot?.name.toLowerCase().includes(q)
    );
  });

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const expenseByCategory = Object.entries(
    expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ausgaben</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Verwalten Sie Ihre Ausgaben
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Ausgabe erfassen
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
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
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 border-0 text-white">
          <CardContent className="p-5">
            <p className="text-rose-200 text-sm mb-1">Gesamtausgaben</p>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            <p className="text-rose-200 text-xs mt-1">
              {getMonthName(month)} {year}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-slate-500 text-sm mb-1">Top Kategorie</p>
            {expenseByCategory[0] ? (
              <>
                <p className="text-xl font-bold text-slate-900">
                  {expenseByCategory[0][0]}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {formatCurrency(expenseByCategory[0][1])}
                </p>
              </>
            ) : (
              <p className="text-slate-400 text-sm">Keine Daten</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            Ausgaben {getMonthName(month)} {year}
            <span className="ml-2 text-sm text-slate-500 font-normal">
              ({filteredExpenses.length} Einträge)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-10">
              <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Keine Ausgaben in diesem Monat</p>
              <Button size="sm" className="mt-3" onClick={openCreateDialog}>
                <Plus className="mr-1 h-3 w-3" />
                Ausgabe erfassen
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expense.pot && (
                      <div
                        className="h-8 w-8 rounded-xl flex-shrink-0"
                        style={{ backgroundColor: expense.pot.color + "20" }}
                      >
                        <div
                          className="h-2 w-2 rounded-full m-auto mt-3"
                          style={{ backgroundColor: expense.pot.color }}
                        />
                      </div>
                    )}
                    {!expense.pot && (
                      <div className="h-8 w-8 rounded-xl bg-slate-200 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {expense.description || expense.category}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">
                          {formatDate(expense.date)}
                        </span>
                        <Badge variant="secondary" className="text-xs py-0">
                          {expense.category}
                        </Badge>
                        {expense.pot && (
                          <Badge
                            className="text-xs py-0"
                            style={{
                              backgroundColor: expense.pot.color + "20",
                              color: expense.pot.color,
                            }}
                          >
                            {expense.pot.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-rose-600">
                      -{formatCurrency(expense.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditDialog(expense)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(expense)}
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

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Ausgabe bearbeiten" : "Ausgabe erfassen"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Betrag (CHF) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Datum *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kategorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Input
                placeholder="Wofür?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Topf</Label>
                <Select
                  value={formData.potId}
                  onValueChange={(v) => setFormData({ ...formData, potId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kein Topf" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Kein Topf</SelectItem>
                    {pots.map((pot) => (
                      <SelectItem key={pot.id} value={pot.id}>
                        {pot.name}
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
