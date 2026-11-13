"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments, createDocument, deleteDocument } from "@/lib/firebase/firestore";
import type { AttendanceRecord } from "@/lib/schemas/attendance";
import type { Employee } from "@/lib/schemas/employee";
import type { Department } from "@/lib/schemas/department";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { ExportAttendance } from "@/components/attendance/export-attendance";
import { Input } from "@/components/ui/input";
import {
  Clock, Save, AlertCircle, CalendarOff, UserX
} from "lucide-react";
import {
  getLocalDateString,
  getEmployeeJoiningDate,
  categorizeEmployeesByJoiningDate,
} from "@/lib/utils/attendance";

export default function DailyAttendancePage() {
  const companyId = useCompanyId();
  const [employees, setEmployees] = useState<(Employee & { id: string })[]>([]);
  const [departments, setDepartments] = useState<(Department & { id: string })[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<(AttendanceRecord & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  // Local edits state mapping employeeId -> Partial<AttendanceRecord>
  const [edits, setEdits] = useState<Record<string, Partial<AttendanceRecord & { id?: string }>>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [empData, deptData, attData] = await Promise.all([
          listDocuments<Employee>(companyId, "employees"),
          listDocuments<Department>(companyId, "departments"),
          listDocuments<AttendanceRecord>(companyId, `attendance/${selectedDate}/records`)
        ]);
        setEmployees(empData.filter(e => e.employmentStatus === "active"));
        setDepartments(deptData);
        setAttendanceRecords(attData);
        setEdits({});
      } catch (error) {
        console.error("Error fetching attendance data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [companyId, selectedDate]);

  // Categorize employees strictly based on whether their joining date is on or before selectedDate
  const { eligible: eligibleEmployees, notJoinedYet: notJoinedYetEmployees } = React.useMemo(() => {
    return categorizeEmployeesByJoiningDate(employees, selectedDate);
  }, [employees, selectedDate]);

  const handleEdit = (employeeId: string, field: keyof AttendanceRecord, value: any) => {
    // Prevent editing if the employee joined after selectedDate
    const emp = employees.find(e => e.id === employeeId);
    const joiningDate = getEmployeeJoiningDate(emp);
    if (joiningDate && selectedDate < joiningDate) {
      alert(`Cannot mark attendance: ${emp?.firstName || 'Employee'} joined on ${joiningDate}, which is after ${selectedDate}.`);
      return;
    }

    setEdits(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Strictly save attendance ONLY for eligible employees (joined on or before selectedDate)
      const promises = eligibleEmployees.map(async (emp) => {
        const employeeId = emp.id;
        const updates = edits[employeeId] || {};
        const existingRecord = attendanceRecords.find(r => r.employeeId === employeeId);
        
        const recordData = {
          employeeId,
          date: selectedDate,
          status: updates.status || existingRecord?.status || "present",
          checkIn: updates.checkIn !== undefined ? updates.checkIn : (existingRecord?.checkIn || ""),
          checkOut: updates.checkOut !== undefined ? updates.checkOut : (existingRecord?.checkOut || ""),
        };
        
        // Clean up legacy records with random doc IDs if any exist
        if (existingRecord && existingRecord.id !== employeeId) {
          try {
            await deleteDocument(companyId, `attendance/${selectedDate}/records`, existingRecord.id);
          } catch (e) {
            console.error("Failed to delete legacy attendance record ID", e);
          }
        }
        
        // Upsert with customId = employeeId for fast, deterministic indexing
        await createDocument(companyId, `attendance/${selectedDate}/records`, recordData, employeeId);
      });

      // 2. Auto-clean: Purge any invalid attendance records that might have been mistakenly saved for employees who hadn't joined yet
      for (const emp of notJoinedYetEmployees) {
        const invalidRecord = attendanceRecords.find(r => r.employeeId === emp.id);
        if (invalidRecord) {
          try {
            await deleteDocument(companyId, `attendance/${selectedDate}/records`, invalidRecord.id || emp.id);
          } catch (e) {
            console.error("Failed to remove invalid attendance record", e);
          }
        }
      }

      await Promise.all(promises);
      
      // Refresh current attendance records
      const attData = await listDocuments<AttendanceRecord>(companyId, `attendance/${selectedDate}/records`);
      setAttendanceRecords(attData);
      setEdits({});
      alert("Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance", error);
      alert("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const getDeptName = (deptId?: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : "N/A";
  };

  const displayDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  
  // A record is missing if an eligible employee doesn't have an entry in attendanceRecords
  const missingRecords = eligibleEmployees.some(emp => !attendanceRecords.find(r => r.employeeId === emp.id));
  const hasEdits = Object.keys(edits).length > 0 || missingRecords;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Daily Attendance</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Mark and manage attendance for {displayDate}</p>
        </div>
        <div className="flex gap-3 items-center">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="h-9 px-3 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm"
          />
          <ExportAttendance companyId={companyId} employees={employees} />
          <Button onClick={handleSave} disabled={!hasEdits || saving || eligibleEmployees.length === 0}>
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[hsl(var(--primary-foreground))] mr-2"></div> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Notice for employees who joined after this date */}
      {notJoinedYetEmployees.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              {notJoinedYetEmployees.length} employee{notJoinedYetEmployees.length > 1 ? "s" : ""} joined after {displayDate} and cannot be marked for attendance on this date:
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {notJoinedYetEmployees.map((emp) => {
              const joiningDate = getEmployeeJoiningDate(emp);
              return (
                <span
                  key={emp.id}
                  className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-semibold border border-amber-500/25"
                >
                  <UserX className="h-3 w-3" />
                  {emp.firstName} {emp.lastName}
                  <span className="opacity-80">(Joined: {joiningDate || "N/A"})</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
          </div>
        ) : eligibleEmployees.length === 0 ? (
          <EmptyState
            icon={<CalendarOff className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />}
            title="No eligible employees"
            description={`No employees had joined yet as of ${displayDate}.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-4">Employee</th>
                  <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-4 w-36">Duty Hours</th>
                  <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-4 w-40">Status</th>
                  <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-4 w-32">Punch In</th>
                  <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-4 w-32">Punch Out</th>
                </tr>
              </thead>
              <tbody>
                {eligibleEmployees.map((emp) => {
                  const empName = `${emp.firstName} ${emp.lastName}`;
                  const existingRecord = attendanceRecords.find(r => r.employeeId === emp.id);
                  const editState = edits[emp.id] || {};
                  
                  const status = editState.status || existingRecord?.status || "present";
                  const checkIn = editState.checkIn !== undefined ? editState.checkIn : (existingRecord?.checkIn || "");
                  const checkOut = editState.checkOut !== undefined ? editState.checkOut : (existingRecord?.checkOut || "");

                  return (
                    <tr key={emp.id} className="border-b border-[hsl(var(--border)/0.5)] hover:bg-[hsl(var(--secondary)/0.3)] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={emp?.photoUrl} alt={empName} />
                            <AvatarFallback className="text-xs bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">{empName.split(" ").map(n => n[0]).join("").substring(0,2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{empName}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{getDeptName(emp.departmentId)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {emp.dutyHours ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)]">
                            <Clock className="h-3.5 w-3.5" />
                            {emp.dutyHours}
                          </span>
                        ) : (
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <select 
                          value={status}
                          onChange={(e) => handleEdit(emp.id, "status", e.target.value)}
                          className="h-9 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="on_leave">On Leave</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <Input 
                          type="time"
                          value={checkIn}
                          onChange={(e) => handleEdit(emp.id, "checkIn", e.target.value)}
                          className="h-9"
                          disabled={status === "absent" || status === "on_leave"}
                        />
                      </td>
                      <td className="p-4">
                        <Input 
                          type="time"
                          value={checkOut}
                          onChange={(e) => handleEdit(emp.id, "checkOut", e.target.value)}
                          className="h-9"
                          disabled={status === "absent" || status === "on_leave"}
                        />
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
