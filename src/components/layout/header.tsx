"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Coins } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/monthly-plan": "Monatsplan",
  "/income": "Einnahmen",
  "/expenses": "Ausgaben",
  "/pots": "Konten & Töpfe",
  "/rules": "Verteilungsregeln",
  "/reports": "Reports & Statistiken",
  "/settings": "Einstellungen",
};

interface HeaderProps {
  userName?: string;
  userRole?: string;
}

export function Header({ userName, userRole }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] || "Budget Planner";

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between bg-white border-b border-slate-200 px-4">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <Coins className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900">{title}</span>
        </div>
        <div className="w-9" />
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex h-full w-64 flex-col">
            <Sidebar userName={userName} userRole={userRole} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Page Title */}
      <header className="hidden lg:flex h-16 items-center px-8 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </header>
    </>
  );
}
