"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { listDocuments } from "@/lib/firebase/firestore";
import type { AttendanceRecord } from "@/lib/schemas/attendance";
import type { Employee } from "@/lib/schemas/employee";
import { getLocalDateString, getEmployeeJoiningDate } from "@/lib/utils/attendance";
import * as xlsx from "xlsx";

export function ExportAttendance({ companyId, employees }: { companyId: string, employees: (Employee & { id: string })[] }) {
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Generate array of dates between start and end
      const dates: string[] = [];
      const currentDate = new Date(startDate + "T00:00:00");
      const lastDate = new Date(endDate + "T00:00:00");
      
      const pad = (n: number) => n.toString().padStart(2, "0");
      const tempDate = new Date(currentDate);
      while (tempDate <= lastDate) {
        dates.push(`${tempDate.getFullYear()}-${pad(tempDate.getMonth() + 1)}-${pad(tempDate.getDate())}`);
        tempDate.setDate(tempDate.getDate() + 1);
      }

      const employeeRows: Record<string, any> = {};
      const empMap = new Map<string, Employee & { id: string }>();
      
      employees.forEach(emp => {
        empMap.set(emp.id, emp);
        if (selectedEmployee !== "all" && emp.id !== selectedEmployee) return;
        
        employeeRows[emp.id] = {
          "Employee ID": emp.id || "N/A",
          "Employee Name": `${emp.firstName} ${emp.lastName}`,
          "Date of Joining": getEmployeeJoiningDate(emp) || "N/A",
          "Duty Hours": emp.dutyHours || "N/A",
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
          const emp = empMap.get(empId);
          const joiningDate = getEmployeeJoiningDate(emp);
          if (joiningDate && date < joiningDate) {
            employeeRows[empId][date] = "NOT JOINED";
          } else {
            employeeRows[empId][date] = "-";
          }
        });
        
        const records = await listDocuments<AttendanceRecord>(companyId, `attendance/${date}/records`);
        
        records.forEach(record => {
          const empId = record.employeeId;
          if (employeeRows[empId]) {
            const emp = empMap.get(empId);
            const joiningDate = getEmployeeJoiningDate(emp);
            // Strict check: skip any record that occurred prior to the employee's joining date
            if (joiningDate && date < joiningDate) {
              employeeRows[empId][date] = "NOT JOINED";
              return;
            }

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Attendance to Excel</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Filter by Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          </div>

          <Button onClick={handleExport} disabled={exporting} className="w-full mt-2">
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[hsl(var(--primary-foreground))] mr-2"></div>
                Generating Excel...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" /> Download Report (.xlsx)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
