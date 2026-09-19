"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments, createDocument, updateDocument } from "@/lib/firebase/firestore";
import type { Employee } from "@/lib/schemas/employee";
import type { ClientStaffAssignment } from "@/lib/schemas/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AssignStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  activeAssignment?: ClientStaffAssignment & { id: string };
  onComplete: () => void;
}

export function AssignStaffDialog({ isOpen, onClose, clientId, activeAssignment, onComplete }: AssignStaffDialogProps) {
  const companyId = useCompanyId();
  const [employees, setEmployees] = useState<(Employee & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [assignmentDate, setAssignmentDate] = useState<string>("");

  useEffect(() => {
    async function fetchEmployees() {
      if (!companyId) return;
      try {
        const data = await listDocuments<Employee>(companyId, "employees");
        setEmployees(data.filter(e => e.employmentStatus !== "resigned" && e.employmentStatus !== "terminated"));
      } catch (error) {
        console.error("Error fetching employees", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, [companyId]);

  const handleSave = async () => {
    if (!selectedEmployeeId || !companyId) return;
    setSaving(true);
    
    try {
      const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
      const employeeName = selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : "Unknown";
      
      const finalDate = assignmentDate ? new Date(assignmentDate).toISOString() : new Date().toISOString();

      // If there's an active assignment and it's not the same employee
      if (activeAssignment && activeAssignment.employeeId !== selectedEmployeeId) {
        await updateDocument(companyId, "clientStaffAssignments", activeAssignment.id, {
          status: "completed",
          unassignedAt: finalDate
        });
      }

      // If we're not just re-assigning the same person
      if (!activeAssignment || activeAssignment.employeeId !== selectedEmployeeId) {
        await createDocument(companyId, "clientStaffAssignments", {
          clientId,
          employeeId: selectedEmployeeId,
          employeeName,
          status: "active",
          assignedAt: finalDate,
          companyId
        });
      }

      onComplete();
    } catch (error) {
      console.error("Error assigning staff", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{activeAssignment ? "Change Assigned Staff" : "Assign Staff"}</DialogTitle>
          <DialogDescription>
            Select an employee to handle this client. 
            {activeAssignment && " The current assignment will be ended and logged in the history."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Select Employee</Label>
            <Select 
              value={selectedEmployeeId} 
              onValueChange={setSelectedEmployeeId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading employees..." : "Select an employee..."} />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Assignment Date & Time (Optional)</Label>
            <Input 
              type="datetime-local" 
              value={assignmentDate} 
              onChange={(e) => setAssignmentDate(e.target.value)} 
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Leave blank to use the current date and time.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={!selectedEmployeeId || saving || (activeAssignment?.employeeId === selectedEmployeeId)}>
            {saving ? "Saving..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
