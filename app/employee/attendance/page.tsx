"use client";

import React, { useState, useEffect } from "react";
import { useRequireAuth } from "@/lib/auth/auth-context";
import { getDocument } from "@/lib/firebase/firestore";
import type { AttendanceRecord } from "@/lib/schemas/attendance";
import type { Employee } from "@/lib/schemas/employee";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, CalendarOff, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { getEmployeeJoiningDate, getLocalDateString } from "@/lib/utils/attendance";

export default function EmployeeAttendancePage() {
  const { claims } = useRequireAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [records, setRecords] = useState<(AttendanceRecord & { dateString: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, onLeave: 0 });

  useEffect(() => {
    async function fetchData() {
      if (!claims?.companyId || !claims?.employeeId) return;
      try {
        const emp = await getDocument<Employee>(claims.companyId, "employees", claims.employeeId);
        setEmployee(emp);

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = today.getDate(); // Up to today

        const joiningDate = getEmployeeJoiningDate(emp);
        
        const fetchedRecords: (AttendanceRecord & { dateString: string })[] = [];
        const newStats = { present: 0, absent: 0, late: 0, onLeave: 0 };

        const promises = [];
        for (let i = 1; i <= daysInMonth; i++) {
          const date = new Date(year, month, i);
          // Skip Sundays
          if (date.getDay() === 0) continue; 
          
          const dateString = getLocalDateString(date);

          // STRICT CHECK: Skip days before joining date
          if (joiningDate && dateString < joiningDate) {
            continue;
          }

          promises.push(
            getDocument<AttendanceRecord>(claims.companyId, `attendance/${dateString}/records`, claims.employeeId)
              .then(doc => {
                if (doc) {
                  // Safety verification: never include records dated before joining date
                  if (joiningDate && dateString < joiningDate) return;
                  
                  fetchedRecords.push({ ...doc, dateString });
                  const status = (doc.status || '').trim().toLowerCase();
                  if (status === 'present') newStats.present++;
                  if (status === 'absent') newStats.absent++;
                  if (status === 'late') newStats.late++;
                  if (status === 'on_leave') newStats.onLeave++;
                }
              })
          );
        }

        await Promise.all(promises);
        
        fetchedRecords.sort((a, b) => new Date(b.dateString).getTime() - new Date(a.dateString).getTime());
        setRecords(fetchedRecords);
        setStats(newStats);
      } catch (err) {
        console.error("Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    }
    if (claims) fetchData();
  }, [claims]);

  const getStatusBadge = (status: string) => {
    switch ((status || '').trim().toLowerCase()) {
      case "present": return <Badge className="bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.2)] border-none"><CheckCircle2 className="w-3 h-3 mr-1"/> Present</Badge>;
      case "late": return <Badge className="bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)/0.2)] border-none"><Clock className="w-3 h-3 mr-1"/> Late</Badge>;
      case "absent": return <Badge className="bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.2)] border-none"><AlertCircle className="w-3 h-3 mr-1"/> Absent</Badge>;
      case "on_leave": return <Badge className="bg-[hsl(var(--info)/0.1)] text-[hsl(var(--info))] hover:bg-[hsl(var(--info)/0.2)] border-none"><CalendarOff className="w-3 h-3 mr-1"/> On Leave</Badge>;
      default: return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
      </div>
    );
  }

  const joiningDate = getEmployeeJoiningDate(employee);

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Track your attendance for this month
          {joiningDate && ` • Joined ${new Date(joiningDate + "T00:00:00").toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Card className="text-center">
          <CardContent className="p-3">
             <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1 uppercase font-bold tracking-wider">Present</p>
             <p className="text-xl font-bold text-[hsl(var(--success))]">{stats.present}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
             <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1 uppercase font-bold tracking-wider">Late</p>
             <p className="text-xl font-bold text-[hsl(var(--warning))]">{stats.late}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
             <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1 uppercase font-bold tracking-wider">Absent</p>
             <p className="text-xl font-bold text-[hsl(var(--destructive))]">{stats.absent}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
             <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1 uppercase font-bold tracking-wider">Leave</p>
             <p className="text-xl font-bold text-[hsl(var(--info))]">{stats.onLeave}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CalendarCheck className="h-4 w-4" /> This Month's Log
        </h2>
        <div className="space-y-2">
          {records.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No attendance records found for this month.</p>
          ) : (
            records.map((record, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center w-12 shrink-0 border-r pr-3">
                      <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase">
                        {new Date(record.dateString + "T00:00:00").toLocaleDateString('en-IN', { weekday: 'short' })}
                      </p>
                      <p className="text-lg font-bold">{new Date(record.dateString + "T00:00:00").getDate()}</p>
                    </div>
                    <div>
                      {getStatusBadge(record.status)}
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        {record.checkIn ? `In: ${record.checkIn}` : "No punch"}
                        {record.checkOut ? ` • Out: ${record.checkOut}` : ""}
                      </p>
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
