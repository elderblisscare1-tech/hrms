"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Calendar, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold">Analytics & Reports</h1><p className="text-sm text-[hsl(var(--muted-foreground))]">Workforce insights and trends</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Headcount", value: "248", change: "+5.1%", up: true, icon: Users },
          { label: "Attrition Rate", value: "3.2%", change: "-0.8%", up: false, icon: TrendingUp },
          { label: "Avg Attendance", value: "94.5%", change: "+1.2%", up: true, icon: Calendar },
          { label: "Payroll Cost", value: "₹42.8L", change: "+5.2%", up: true, icon: Wallet },
        ].map((s) => { const Icon = s.icon; return (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--primary)/0.1)]"><Icon className="h-4 w-4 text-[hsl(var(--primary))]" /></div>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${s.up ? "text-[hsl(var(--success))]" : "text-[hsl(var(--destructive))]"}`}>
                  {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{s.change}
                </span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{s.label}</p>
            </CardContent>
          </Card>
        ); })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Department-wise Headcount</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Engineering", count: 82, pct: 33 },
                { name: "Sales", count: 45, pct: 18 },
                { name: "Marketing", count: 32, pct: 13 },
                { name: "HR", count: 28, pct: 11 },
                { name: "Finance", count: 24, pct: 10 },
                { name: "Design", count: 18, pct: 7 },
                { name: "Operations", count: 19, pct: 8 },
              ].map((d) => (
                <div key={d.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm"><span>{d.name}</span><span className="text-[hsl(var(--muted-foreground))]">{d.count} ({d.pct}%)</span></div>
                  <div className="h-2 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                    <div className="h-full bg-[hsl(var(--primary))] rounded-full transition-all duration-700" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Monthly Attendance Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-48">
              {[88, 92, 95, 91, 94, 96, 93, 95, 94, 96, 95, 94].map((pct, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-[hsl(var(--primary)/0.7)] rounded-t-md transition-all duration-500 hover:bg-[hsl(var(--primary))]"
                    style={{ height: `${(pct / 100) * 180}px` }} />
                  <span className="text-[9px] text-[hsl(var(--muted-foreground))]">
                    {["J","F","M","A","M","J","J","A","S","O","N","D"][i]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
