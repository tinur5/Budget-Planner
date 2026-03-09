"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Receipt,
  ListTodo,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Monatsplan", href: "/monthly-plan", icon: CalendarDays },
  { name: "Einnahmen", href: "/income", icon: TrendingUp },
  { name: "Ausgaben", href: "/expenses", icon: Receipt },
  { name: "Konten & Töpfe", href: "/pots", icon: Wallet },
  { name: "Regeln", href: "/rules", icon: ListTodo },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Einstellungen", href: "/settings", icon: Settings },
];

interface SidebarProps {
  userName?: string;
  userRole?: string;
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
          <Coins className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Budget Planner</p>
          <p className="text-xs text-slate-400">Familie</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.name}
                  {isActive && (
                    <ChevronRight className="ml-auto h-3 w-3 opacity-60" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            {userName?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-slate-400">
              {userRole === "ADMIN" ? "Administrator" : "Partner"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Abmelden
        </Button>
      </div>
    </div>
  );
}
