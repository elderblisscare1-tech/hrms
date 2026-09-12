"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  CalendarCheck,
  CalendarOff,
  Receipt,
  User,
} from "lucide-react";

const tabs = [
  { label: "Home", href: "/employee/me", icon: Home },
  { label: "Attendance", href: "/employee/attendance", icon: CalendarCheck },
  { label: "Leave", href: "/employee/leave", icon: CalendarOff },
  { label: "Payslips", href: "/employee/payslips", icon: Receipt },
  { label: "Profile", href: "/employee/profile", icon: User },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--card)/0.95)] backdrop-blur-lg border-t border-[hsl(var(--border))] safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-2 px-3 rounded-xl transition-all duration-200",
                "active:scale-95",
                isActive
                  ? "text-[hsl(var(--primary))]"
                  : "text-[hsl(var(--muted-foreground))]"
              )}
            >
              <div className={cn(
                "relative p-1.5 rounded-xl transition-all duration-200",
                isActive && "bg-[hsl(var(--primary)/0.1)]"
              )}>
                <Icon className="h-5 w-5" />
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[hsl(var(--primary))]" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
