"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments, deleteDocument } from "@/lib/firebase/firestore";
import type { AttendanceRecord } from "@/lib/schemas/attendance";
import type { Employee } from "@/lib/schemas/employee";
import type { Department } from "@/lib/schemas/department";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import {
  CalendarCheck, Clock, MapPin, Users, Download, Filter, Trash2,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { ExportAttendance } from "@/components/attendance/export-attendance";

const statusConfig: Record<string, { label: string; variant: "success" | "error" | "warning" | "info"; icon: React.ElementType }> = {
  present: { label: "Present", variant: "success", icon: CheckCircle2 },
  absent: { label: "Absent", variant: "error", icon: XCircle },
  late: { label: "Late", variant: "warning", icon: AlertCircle },
  on_leave: { label: "On Leave", variant: "info", icon: CalendarCheck },
};

export default function AttendancePage() {
  const companyId = useCompanyId();
  const [employees, setEmployees] = useState<(Employee & { id: string })[]>([]);
  const [departments, setDepartments] = useState<(Department & { id: string })[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<(AttendanceRecord & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const getLocalDateString = (d: Date = new Date()) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [employeeFilter, setEmployeeFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empData, deptData, attData] = await Promise.all([
        listDocuments<Employee>(companyId, "employees"),
        listDocuments<Department>(companyId, "departments"),
        listDocuments<AttendanceRecord>(companyId, `attendance/${selectedDate}/records`)
      ]);
      setEmployees(empData);
      setDepartments(deptData);
      setAttendanceRecords(attData);
    } catch (error) {
      console.error("Error fetching attendance data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId, selectedDate]);

  const filteredRecords = employeeFilter === "all" 
    ? attendanceRecords 
    : attendanceRecords.filter(r => r.employeeId === employeeFilter);

  const presentCount = filteredRecords.filter(r => r.status === "present").length;
  const absentCount = filteredRecords.filter(r => r.status === "absent").length;
  const lateCount = filteredRecords.filter(r => r.status === "late").length;
  const leaveCount = filteredRecords.filter(r => r.status === "on_leave").length;

  const displayDate = new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const getDeptName = (deptId?: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : "N/A";
  };

  const handleDelete = async (recordId: string) => {
    if (confirm("Are you sure you want to delete this attendance record?")) {
      try {
        await deleteDocument(companyId, `attendance/${selectedDate}/records`, recordId);
        fetchData();
      } catch (error) {
        console.error("Error deleting record", error);
        alert("Failed to delete record.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{displayDate}</p>
        </div>
        <div className="flex gap-2 items-center">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="h-9 px-3 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm"
          />
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm max-w-[200px]"
          >
            <option value="all">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
            ))}
          </select>
          <ExportAttendance companyId={companyId} employees={employees} />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Present", value: presentCount, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success)/0.08)]" },
          { label: "Absent", value: absentCount, color: "text-[hsl(var(--destructive))]", bg: "bg-[hsl(var(--destructive)/0.08)]" },
          { label: "Late", value: lateCount, color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning)/0.08)]" },
          { label: "On Leave", value: leaveCount, color: "text-[hsl(var(--info))]", bg: "bg-[hsl(var(--info)/0.08)]" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className={`p-4 text-center ${s.bg} rounded-xl`}>
              <p className={`text-2xl font-bold ${s.color}`}>{loading ? "..." : s.value}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />}
            title="No attendance records"
            description={`No attendance records found for ${displayDate}.`}
            action={{ label: "Log Attendance", onClick: () => {} }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Employee</th>
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Punch In</th>
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Punch Out</th>
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Hours</th>
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Status</th>
                  <th className="text-right text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((row) => {
                  const emp = employees.find(e => e.id === row.employeeId);
                  const config = statusConfig[row.status] || statusConfig.present;
                  const StatusIcon = config.icon;
                  const empName = emp ? `${emp.firstName} ${emp.lastName}` : "Unknown";
                  return (
                    <tr key={row.id} className="border-b border-[hsl(var(--border)/0.5)] hover:bg-[hsl(var(--secondary)/0.3)] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={emp?.photoUrl} alt={empName} />
                            <AvatarFallback className="text-xs">{empName.split(" ").map(n => n[0]).join("").substring(0,2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{empName}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{getDeptName(emp?.departmentId)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                          {row.checkIn || "—"}
                        </span>
                      </td>
                      <td className="p-4"><span className="text-sm">{row.checkOut || "—"}</span></td>
                      <td className="p-4"><span className="text-sm font-medium">{row.hoursWorked ? `${row.hoursWorked}h` : "—"}</span></td>
                      <td className="p-4">
                        <Badge variant={config.variant} className="flex w-fit items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
