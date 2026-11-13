"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments, deleteDocument } from "@/lib/firebase/firestore";
import type { AttendanceRecord } from "@/lib/schemas/attendance";
import type { Employee } from "@/lib/schemas/employee";
import type { Department } from "@/lib/schemas/department";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import {
  CalendarCheck, Clock, Trash2, CheckCircle2, XCircle, AlertCircle, AlertTriangle
} from "lucide-react";
import { ExportAttendance } from "@/components/attendance/export-attendance";
import {
  getLocalDateString,
  getEmployeeJoiningDate,
} from "@/lib/utils/attendance";

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

  // Filter out any records that were erroneously created before an employee's joining date
  const { validRecords, invalidRecords } = React.useMemo(() => {
    const valid: (AttendanceRecord & { id: string })[] = [];
    const invalid: (AttendanceRecord & { id: string })[] = [];

    attendanceRecords.forEach(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      const joiningDate = getEmployeeJoiningDate(emp);
      if (joiningDate && selectedDate < joiningDate) {
        invalid.push(r);
      } else {
        valid.push(r);
      }
    });

    return { validRecords: valid, invalidRecords: invalid };
  }, [attendanceRecords, employees, selectedDate]);

  const filteredRecords = React.useMemo(() => 
    employeeFilter === "all" 
      ? validRecords 
      : validRecords.filter(r => r.employeeId === employeeFilter),
  [validRecords, employeeFilter]);

  const { presentCount, absentCount, lateCount, leaveCount } = React.useMemo(() => {
    let presentCount = 0, absentCount = 0, lateCount = 0, leaveCount = 0;
    filteredRecords.forEach(r => {
      if (r.status === "present") presentCount++;
      else if (r.status === "absent") absentCount++;
      else if (r.status === "late") lateCount++;
      else if (r.status === "on_leave") leaveCount++;
    });
    return { presentCount, absentCount, lateCount, leaveCount };
  }, [filteredRecords]);

  const displayDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

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

  const handlePurgeInvalid = async () => {
    if (confirm(`Remove ${invalidRecords.length} invalid attendance record(s) dated before employee joining dates?`)) {
      try {
        for (const rec of invalidRecords) {
          await deleteDocument(companyId, `attendance/${selectedDate}/records`, rec.id);
        }
        fetchData();
        alert("Invalid records purged successfully!");
      } catch (err) {
        console.error("Failed to purge records", err);
        alert("Failed to purge records.");
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
            {employees.map(emp => {
              const joiningDate = getEmployeeJoiningDate(emp);
              const isNotYetJoined = joiningDate && selectedDate < joiningDate;
              return (
                <option key={emp.id} value={emp.id} disabled={Boolean(isNotYetJoined)}>
                  {emp.firstName} {emp.lastName} {isNotYetJoined ? `(Joined ${joiningDate})` : ""}
                </option>
              );
            })}
          </select>
          <ExportAttendance companyId={companyId} employees={employees} />
        </div>
      </div>

      {/* Invalid Records Warning & 1-Click Clean */}
      {invalidRecords.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Found <strong>{invalidRecords.length}</strong> legacy record(s) recorded prior to employee joining date. These are excluded from stats.
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handlePurgeInvalid} className="border-amber-500/40 hover:bg-amber-500/20 w-fit">
            Purge {invalidRecords.length} Invalid Record{invalidRecords.length > 1 ? "s" : ""}
          </Button>
        </div>
      )}

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
            description={`No valid attendance records found for ${displayDate}.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Employee</th>
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Duty Hours</th>
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
                        {emp?.dutyHours ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)]">
                            <Clock className="h-3.5 w-3.5" />
                            {emp.dutyHours}
                          </span>
                        ) : (
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>
                        )}
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
