"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments, createDocument, updateDocument } from "@/lib/firebase/firestore";
import type { AttendanceRecord } from "@/lib/schemas/attendance";
import type { Employee } from "@/lib/schemas/employee";
import type { Department } from "@/lib/schemas/department";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { ExportAttendance } from "@/components/attendance/export-attendance";
import { Input } from "@/components/ui/input";
import {
  CalendarCheck, Clock, MapPin, Users, Download, Filter,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, Save
} from "lucide-react";

export default function DailyAttendancePage() {
  const companyId = useCompanyId();
  const [employees, setEmployees] = useState<(Employee & { id: string })[]>([]);
  const [departments, setDepartments] = useState<(Department & { id: string })[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<(AttendanceRecord & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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
        setEmployees(empData.filter(e => e.employmentStatus === "active")); // Only show active employees
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

  const handleEdit = (employeeId: string, field: keyof AttendanceRecord, value: any) => {
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
      const promises = Object.entries(edits).map(async ([employeeId, updates]) => {
        const existingRecord = attendanceRecords.find(r => r.employeeId === employeeId);
        if (existingRecord) {
          // Update existing
          await updateDocument(companyId, `attendance/${selectedDate}/records`, existingRecord.id, updates);
        } else {
          // Create new
          const newRecord = {
            employeeId,
            date: selectedDate,
            status: updates.status || "present",
            checkIn: updates.checkIn || "",
            checkOut: updates.checkOut || "",
            ...updates
          };
          await createDocument(companyId, `attendance/${selectedDate}/records`, newRecord);
        }
      });
      await Promise.all(promises);
      
      // Refresh
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

  const displayDate = new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const hasEdits = Object.keys(edits).length > 0;

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
          <Button onClick={handleSave} disabled={!hasEdits || saving}>
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[hsl(var(--primary-foreground))] mr-2"></div> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            icon={<Users className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />}
            title="No active employees"
            description="Add some active employees to manage their attendance."
            action={{ label: "Add Employee", onClick: () => {} }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-4">Employee</th>
                  <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-4 w-40">Status</th>
                  <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-4 w-32">Punch In</th>
                  <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-4 w-32">Punch Out</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
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
