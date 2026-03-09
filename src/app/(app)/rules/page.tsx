"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, ListTodo, Loader2, GripVertical } from "lucide-react";
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
import { formatCurrency } from "@/lib/utils";
import { RULE_TYPE_LABELS, INCOME_TYPE_LABELS, type RuleType } from "@/types";

interface AllocationRule {
  id: string;
  name: string;
  type: string;
  value: number;
  priority: number;
  appliesToUserId?: string | null;
  appliesToIncomeType?: string | null;
  targetPotId: string;
  minAmount?: number | null;
  maxAmount?: number | null;
  thresholdAmount?: number | null;
  isActive: boolean;
  targetPot: { id: string; name: string; color: string };
  appliesTo: { id: string; name: string } | null;
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

const emptyForm = {
  name: "",
  type: "PERCENTAGE",
  value: "",
  priority: "1",
  targetPotId: "",
  appliesToUserId: "",
  appliesToIncomeType: "",
  minAmount: "",
  maxAmount: "",
  thresholdAmount: "",
  isActive: true,
};

export default function RulesPage() {
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [pots, setPots] = useState<Pot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AllocationRule | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [rulesRes, potsRes, settingsRes] = await Promise.all([
      fetch("/api/rules"),
      fetch("/api/pots"),
      fetch("/api/settings"),
    ]);
    if (rulesRes.ok) setRules(await rulesRes.json());
    if (potsRes.ok) setPots(await potsRes.json());
    if (settingsRes.ok) {
      const data = await settingsRes.json();
      setUsers(data.users || []);
    }
    setLoading(false);
  }

  function openCreateDialog() {
    setEditingRule(null);
    setFormData({ ...emptyForm, priority: String(rules.length + 1) });
    setIsDialogOpen(true);
  }

  function openEditDialog(rule: AllocationRule) {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      value: String(rule.value),
      priority: String(rule.priority),
      targetPotId: rule.targetPotId,
      appliesToUserId: rule.appliesToUserId || "",
      appliesToIncomeType: rule.appliesToIncomeType || "",
      minAmount: rule.minAmount ? String(rule.minAmount) : "",
      maxAmount: rule.maxAmount ? String(rule.maxAmount) : "",
      thresholdAmount: rule.thresholdAmount ? String(rule.thresholdAmount) : "",
      isActive: rule.isActive,
    });
    setIsDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.name || !formData.type || !formData.value || !formData.targetPotId) {
      toast({
        title: "Fehler",
        description: "Name, Typ, Wert und Ziel-Topf sind erforderlich",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const url = editingRule ? `/api/rules/${editingRule.id}` : "/api/rules";
      const method = editingRule ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          appliesToUserId: formData.appliesToUserId || null,
          appliesToIncomeType: formData.appliesToIncomeType || null,
        }),
      });
      if (res.ok) {
        toast({
          title: "Gespeichert",
          description: `Regel "${formData.name}" wurde ${editingRule ? "aktualisiert" : "angelegt"}.`,
          variant: "success",
        });
        setIsDialogOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast({ title: "Fehler", description: err.error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rule: AllocationRule) {
    if (!confirm(`Regel "${rule.name}" wirklich löschen?`)) return;
    const res = await fetch(`/api/rules/${rule.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Gelöscht", description: "Regel wurde gelöscht." });
      fetchData();
    }
  }

  async function toggleActive(rule: AllocationRule) {
    const res = await fetch(`/api/rules/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rule, isActive: !rule.isActive }),
    });
    if (res.ok) fetchData();
  }

  function getRuleValueDisplay(rule: AllocationRule): string {
    if (rule.type === "PERCENTAGE" || rule.type === "THRESHOLD") {
      return `${rule.value}%`;
    }
    if (rule.type === "FIXED") {
      return formatCurrency(rule.value);
    }
    return "Restbetrag";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Verteilungsregeln</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Definieren Sie automatische Verteilungsregeln für Ihr Einkommen
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Regel
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-indigo-50 border-indigo-200">
        <CardContent className="p-4">
          <p className="text-indigo-800 text-sm">
            <strong>So funktioniert es:</strong> Regeln werden in der Reihenfolge ihrer Priorität
            (niedrigste Zahl zuerst) auf Ihr Einkommen angewendet. Die &quot;Restbetrag&quot;-Regel
            erhält alles, was nach den anderen Regeln übrig bleibt.
          </p>
        </CardContent>
      </Card>

      {/* Rules List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <ListTodo className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Noch keine Regeln definiert</p>
            <p className="text-slate-400 text-sm mt-1">
              Legen Sie Ihre erste Verteilungsregel an
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Erste Regel anlegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card
              key={rule.id}
              className={`transition-all ${!rule.isActive ? "opacity-50" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 text-slate-400 cursor-grab">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                    {rule.priority}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {rule.name}
                      </span>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                      <Badge variant="outline">
                        {RULE_TYPE_LABELS[rule.type as RuleType] || rule.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                      <span className="font-medium text-slate-700">
                        {getRuleValueDisplay(rule)}
                      </span>
                      <span>→</span>
                      <div className="flex items-center gap-1">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: rule.targetPot.color }}
                        />
                        <span>{rule.targetPot.name}</span>
                      </div>
                      {rule.appliesTo && (
                        <>
                          <span>·</span>
                          <span>nur für {rule.appliesTo.name}</span>
                        </>
                      )}
                      {rule.appliesToIncomeType && (
                        <>
                          <span>·</span>
                          <span>
                            {INCOME_TYPE_LABELS[rule.appliesToIncomeType as keyof typeof INCOME_TYPE_LABELS]}
                          </span>
                        </>
                      )}
                      {rule.thresholdAmount && (
                        <>
                          <span>·</span>
                          <span>ab {formatCurrency(rule.thresholdAmount)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(rule)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        rule.isActive ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          rule.isActive ? "translate-x-4" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditDialog(rule)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(rule)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Regel bearbeiten" : "Neue Regel"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="z.B. 20% Business"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Regeltyp *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RULE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {formData.type === "PERCENTAGE" || formData.type === "THRESHOLD"
                    ? "Prozent (%)"
                    : formData.type === "FIXED"
                    ? "Betrag (CHF)"
                    : "Wert"}{" "}
                  *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={
                    formData.type === "REMAINDER" ? "0 (Restbetrag)" : "0"
                  }
                  disabled={formData.type === "REMAINDER"}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priorität</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ziel-Topf *</Label>
                <Select
                  value={formData.targetPotId}
                  onValueChange={(v) => setFormData({ ...formData, targetPotId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Topf wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {pots.map((pot) => (
                      <SelectItem key={pot.id} value={pot.id}>
                        {pot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gilt für Person</Label>
                <Select
                  value={formData.appliesToUserId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, appliesToUserId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Einkommenstyp</Label>
                <Select
                  value={formData.appliesToIncomeType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, appliesToIncomeType: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle</SelectItem>
                    {Object.entries(INCOME_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === "THRESHOLD" && (
              <div className="space-y-2">
                <Label>Schwellenwert (CHF) - nur ab diesem Einkommen</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="z.B. 3000"
                  value={formData.thresholdAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, thresholdAmount: e.target.value })
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mindestbetrag (CHF)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                  value={formData.minAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, minAmount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Maximalbetrag (CHF)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                  value={formData.maxAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, maxAmount: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="isActive">Regel ist aktiv</Label>
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
