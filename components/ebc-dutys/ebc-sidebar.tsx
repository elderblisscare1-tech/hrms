"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  CreditCard, 
  Settings,
  Megaphone
} from "lucide-react";

export function EbcSidebar() {
  const pathname = usePathname();
  
  // Determine if we are in super-admin or admin
  const basePath = pathname.startsWith("/super-admin") ? "/super-admin/ebc-dutys" : "/admin/ebc-dutys";

  const navItems = [
    {
      title: "Dashboard",
      href: basePath,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "All Duties",
      href: `${basePath}/duties`,
      icon: ClipboardList,
    },
    {
      title: "Categories",
      href: `${basePath}/categories`,
      icon: LayoutDashboard,
    },
    {
      title: "Leads",
      href: `${basePath}/leads`,
      icon: Megaphone,
    },
    {
      title: "Users",
      href: `${basePath}/users`,
      icon: Users,
    },
    {
      title: "Payments",
      href: `${basePath}/payments`,
      icon: CreditCard,
    },
    {
      title: "Settings",
      href: `${basePath}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="w-64 border-r bg-card h-[calc(100vh-4rem)] sticky top-16 hidden md:block">
      <div className="p-6">
        <h2 className="text-lg font-bold tracking-tight mb-4">EBC Management</h2>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href);
              
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
