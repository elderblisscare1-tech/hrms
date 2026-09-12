"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments } from "@/lib/firebase/firestore";
import type { Employee } from "@/lib/schemas/employee";
import type { Department } from "@/lib/schemas/department";
import type { LeaveRequest } from "@/lib/schemas/leave";
import type { AttendanceRecord } from "@/lib/schemas/attendance";
import { useCollection } from "@/lib/hooks/use-firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  UserPlus,
  CalendarCheck,
  CalendarOff,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  BriefcaseBusiness,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const companyId = useCompanyId();
  
  // Use SWR for global data caching
  const { data: employees, loading: empLoading } = useCollection<Employee>(companyId, "employees");
  const { data: departments, loading: deptLoading } = useCollection<Department>(companyId, "departments");
  const { data: leaveRequests, loading: leaveLoading } = useCollection<LeaveRequest>(companyId, "leaveRequests");
  
  const [attendance, setAttendance] = useState<(AttendanceRecord & { id: string })[]>([]);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const todayStr = `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}-${pad(new Date().getDate())}`;
  
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [attLoading, setAttLoading] = useState(true);

  const loading = empLoading || deptLoading || leaveLoading || attLoading;

  useEffect(() => {
    async function fetchAttendance() {
      if (!companyId) return;
      setAttLoading(true);
      try {
        const dates = [];
        let curr = new Date(startDate);
        const end = new Date(endDate);
        // Cap the maximum dates to prevent overwhelming network if range is too large (e.g. max 31 days)
        let days = 0;
        while (curr <= end && days < 31) {
          dates.push(`${curr.getFullYear()}-${pad(curr.getMonth() + 1)}-${pad(curr.getDate())}`);
          curr.setDate(curr.getDate() + 1);
          days++;
        }

        const attResults = await Promise.all(
          dates.map(d => listDocuments<AttendanceRecord>(companyId, `attendance/${d}/records`))
        );
        
        setAttendance(attResults.flat());
      } catch (error) {
        console.error("Failed to load attendance data", error);
      } finally {
        setAttLoading(false);
      }
    }
    fetchAttendance();
  }, [companyId, startDate, endDate]);

  const currentDate = new Date();
  const greeting = currentDate.getHours() < 12 ? "Good morning" : currentDate.getHours() < 17 ? "Good afternoon" : "Good evening";

  // Compute dynamic stats using useMemo to avoid recalculation on every render
  const { totalEmployees, activeEmployees, onLeaveEmployees } = React.useMemo(() => ({
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.employmentStatus === "active").length,
    onLeaveEmployees: employees.filter(e => e.employmentStatus === "on_leave").length,
  }), [employees]);
  
  const presentTodayCount = React.useMemo(() => attendance.filter(a => a.status === "present" || a.status === "late").length, [attendance]);
  
  const openPositions = 0; // Would require a Jobs/Recruitment module to be fully dynamic

  const dynamicStats = React.useMemo(() => [
    {
      label: "Total Employees",
      value: loading ? "..." : totalEmployees.toString(),
      change: "Active",
      trend: "up" as const,
      icon: Users,
      color: "bg-[hsl(var(--brand-royal-blue)/0.1)] text-[hsl(var(--brand-royal-blue))]",
    },
    {
      label: "Present (Selected Range)",
      value: loading ? "..." : presentTodayCount.toString(),
      change: "On Duty",
      trend: "up" as const,
      icon: CalendarCheck,
      color: "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]",
    },
    {
      label: "On Leave (Selected Range)",
      value: loading ? "..." : onLeaveEmployees.toString(),
      change: "Currently",
      trend: "down" as const,
      icon: CalendarOff,
      color: "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]",
    },
    {
      label: "Open Positions",
      value: loading ? "..." : openPositions.toString(),
      change: "0",
      trend: "up" as const,
      icon: BriefcaseBusiness,
      color: "bg-[hsl(var(--info)/0.1)] text-[hsl(var(--info))]",
    },
  ], [loading, totalEmployees, presentTodayCount, onLeaveEmployees]);

  // Dynamic Pending Approvals
  const pendingApprovals = React.useMemo(() => leaveRequests
    .filter(req => req.status === "pending")
    .map(req => {
      const emp = employees.find(e => e.id === req.employeeId);
      return {
        id: req.id,
        name: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown Employee",
        type: "Leave Request",
        days: `${req.days} days`,
        status: req.type,
        time: req.createdAt ? "Recent" : ""
      };
    }).slice(0, 5), [leaveRequests, employees]);

  // Dynamic Recent Hires (Top 3 newest based on dateOfJoining)
  const dynamicRecentHires = React.useMemo(() => [...employees]
    .sort((a, b) => new Date(b.dateOfJoining).getTime() - new Date(a.dateOfJoining).getTime())
    .slice(0, 3)
    .map(emp => {
      const dept = departments.find(d => d.id === emp.departmentId);
      return {
        name: `${emp.firstName} ${emp.lastName}`,
        role: emp.designationId || "Employee",
        dept: dept?.name || "General",
        date: new Date(emp.dateOfJoining).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
      };
    }), [employees, departments]);

  // Dynamic Upcoming Birthdays
  const upcomingBirthdays = React.useMemo(() => [...employees]
    .filter(e => e.dateOfBirth)
    .sort((a, b) => {
      const dateA = new Date(a.dateOfBirth!);
      const dateB = new Date(b.dateOfBirth!);
      const nextBirthdayA = new Date(currentDate.getFullYear(), dateA.getMonth(), dateA.getDate());
      const nextBirthdayB = new Date(currentDate.getFullYear(), dateB.getMonth(), dateB.getDate());
      
      if (nextBirthdayA < currentDate) nextBirthdayA.setFullYear(currentDate.getFullYear() + 1);
      if (nextBirthdayB < currentDate) nextBirthdayB.setFullYear(currentDate.getFullYear() + 1);
      
      return nextBirthdayA.getTime() - nextBirthdayB.getTime();
    })
    .slice(0, 3)
    .map(emp => {
      const dept = departments.find(d => d.id === emp.departmentId);
      const dob = new Date(emp.dateOfBirth!);
      return {
        name: `${emp.firstName} ${emp.lastName}`,
        date: dob.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        dept: dept?.name || "General"
      };
    }), [employees, departments, currentDate]);

  // Dynamic Department Distribution
  const departmentDistribution = React.useMemo(() => {
    const colors = ["bg-[hsl(var(--chart-1))]", "bg-[hsl(var(--chart-2))]", "bg-[hsl(var(--chart-3))]", "bg-[hsl(var(--chart-4))]", "bg-[hsl(var(--chart-5))]"];
    return departments.map((dept, index) => {
      const count = employees.filter(e => e.departmentId === dept.id).length;
      return {
        name: dept.name,
        count,
        percentage: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0,
        color: colors[index % colors.length]
      };
    }).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
  }, [departments, employees, totalEmployees]);

  const absentTodayCount = React.useMemo(() => attendance.filter(a => a.status === "absent").length, [attendance]);
  const lateTodayCount = React.useMemo(() => attendance.filter(a => a.status === "late").length, [attendance]);
  const wfhTodayCount = 0; // Custom status not natively in attendance Enum right now

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, Admin 👋</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
            Here's what's happening at your company today, {currentDate.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="h-9 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="text-[hsl(var(--muted-foreground))]">to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="h-9 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Link href="/admin/employees/new">
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-[hsl(var(--success))]" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-[hsl(var(--destructive))]" />
                    )}
                    <span className={stat.trend === "up" ? "text-[hsl(var(--success))]" : "text-[hsl(var(--destructive))]"}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals — 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[hsl(var(--warning))]" />
                  Pending Leave Approvals
                </CardTitle>
                <CardDescription>{pendingApprovals.length} requests awaiting your action</CardDescription>
              </div>
              <Link href="/admin/leave">
                <Button variant="ghost" size="sm" className="text-[hsl(var(--primary))]">
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.length > 0 ? pendingApprovals.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-[hsl(var(--secondary)/0.5)] transition-colors duration-200 group"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs">
                      {item.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.type} · {item.days}</p>
                  </div>
                  <Badge variant="secondary" className="hidden sm:inline-flex">{item.status}</Badge>
                  <span className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:block">{item.time}</span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon-sm" variant="success" className="h-7 w-7">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon-sm" variant="destructive" className="h-7 w-7">
                      <AlertCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">No pending leave requests.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution — 1 col */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>{totalEmployees} employees across {departments.length} departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentDistribution.length > 0 ? departmentDistribution.map((dept) => (
                <div key={dept.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dept.name}</span>
                    <span className="text-[hsl(var(--muted-foreground))]">{dept.count} ({dept.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${dept.color}`}
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">No departments setup.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Hires */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[hsl(var(--success))]" />
                Recent Hires
              </CardTitle>
              <Link href="/admin/employees">
                <Button variant="ghost" size="sm" className="text-[hsl(var(--primary))]">
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dynamicRecentHires.length > 0 ? (
                dynamicRecentHires.map((hire, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-[hsl(var(--secondary)/0.5)] transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]">{hire.name.split(" ").map(n => n[0]).join("").substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{hire.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{hire.role} • {hire.dept}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{hire.date}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-[hsl(var(--muted-foreground))]">No recent hires</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              🎂 Upcoming Birthdays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingBirthdays.length > 0 ? upcomingBirthdays.map((person) => (
                <div key={person.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--secondary)/0.5)] transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]">
                      {person.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{person.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{person.dept}</p>
                  </div>
                  <Badge variant="warning" className="text-xs">{person.date}</Badge>
                </div>
              )) : (
                <div className="text-center py-4 text-sm text-[hsl(var(--muted-foreground))]">No upcoming birthdays</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Attendance Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[hsl(var(--brand-royal-blue))]" />
              Today's Attendance Summary
            </CardTitle>
            <Link href="/admin/attendance">
              <Button variant="ghost" size="sm" className="text-[hsl(var(--primary))]">
                Full Report <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Present", value: presentTodayCount.toString(), color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success)/0.08)]" },
              { label: "Absent", value: absentTodayCount.toString(), color: "text-[hsl(var(--destructive))]", bg: "bg-[hsl(var(--destructive)/0.08)]" },
              { label: "On Leave", value: onLeaveEmployees.toString(), color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning)/0.08)]" },
              { label: "Late Check-in", value: lateTodayCount.toString(), color: "text-[hsl(var(--info))]", bg: "bg-[hsl(var(--info)/0.08)]" },
              { label: "Work from Home", value: wfhTodayCount.toString(), color: "text-[hsl(var(--chart-4))]", bg: "bg-[hsl(var(--chart-4)/0.08)]" },
            ].map((item) => (
              <div key={item.label} className={`p-4 rounded-xl ${item.bg} text-center`}>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
