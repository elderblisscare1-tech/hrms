"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Award,
  CalendarCheck,
  CalendarOff,
  Clock,
  Wallet,
  Target,
  GraduationCap,
  Package,
  TicketCheck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Store,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Employees", href: "/admin/employees", icon: Users },
  { label: "Departments", href: "/admin/departments", icon: Building2 },
  { label: "Designations", href: "/admin/designations", icon: Award },
  { label: "Vendors", href: "/admin/vendors", icon: Store },
  { label: "Leads", href: "/admin/leads", icon: Target },
  { label: "Attendance", href: "/admin/attendance", icon: CalendarCheck },
  { label: "Daily Attendance", href: "/admin/attendance/daily", icon: Clock },
  { label: "Leave", href: "/admin/leave", icon: CalendarOff },
  { label: "Payroll", href: "/admin/payroll", icon: Wallet },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Helpdesk", href: "/admin/helpdesk", icon: TicketCheck },
  { label: "Roles", href: "/admin/roles", icon: Shield },
  { label: "EBC Dutys", href: "/admin/ebc-dutys", icon: ClipboardList },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, claims } = useAuth();

  const isSuper = claims?.role === "super_admin" || claims?.role === "hr_admin" || claims?.role === "admin";
  const companyId = claims?.companyId || "demo_company";
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    async function fetchCompany() {
      if (!companyId) return;
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase/client");
        const docRef = doc(db, "companies", companyId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setCompanySettings(snapshot.data());
        }
      } catch (err) {
        console.error("Error fetching company in sidebar", err);
      }
    }
    fetchCompany();
  }, [companyId]);

  const handleLogout = async () => {
    try {
      await signOut();
      if (claims?.role === "super_admin") {
        router.push("/super-admin-login");
      } else {
        router.push("/admin-login");
      }
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const filteredNavItems = navItems.filter(item => {
    if (isSuper) return true;
    const sectionId = item.label.toLowerCase();
    return hasPermission(sectionId);
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out",
        "bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] border-r border-[hsl(var(--sidebar-border))]",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Logo area */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-[hsl(var(--sidebar-border))]",
        collapsed ? "justify-center" : "gap-3"
      )}>
        {companySettings?.logoUrl ? (
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-white flex items-center justify-center shrink-0">
            <img src={companySettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">BV</span>
          </div>
        )}
        {!collapsed && (
          <div className="animate-fade-in flex-1 truncate">
            <h1 className="font-bold text-base text-white truncate">{companySettings?.name || "BlueVe"}</h1>
            <p className="text-[10px] text-[hsl(var(--sidebar-foreground)/0.5)] uppercase tracking-widest truncate">HRMS</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-primary))]",
                isActive
                  ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))] shadow-sm"
                  : "text-[hsl(var(--sidebar-foreground)/0.7)]",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-[hsl(var(--sidebar-primary))]")} />
              {!collapsed && <span className="animate-fade-in truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[hsl(var(--sidebar-border))] space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 justify-start",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed && <span>Logout</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full text-[hsl(var(--sidebar-foreground)/0.5)] hover:text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]",
            collapsed && "px-2"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4 mr-2" /> <span>Collapse</span></>}
        </Button>
      </div>
    </aside>
  );
}
