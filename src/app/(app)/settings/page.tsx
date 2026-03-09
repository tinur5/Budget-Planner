"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Users, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  hidePersonalBudgets: boolean;
  createdAt: string;
}

interface Household {
  id: string;
  name: string;
  currency: string;
}

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    hidePersonalBudgets: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
      setHousehold(data.household || null);
      const currentUser = data.users?.[0];
      if (currentUser) {
        setProfileForm((prev) => ({
          ...prev,
          name: currentUser.name,
          hidePersonalBudgets: currentUser.hidePersonalBudgets,
        }));
      }
    }
    setLoading(false);
  }

  async function handleSaveProfile() {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      toast({
        title: "Fehler",
        description: "Passwörter stimmen nicht überein",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name,
          hidePersonalBudgets: profileForm.hidePersonalBudgets,
          currentPassword: profileForm.currentPassword || undefined,
          newPassword: profileForm.newPassword || undefined,
        }),
      });

      if (res.ok) {
        toast({
          title: "Gespeichert",
          description: "Ihre Einstellungen wurden aktualisiert.",
          variant: "success",
        });
        setProfileForm((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        fetchSettings();
      } else {
        const err = await res.json();
        toast({ title: "Fehler", description: err.error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Einstellungen</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Profil und Haushalt verwalten
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* Household Info */}
          {household && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-slate-500" />
                  <CardTitle>Haushalt</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{household.name}</p>
                    <p className="text-xs text-slate-500">Haushalt</p>
                  </div>
                  <Badge variant="secondary">{household.currency}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                <CardTitle>Haushaltsmitglieder</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                    {user.role === "ADMIN" ? "Admin" : "Partner"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Mein Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <input
                  type="checkbox"
                  id="hidePersonal"
                  checked={profileForm.hidePersonalBudgets}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      hidePersonalBudgets: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <div>
                  <Label htmlFor="hidePersonal" className="cursor-pointer">
                    Persönliche Budgets ausblenden
                  </Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Persönliche Töpfe sind nur für Sie sichtbar
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Passwort ändern
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Aktuelles Passwort</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={profileForm.currentPassword}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Neues Passwort</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={profileForm.newPassword}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            newPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bestätigen</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={profileForm.confirmPassword}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Einstellungen speichern
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Familie Budget Planner</span>
                <span>Version 1.0.0</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
