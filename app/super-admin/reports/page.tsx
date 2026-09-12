"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments } from "@/lib/firebase/firestore";
import type { Employee } from "@/lib/schemas/employee";
import type { Vendor } from "@/lib/schemas/vendor";
import type { AttendanceRecord } from "@/lib/schemas/attendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, Loader2, Settings2 } from "lucide-react";

export default function ReportsPage() {
  const companyId = useCompanyId();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [generating, setGenerating] = useState(false);

  // Customization Options
  const [options, setOptions] = useState({
    contactInfo: true,
    employmentDetails: true,
    vendorDetails: true,
    dailyAttendance: true,
    vendorsMasterTab: true,
    mappingTab: true,
  });

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const generateMasterReport = async () => {
    if (!companyId) return;
    setGenerating(true);

    try {
      const [employees, vendors, attendanceRecords] = await Promise.all([
        listDocuments<Employee>(companyId, "employees"),
        listDocuments<Vendor>(companyId, "vendors"),
        options.dailyAttendance || options.mappingTab 
          ? listDocuments<AttendanceRecord>(companyId, `attendance/${selectedDate}/records`).catch(() => [])
          : Promise.resolve([])
      ]);

      const vendorMap = new Map<string, Vendor>();
      vendors.forEach(v => {
        if (v.id) vendorMap.set(v.id, v);
      });

      const attendanceMap = new Map<string, AttendanceRecord>();
      attendanceRecords.forEach(a => attendanceMap.set(a.employeeId, a));

      // 1. Employees Master Sheet
      const employeesData = employees.map(emp => {
        const vendor = emp.vendorId ? vendorMap.get(emp.vendorId) : null;
        const attendance = emp.id ? attendanceMap.get(emp.id) : null;
        
        const row: Record<string, string> = {
          "Employee Name": `${emp.firstName} ${emp.lastName}`,
        };

        if (options.contactInfo) {
          row["Email"] = emp.email;
          row["Phone"] = emp.phone;
        }

        if (options.employmentDetails) {
          row["Role"] = emp.role;
          row["Employment Type"] = emp.employmentType;
          row["Employment Status"] = emp.employmentStatus;
        }

        if (options.vendorDetails) {
          row["Associated Vendor"] = vendor ? vendor.name : "N/A";
          row["Vendor Company"] = vendor ? vendor.companyName : "N/A";
        }

        if (options.dailyAttendance) {
          row[`Attendance (${selectedDate})`] = attendance ? attendance.status.toUpperCase() : "NOT MARKED";
        }

        return row;
      });

      const wb = XLSX.utils.book_new();
      
      const wsEmployees = XLSX.utils.json_to_sheet(employeesData);
      XLSX.utils.book_append_sheet(wb, wsEmployees, "Employees Master");

      // 2. Vendors Master Sheet
      if (options.vendorsMasterTab) {
        const vendorsData = vendors.map(v => {
          const staffDetails = v.staff?.map(s => `${s.staffType} (${s.hours ? s.hours + ' hrs, ' : ''}${s.rate})`).join(" | ") || "No duties";
          return {
            "Vendor Name": v.name,
            "Company Name": v.companyName,
            "Phone Number": v.phoneNumber || "N/A",
            "Status": v.isActive ? "Active" : "Inactive",
            "Duties Details": staffDetails,
          };
        });
        const wsVendors = XLSX.utils.json_to_sheet(vendorsData);
        XLSX.utils.book_append_sheet(wb, wsVendors, "Vendors Master");
      }

      // 3. Mapping Sheet
      if (options.mappingTab) {
        const vendorEmployeeData = employees
          .filter(emp => emp.vendorId && vendorMap.has(emp.vendorId))
          .map(emp => {
            const vendor = vendorMap.get(emp.vendorId as string)!;
            const attendance = emp.id ? attendanceMap.get(emp.id) : null;
            
            return {
              "Vendor Name": vendor.name,
              "Vendor Company": vendor.companyName,
              "Employee Name": `${emp.firstName} ${emp.lastName}`,
              "Employee Role": emp.role,
              [`Employee Attendance (${selectedDate})`]: attendance ? attendance.status.toUpperCase() : "NOT MARKED",
            };
          });
        
        vendorEmployeeData.sort((a, b) => a["Vendor Name"].localeCompare(b["Vendor Name"]));
        const wsVendorEmployee = XLSX.utils.json_to_sheet(vendorEmployeeData);
        XLSX.utils.book_append_sheet(wb, wsVendorEmployee, "Vendor-Employee Mapping");
      }

      XLSX.writeFile(wb, `Customized_Report_${selectedDate}.xlsx`);

    } catch (error) {
      console.error("Error generating report:", error);
      alert("An error occurred while generating the report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Custom Reports & Exports</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Select the data you need and generate highly customized Excel reports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-[hsl(var(--primary)/0.2)]">
          <CardHeader className="bg-[hsl(var(--primary)/0.02)] border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[hsl(var(--primary)/0.1)] rounded-lg">
                <Settings2 className="h-5 w-5 text-[hsl(var(--primary))]" />
              </div>
              <div>
                <CardTitle className="text-lg">Report Customization</CardTitle>
                <CardDescription>Choose which columns and sheets to include</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Employees Sheet Columns</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="opt-contact" checked={options.contactInfo} onCheckedChange={() => toggleOption("contactInfo")} />
                  <Label htmlFor="opt-contact" className="cursor-pointer">Contact Info (Email, Phone)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="opt-emp" checked={options.employmentDetails} onCheckedChange={() => toggleOption("employmentDetails")} />
                  <Label htmlFor="opt-emp" className="cursor-pointer">Employment Details (Role, Status)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="opt-vendor" checked={options.vendorDetails} onCheckedChange={() => toggleOption("vendorDetails")} />
                  <Label htmlFor="opt-vendor" className="cursor-pointer">Vendor Assignment</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="opt-att" checked={options.dailyAttendance} onCheckedChange={() => toggleOption("dailyAttendance")} />
                  <Label htmlFor="opt-att" className="cursor-pointer">Daily Attendance Status</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[hsl(var(--border)/0.5)]">
              <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Additional Data Sheets</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="opt-v-master" checked={options.vendorsMasterTab} onCheckedChange={() => toggleOption("vendorsMasterTab")} />
                  <Label htmlFor="opt-v-master" className="cursor-pointer">Include Vendors Master Sheet (All vendor details)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="opt-map" checked={options.mappingTab} onCheckedChange={() => toggleOption("mappingTab")} />
                  <Label htmlFor="opt-map" className="cursor-pointer">Include Vendor-Employee Mapping Sheet</Label>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        <Card className="shadow-sm border-[hsl(var(--primary)/0.2)] h-fit">
          <CardHeader className="bg-[hsl(var(--primary)/0.02)] border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[hsl(var(--primary)/0.1)] rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-[hsl(var(--primary))]" />
              </div>
              <div>
                <CardTitle className="text-lg">Generate Export</CardTitle>
                <CardDescription>Select the date and download your Excel file</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold">Select Date for Attendance Data</label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                The attendance status (Present/Absent) will be fetched for this specific date.
              </p>
            </div>
            
            <Button 
              onClick={generateMasterReport} 
              disabled={generating || !selectedDate}
              className="w-full py-6"
            >
              {generating ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating Custom Excel...</>
              ) : (
                <><Download className="h-5 w-5 mr-2" /> Download Customized .xlsx</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
