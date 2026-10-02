"use client";

import React, { useState, useEffect } from "react";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import * as XLSX from "xlsx";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments } from "@/lib/firebase/firestore";
import type { Client, ClientStaffAssignment } from "@/lib/schemas/client";
import type { AttendanceRecord } from "@/lib/schemas/attendance";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, FileSpreadsheet } from "lucide-react";

// Helper for parsing dates which might be ISO strings or Firebase Timestamps
const parseDate = (val: any): Date | null => {
  if (!val) return null;
  // Firebase Timestamp object check
  if (typeof val === "object" && "seconds" in val) {
    if (typeof val.toDate === "function") return val.toDate();
    return new Date(val.seconds * 1000);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

interface ExportClientHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string; // If undefined, we allow exporting all or selecting a specific one
}

export function ExportClientHistoryDialog({ isOpen, onClose, clientId }: ExportClientHistoryDialogProps) {
  const companyId = useCompanyId();
  const [loading, setLoading] = useState(false);
  const [fetchingClients, setFetchingClients] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [exportType, setExportType] = useState<"clients" | "history">("clients");

  // State for selecting a specific client if the dialog was opened from the main list
  const [allAvailableClients, setAllAvailableClients] = useState<(Client & { id: string })[]>([]);
  const [selectedClientDropdown, setSelectedClientDropdown] = useState<string>("all");

  // Fetch clients for dropdown if no fixed clientId is provided
  useEffect(() => {
    if (isOpen && !clientId && companyId) {
      setFetchingClients(true);
      listDocuments<Client>(companyId, "clients")
        .then(data => setAllAvailableClients(data))
        .catch(err => console.error("Error fetching clients for dropdown:", err))
        .finally(() => setFetchingClients(false));
    }

    // Reset dropdown state when dialog opens
    if (isOpen) {
      setSelectedClientDropdown("all");
    }
  }, [isOpen, clientId, companyId]);

  const handleExport = async () => {
    if (!companyId) return;
    setLoading(true);

    try {
      // 1. Fetch Data
      const [allClients, allAssignments, allAttendanceRecords] = await Promise.all([
        listDocuments<Client>(companyId, "clients"),
        listDocuments<ClientStaffAssignment>(companyId, "clientStaffAssignments"),
        listDocuments<AttendanceRecord>(companyId, "attendanceRecords")
      ]);

      // 2. Determine target client(s)
      let targetClientId: string | null = null;
      if (clientId) {
        targetClientId = clientId; // Pre-selected from details page
      } else if (selectedClientDropdown !== "all") {
        targetClientId = selectedClientDropdown; // Selected from dropdown
      }

      // Filter Clients
      const targetClients = targetClientId
        ? allClients.filter(c => (c as any).id === targetClientId)
        : allClients;

      const clientMap = new Map<string, Client & { id: string }>();
      targetClients.forEach(c => clientMap.set((c as any).id, c as any));

      if (exportType === "clients") {
        const clientsExcelData = targetClients.map(client => ({
          "Client ID": (client as any).id,
          "Name": client.name,
          "Company": client.company || "N/A",
          "Email": client.email || "N/A",
          "Phone": client.phone || "N/A",
          "Address": client.address || "N/A",
          "NOK Name": client.nokName || "N/A",
          "Vendor Name": client.vendorName || "N/A",
          "Staff Name": client.staffName || "N/A",
          "Number": client.number || "N/A",
          "Duty Start Date": client.dutyStartDate ? format(parseDate(client.dutyStartDate) || new Date(client.dutyStartDate), "MMM dd, yyyy") : "N/A",
          "Duty End Date": client.dutyEndDate ? format(parseDate(client.dutyEndDate) || new Date(client.dutyEndDate), "MMM dd, yyyy") : "N/A",
          "Staff Type": client.staffType || "N/A",
          "Status": client.status,
          "Notes": client.notes || "N/A",
          "Created At": client.createdAt ? format(parseDate(client.createdAt) || new Date(), "MMM dd, yyyy") : "N/A",
        }));

        if (clientsExcelData.length === 0) {
          alert("No clients found for the selected criteria.");
          setLoading(false);
          return;
        }

        const worksheet = XLSX.utils.json_to_sheet(clientsExcelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
        worksheet["!cols"] = [
          { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 30 }, { wch: 15 }
        ];

        const dateStr = format(new Date(), "yyyy-MM-dd");
        const filename = targetClientId
          ? `Client_Details_${targetClients[0]?.name.replace(/\s+/g, '_')}_${dateStr}.xlsx`
          : `All_Clients_List_${dateStr}.xlsx`;

        XLSX.writeFile(workbook, filename);
        onClose();
        return;
      }

      // 3. Filter Assignments based on Target Clients and Date Range
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      // If we have an end date, we should include the whole day (up to 23:59:59)
      if (end) {
        end.setHours(23, 59, 59, 999);
      }

      const relevantAssignments = allAssignments.filter(assignment => {
        // Must belong to a target client
        if (!clientMap.has(assignment.clientId)) return false;

        // Check date range using assignedAt
        const assignedDate = parseDate(assignment.assignedAt);
        if (assignedDate) {
          if (start && isBefore(assignedDate, start)) return false;
          if (end && isAfter(assignedDate, end)) return false;
        }

        return true;
      });

      // 4. Calculate total changes per client
      const clientChangeCounts = new Map<string, number>();
      relevantAssignments.forEach(a => {
        clientChangeCounts.set(a.clientId, (clientChangeCounts.get(a.clientId) || 0) + 1);
      });

      // 5. Format Rows for Excel
      // Sort first by Client ID, then by assignedAt so history is grouped properly
      const sortedAssignments = relevantAssignments.sort((a, b) => {
        if (a.clientId !== b.clientId) return a.clientId.localeCompare(b.clientId);
        const dateA = parseDate(a.assignedAt);
        const dateB = parseDate(b.assignedAt);
        const timeA = dateA ? dateA.getTime() : 0;
        const timeB = dateB ? dateB.getTime() : 0;
        return timeA - timeB;
      });

      let lastSeenClientId = "";

      const excelData = sortedAssignments.map((assignment) => {
        const client = clientMap.get(assignment.clientId);

        // Check if this is the first row we are rendering for this client
        const isFirstForClient = lastSeenClientId !== assignment.clientId;
        lastSeenClientId = assignment.clientId;

        let formattedAssignedAt = "N/A";
        let formattedUnassignedAt = "Active";

        let assignmentStart: Date | null = null;
        let assignmentEnd: Date | null = null;

        try {
          const parsedAssigned = parseDate(assignment.assignedAt);
          if (parsedAssigned) {
            assignmentStart = parsedAssigned;
            formattedAssignedAt = format(assignmentStart, "MMM dd, yyyy h:mm a");
          }
          const parsedUnassigned = parseDate(assignment.unassignedAt);
          if (parsedUnassigned) {
            assignmentEnd = parsedUnassigned;
            formattedUnassignedAt = format(assignmentEnd, "MMM dd, yyyy h:mm a");
          } else {
            assignmentEnd = new Date(); // If active, consider up to today
          }
        } catch (e) {
          console.error("Date formatting error", e);
        }

        // Calculate attendance summary for this staff member during this assignment
        let presentDays = 0;
        let absentDays = 0;
        let lateDays = 0;
        let leaveDays = 0;

        if (assignment.employeeId && assignmentStart && assignmentEnd) {
          const staffAttendance = allAttendanceRecords.filter(record =>
            record.employeeId === assignment.employeeId
          );

          // Normalize start and end times to properly compare date strings
          const startTimestamp = assignmentStart.getTime();
          // Set end of day for the end timestamp so we include the whole day
          const endTimestamp = new Date(assignmentEnd).setHours(23, 59, 59, 999);

          staffAttendance.forEach(record => {
            const parsedRecordDate = parseDate(record.date);
            if (!parsedRecordDate) return;
            const recordDate = parsedRecordDate.getTime();
            // Check if attendance date falls within the assignment period
            if (recordDate >= startTimestamp && recordDate <= endTimestamp) {
              if (record.status === "present") presentDays++;
              else if (record.status === "absent") absentDays++;
              else if (record.status === "late") lateDays++;
              else if (record.status === "on_leave") leaveDays++;
            }
          });
        }

        // Return client details ONLY on the first row to avoid repetition
        return {
          "Client ID": isFirstForClient ? assignment.clientId : "",
          "Client Name": isFirstForClient ? (client?.name || "Unknown") : "",
          "Total Staff Changes (in range)": isFirstForClient ? (clientChangeCounts.get(assignment.clientId) || 0) : "",
          "Staff Name": assignment.employeeName || "Unknown",
          "Assigned Date & Time": formattedAssignedAt,
          "Unassigned Date & Time": formattedUnassignedAt,
          "Present Days": presentDays,
          "Absent Days": absentDays,
          "Late Days": lateDays,
          "Leave Days": leaveDays,
          "Status": assignment.status
        };
      });

      if (excelData.length === 0) {
        alert("No assignments found for the selected criteria.");
        setLoading(false);
        return;
      }

      // 6. Generate Excel File
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Staff History");

      // Auto-size columns slightly
      const colWidths = [
        { wch: 25 }, // Client ID
        { wch: 20 }, // Client Name
        { wch: 25 }, // Total Changes
        { wch: 20 }, // Staff Name
        { wch: 25 }, // Assigned
        { wch: 25 }, // Unassigned
        { wch: 15 }, // Present Days
        { wch: 15 }, // Absent Days
        { wch: 15 }, // Late Days
        { wch: 15 }, // Leave Days
        { wch: 15 }, // Status
      ];
      worksheet["!cols"] = colWidths;

      // Create filename
      const dateStr = format(new Date(), "yyyy-MM-dd");
      const clientName = targetClients[0]?.name || "Unknown";
      const filename = targetClientId
        ? `Client_Staff_History_${clientName.replace(/\s+/g, '_')}_${dateStr}.xlsx`
        : `All_Clients_Staff_History_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, filename);
      onClose();
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Download client details or staff assignment history.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="space-y-3">
            <Label>Export Type</Label>
            <RadioGroup value={exportType} onValueChange={(v: any) => setExportType(v)} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="clients" id="export-clients" />
                <Label htmlFor="export-clients" className="font-normal cursor-pointer">Clients List</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="history" id="export-history" />
                <Label htmlFor="export-history" className="font-normal cursor-pointer">Staff Assignment History</Label>
              </div>
            </RadioGroup>
          </div>

          {!clientId && (
            <div className="space-y-2">
              <Label>Select Client</Label>
              <Select
                value={selectedClientDropdown}
                onValueChange={setSelectedClientDropdown}
                disabled={fetchingClients}
              >
                <SelectTrigger>
                  <SelectValue placeholder={fetchingClients ? "Loading clients..." : "Select a client..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {allAvailableClients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {exportType === "history" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date (Optional)</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Leave dates empty to export the entire history.
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading} className="gap-2">
            <Download className="h-4 w-4" />
            {loading ? "Exporting..." : "Download Excel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
