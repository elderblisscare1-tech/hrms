"use client";

import React, { useState, useEffect } from "react";
import { useRequireAuth } from "@/lib/auth/auth-context";
import { getDocument, listDocuments, subscribeToDocument } from "@/lib/firebase/firestore";
import type { Employee } from "@/lib/schemas/employee";
import type { LeaveRequest } from "@/lib/schemas/leave";
import type { AttendanceRecord } from "@/lib/schemas/attendance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CalendarCheck,
  CalendarOff,
  Clock,
  Receipt,
  ChevronRight,
  Bell,
  MapPin,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function EmployeeHomePage() {
  const { claims } = useRequireAuth();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendanceToday, setAttendanceToday] = useState<AttendanceRecord | null>(null);
  const [attendancePercentage, setAttendancePercentage] = useState<number>(0);
  const [leaveBalance, setLeaveBalance] = useState({ casual: 4, earned: 8, total: 12 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Hydration fix for time
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dynamic data
  useEffect(() => {
    if (!claims?.companyId || !claims?.employeeId) return;

    const unsubscribeEmp = subscribeToDocument<Employee>(
      claims.companyId,
      "employees",
      claims.employeeId,
      (doc) => {
        if (doc) setEmployee(doc);
      }
    );

    async function fetchData() {
      if (!claims?.companyId || !claims?.employeeId) return;
      const { companyId, employeeId } = claims;
      try {
        const empData = await getDocument<Employee>(companyId, "employees", employeeId);
        
        const today = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const dateStringToday = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
        const attData = await getDocument<AttendanceRecord>(companyId, `attendance/${dateStringToday}/records`, employeeId);
        if (attData) setAttendanceToday(attData);

        // Fetch leave requests for balance calculation
        const leaves = await listDocuments<LeaveRequest>(companyId, "leaveRequests");
        const myLeaves = leaves.filter(l => l.employeeId === employeeId && l.status === "approved");
        const used = myLeaves.reduce((acc, curr) => acc + curr.days, 0);
        setLeaveBalance({ casual: 4, earned: Math.max(8 - used, 0), total: 12 - used });

        // Fetch monthly attendance for percentage calculation
        let presentCount = 0;
        let totalWorkDays = today.getDate(); // Up to today
        
        const attPromises: any[] = [];
        for (let i = 1; i <= totalWorkDays; i++) {
          const date = new Date(today.getFullYear(), today.getMonth(), i);
          if (date.getDay() === 0) continue; // skip sunday
          const dateString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
          attPromises.push(
            getDocument<AttendanceRecord>(companyId, `attendance/${dateString}/records`, employeeId)
          );
        }
        
        const monthRecords = await Promise.all(attPromises);
        let actualWorkDays = 0;
        monthRecords.forEach(doc => {
          if (doc) {
            actualWorkDays++;
            const status = (doc.status || '').trim().toLowerCase();
            if (status === 'present') presentCount++;
          }
        });
        
        const targetDays = empData?.targetWorkingDays;
        const denominator = (targetDays && targetDays > 0) ? targetDays : actualWorkDays;
        
        setAttendancePercentage(denominator > 0 ? (presentCount / denominator) * 100 : 0);

        // Fetch announcements/notifications
        const allNotifications = await listDocuments<any>(companyId, "notifications");
        setAnnouncements(allNotifications.slice(0, 3)); // top 3

      } catch (error) {
        console.error("Error fetching employee dashboard data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      unsubscribeEmp();
    };
  }, [claims]);

  const greeting = currentTime.getHours() < 12 ? "Good morning" : currentTime.getHours() < 17 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
      </div>
    );
  }

  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : "Employee";
  const initials = employee ? `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}` : "EM";

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-white/20">
            {employee?.photoUrl && (
              <AvatarImage src={employee.photoUrl} alt={initials} className="object-cover" />
            )}
            <AvatarFallback className="text-base bg-[hsl(var(--primary))] text-white">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{greeting}</p>
            <h1 className="text-lg font-bold">{employeeName}</h1>
          </div>
        </div>
        <button className="relative p-2 rounded-full hover:bg-[hsl(var(--secondary))] transition-colors">
          <Bell className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--destructive))] border-2 border-[hsl(var(--background))]" />
        </button>
      </div>

      {/* Attendance Status Card */}
      <Card className="overflow-hidden">
        <div className="gradient-brand p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white/70">
                Today, {mounted ? currentTime.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" }) : "..."}
              </p>
              <p className="text-2xl font-bold mt-1">
                {mounted ? currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
              </p>
            </div>
            <div className="text-right">
              <Badge className="bg-white/20 text-white border-white/20">
                <MapPin className="h-3 w-3 mr-1" /> {employee?.workLocation && employee.workLocation.trim() !== "" ? employee.workLocation : "Office"}
              </Badge>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-full ${attendanceToday?.status ? 'bg-white/20' : 'bg-white/10'}`}>
                {attendanceToday?.status ? (
                  <CheckCircle2 className="h-5 w-5 text-white" />
                ) : (
                  <Clock className="h-5 w-5 text-white/70" />
                )}
              </div>
              <div>
                <p className="text-xs text-white/70">Status</p>
                <p className="font-semibold text-lg capitalize">
                  {attendanceToday?.status ? attendanceToday.status : "Not Marked"}
                </p>
              </div>
            </div>
            
            <div className="text-right">
               <p className="text-xs text-white/70">Check In</p>
               <p className="font-semibold">
                 {attendanceToday?.checkIn || "--:--"}
               </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20 text-sm text-white/70">
            <span>Shift: 9:00 AM - 6:00 PM</span>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[hsl(var(--success)/0.1)]">
                <CalendarCheck className="h-4 w-4 text-[hsl(var(--success))]" />
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Attendance</span>
            </div>
            <p className="text-xl font-bold">{attendancePercentage.toFixed(1)}%</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-0.5 mt-0.5">
               this month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[hsl(var(--warning)/0.1)]">
                <CalendarOff className="h-4 w-4 text-[hsl(var(--warning))]" />
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Leave Balance</span>
            </div>
            <p className="text-xl font-bold">{leaveBalance.total} days</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              {leaveBalance.casual} casual · {leaveBalance.earned} earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Apply Leave", href: "/employee/leave", icon: CalendarOff, color: "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]" },
            { label: "Payslip", href: "/employee/payslips", icon: Receipt, color: "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]" },
            { label: "Attendance", href: "/employee/attendance", icon: CalendarCheck, color: "bg-[hsl(var(--info)/0.1)] text-[hsl(var(--info))]" },
            { label: "Help", href: "#", icon: Bell, color: "bg-[hsl(var(--chart-4)/0.1)] text-[hsl(var(--chart-4))]" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                href={action.href}
                key={action.label}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-[hsl(var(--secondary))] transition-colors active:scale-95"
              >
                <div className={`p-2.5 rounded-xl ${action.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] text-center">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Announcements */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Announcements</h2>
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No announcements today.</p>
          ) : (
            announcements.map((announcement, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-8 rounded-full bg-[hsl(var(--primary))] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{announcement.title || "Announcement"}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{announcement.message || announcement.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
