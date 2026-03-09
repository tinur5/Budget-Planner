"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Wallet, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  calculatePercentage,
  getProgressColor,
} from "@/lib/utils";
import { POT_TYPE_LABELS, POT_COLORS, type PotType } from "@/types";

interface Pot {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
  description?: string | null;
  isShared: boolean;
  targetAmount?: number | null;
  currentBalance: number;
}

export default function PotsPage() {
  const [pots, setPots] = useState<Pot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPot, setEditingPot] = useState<Pot | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "GENERAL",
    color: "#6366f1",
    description: "",
    targetAmount: "",
    isShared: true,
    currentBalance: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPots();
  }, []);

  async function fetchPots() {
    setLoading(true);
    const res = await fetch("/api/pots");
    if (res.ok) {
      const data = await res.json();
      setPots(data);
    }
    setLoading(false);
  }

  function openCreateDialog() {
    setEditingPot(null);
    setFormData({
      name: "",
      type: "GENERAL",
      color: "#6366f1",
      description: "",
      targetAmount: "",
      isShared: true,
      currentBalance: "",
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(pot: Pot) {
    setEditingPot(pot);
    setFormData({
      name: pot.name,
      type: pot.type,
      color: pot.color,
      description: pot.description || "",
      targetAmount: pot.targetAmount ? String(pot.targetAmount) : "",
      isShared: pot.isShared,
      currentBalance: String(pot.currentBalance),
    });
    setIsDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.name || !formData.type) {
      toast({ title: "Fehler", description: "Name und Typ sind erforderlich", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const url = editingPot ? `/api/pots/${editingPot.id}` : "/api/pots";
      const method = editingPot ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast({
          title: "Gespeichert",
          description: `Topf "${formData.name}" wurde ${editingPot ? "aktualisiert" : "angelegt"}.`,
          variant: "success",
        });
        setIsDialogOpen(false);
        fetchPots();
      } else {
        const err = await res.json();
        toast({ title: "Fehler", description: err.error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(pot: Pot) {
    if (!confirm(`Topf "${pot.name}" wirklich löschen?`)) return;
    const res = await fetch(`/api/pots/${pot.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Gelöscht", description: `Topf "${pot.name}" wurde gelöscht.`, variant: "default" });
      fetchPots();
    }
  }

  const totalBalance = pots.reduce((s, p) => s + p.currentBalance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Konten & Töpfe</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Verwalten Sie Ihre Budget-Töpfe und Konten
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Topf
        </Button>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-gradient-to-r from-indigo-600 to-violet-600 border-0 text-white">
        <CardContent className="p-6">
          <p className="text-indigo-200 text-sm mb-1">Gesamtguthaben</p>
          <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
          <p className="text-indigo-200 text-sm mt-1">{pots.length} Töpfe</p>
        </CardContent>
      </Card>

      {/* Pots Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : pots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <Wallet className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Noch keine Töpfe angelegt</p>
            <p className="text-slate-400 text-sm mt-1">
              Legen Sie Ihren ersten Budget-Topf an
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Topf anlegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pots.map((pot) => {
            const pct = pot.targetAmount
              ? calculatePercentage(pot.currentBalance, pot.targetAmount)
              : null;
            return (
              <Card key={pot.id} className="relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: pot.color }}
                />
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: pot.color }}
                      >
                        {pot.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{pot.name}</CardTitle>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {POT_TYPE_LABELS[pot.type as PotType] || pot.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(pot)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(pot)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(pot.currentBalance)}
                      </p>
                      {pot.targetAmount && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Ziel: {formatCurrency(pot.targetAmount)}
                        </p>
                      )}
                    </div>

                    {pct !== null && (
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Fortschritt</span>
                          <span>{pct}%</span>
                        </div>
                        <Progress
                          value={Math.min(pct, 100)}
                          className="h-2"
                          indicatorClassName={`bg-[${pot.color}]`}
                          style={
                            {
                              "--tw-bg-opacity": "1",
                              backgroundColor: pot.color,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Badge variant={pot.isShared ? "default" : "secondary"}>
                        {pot.isShared ? "Gemeinsam" : "Persönlich"}
                      </Badge>
                    </div>

                    {pot.description && (
                      <p className="text-xs text-slate-500 truncate">{pot.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPot ? "Topf bearbeiten" : "Neuer Topf"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="z.B. Sparkonto"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Typ *</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Farbe</Label>
              <div className="flex flex-wrap gap-2">
                {POT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-7 w-7 rounded-full transition-all ${
                      formData.color === color
                        ? "ring-2 ring-offset-2 ring-slate-900 scale-110"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aktueller Saldo (CHF)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.currentBalance}
                  onChange={(e) =>
                    setFormData({ ...formData, currentBalance: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Sparziel (CHF)</Label>
                <Input
                  type="number"
                  placeholder="Optional"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Input
                placeholder="Optional"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isShared"
                checked={formData.isShared}
                onChange={(e) =>
                  setFormData({ ...formData, isShared: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="isShared">Gemeinsamer Topf (für beide Partner sichtbar)</Label>
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
