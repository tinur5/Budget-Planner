"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Receipt,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Monatsplan", href: "/monthly-plan", icon: CalendarDays },
  { name: "Einnahmen", href: "/income", icon: TrendingUp },
  { name: "Ausgaben", href: "/expenses", icon: Receipt },
  { name: "Töpfe", href: "/pots", icon: Wallet },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 pb-safe lg:hidden">
      <div className="flex items-center justify-around">
        {mobileNav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium transition-colors min-w-0",
                isActive ? "text-indigo-600" : "text-slate-500"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-indigo-600" : "text-slate-400"
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
