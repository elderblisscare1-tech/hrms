"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { listDocuments } from "@/lib/firebase/firestore";
import type { AttendanceRecord } from "@/lib/schemas/attendance";
import type { Employee } from "@/lib/schemas/employee";
import * as xlsx from "xlsx";

export function ExportAttendance({ companyId, employees }: { companyId: string, employees: (Employee & { id: string })[] }) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Generate array of dates between start and end
      const dates = [];
      let currentDate = new Date(startDate);
      const lastDate = new Date(endDate);
      while (currentDate <= lastDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const employeeRows: Record<string, any> = {};
      
      employees.forEach(emp => {
        if (selectedEmployee !== "all" && emp.id !== selectedEmployee) return;
        
        employeeRows[emp.id] = {
          "Employee ID": emp.id || "N/A",
          "Employee Name": `${emp.firstName} ${emp.lastName}`,
          "Role": emp.role || "N/A",
          "Total Present": 0,
          "Total Absent": 0,
          "Total Late": 0,
          "Total On Leave": 0,
        };
      });

      for (const date of dates) {
        // Initialize date column for all matched employees
        Object.keys(employeeRows).forEach(empId => {
          employeeRows[empId][date] = "-";
        });
        
        const records = await listDocuments<AttendanceRecord>(companyId, `attendance/${date}/records`);
        
        records.forEach(record => {
          const empId = record.employeeId;
          if (employeeRows[empId]) {
            const status = record.status;
            let cellText = status.toUpperCase();
            if (record.checkIn || record.checkOut) {
               cellText += ` (${record.checkIn || '--:--'} - ${record.checkOut || '--:--'})`;
            }
            employeeRows[empId][date] = cellText;
            
            if (status === "present") employeeRows[empId]["Total Present"]++;
            else if (status === "absent") employeeRows[empId]["Total Absent"]++;
            else if (status === "late") employeeRows[empId]["Total Late"]++;
            else if (status === "on_leave") employeeRows[empId]["Total On Leave"]++;
          }
        });
      }

      const allRecords = Object.values(employeeRows);

      if (allRecords.length === 0) {
        alert("No attendance records found for the selected criteria.");
        setExporting(false);
        return;
      }

      const ws = xlsx.utils.json_to_sheet(allRecords);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Attendance");
      
      const fileName = `Attendance_Export_${startDate}_to_${endDate}.xlsx`;
      xlsx.writeFile(wb, fileName);
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to export attendance data.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9"><Download className="h-4 w-4 mr-2" /> Export</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Attendance to Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Employee</label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleExport} disabled={exporting} className="w-full">
            {exporting ? "Generating Excel..." : "Download Excel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
