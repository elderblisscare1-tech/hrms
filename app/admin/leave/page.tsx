"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments, updateDocument, deleteDocument } from "@/lib/firebase/firestore";
import type { LeaveRequest } from "@/lib/schemas/leave";
import type { Employee } from "@/lib/schemas/employee";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarOff, Plus, CheckCircle2, Clock, XCircle, Calendar, Edit2, Trash2 } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "warning" | "success" | "error"; icon: React.ElementType }> = {
  pending: { label: "Pending", variant: "warning", icon: Clock },
  approved: { label: "Approved", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "error", icon: XCircle },
  cancelled: { label: "Cancelled", variant: "error", icon: XCircle },
};

export default function LeavePage() {
  const companyId = useCompanyId();
  const [leaveRequests, setLeaveRequests] = useState<(LeaveRequest & { id: string })[]>([]);
  const [employees, setEmployees] = useState<(Employee & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLeave, setEditingLeave] = useState<(LeaveRequest & { id: string }) | null>(null);
  const [editForm, setEditForm] = useState({
    type: "",
    startDate: "",
    endDate: "",
    days: 0,
    reason: "",
    status: ""
  });

  async function fetchData() {
    try {
      const [leaveData, empData] = await Promise.all([
        listDocuments<LeaveRequest>(companyId, "leaveRequests"),
        listDocuments<Employee>(companyId, "employees")
      ]);
      // Sort by newest first (assuming createdAt exists or sorting by date)
      leaveData.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setLeaveRequests(leaveData);
      setEmployees(empData);
    } catch (error) {
      console.error("Error fetching leave data", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const handleUpdateStatus = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      await updateDocument(companyId, "leaveRequests", id, { status: newStatus });
      fetchData(); // refresh list
    } catch (error) {
      console.error("Error updating leave status", error);
    }
  };

  const handleEditClick = (req: LeaveRequest & { id: string }) => {
    setEditingLeave(req);
    setEditForm({
      type: req.type,
      startDate: req.startDate,
      endDate: req.endDate,
      days: req.days,
      reason: req.reason,
      status: req.status
    });
  };

  const handleUpdateLeave = async () => {
    if (!editingLeave) return;
    try {
      await updateDocument(companyId, "leaveRequests", editingLeave.id, editForm);
      setEditingLeave(null);
      fetchData();
    } catch (error) {
      console.error("Error updating leave", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this leave request?")) return;
    try {
      await deleteDocument(companyId, "leaveRequests", id);
      fetchData();
    } catch (error) {
      console.error("Error deleting leave", error);
    }
  };

  const pendingCount = leaveRequests.filter(r => r.status === "pending").length;
  const approvedCount = leaveRequests.filter(r => r.status === "approved").length;
  const rejectedCount = leaveRequests.filter(r => r.status === "rejected").length;
  const totalCount = leaveRequests.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage leave requests and policies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Calendar className="h-4 w-4 mr-2" />Holiday Calendar</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-2" />Configure Leave Types</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: pendingCount, color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning)/0.08)]" },
          { label: "Approved", value: approvedCount, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success)/0.08)]" },
          { label: "Rejected", value: rejectedCount, color: "text-[hsl(var(--destructive))]", bg: "bg-[hsl(var(--destructive)/0.08)]" },
          { label: "Total Requests", value: totalCount, color: "text-[hsl(var(--primary))]", bg: "bg-[hsl(var(--primary)/0.08)]" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className={`p-4 text-center ${s.bg} rounded-xl`}>
              <p className={`text-2xl font-bold ${s.color}`}>{loading ? "..." : s.value}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>Recent leave applications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
          ) : leaveRequests.length === 0 ? (
            <EmptyState
              icon={<CalendarOff className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />}
              title="No leave requests"
              description="There are no leave requests to display."
              action={{ label: "View Policies", onClick: () => {} }}
            />
          ) : (
            <div className="space-y-3">
              {leaveRequests.map((req) => {
                const config = statusConfig[req.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const emp = employees.find(e => e.id === req.employeeId);
                const empName = emp ? `${emp.firstName} ${emp.lastName}` : "Unknown Employee";

                return (
                  <div key={req.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[hsl(var(--secondary)/0.5)] transition-colors group">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs">{empName.split(" ").map(n => n[0]).join("").substring(0,2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{empName}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">{req.type.replace("_", " ")} · {req.startDate} to {req.endDate} ({req.days} days)</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 italic">{req.reason}</p>
                    </div>
                    <Badge variant={config.variant} className="gap-1"><StatusIcon className="h-3 w-3" />{config.label}</Badge>
                    {req.status === "pending" && (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="success" className="h-7 text-xs" onClick={() => handleUpdateStatus(req.id, "approved")}>Approve</Button>
                        <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleUpdateStatus(req.id, "rejected")}>Reject</Button>
                      </div>
                    )}
                    {req.status !== "pending" && (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]" onClick={() => handleEditClick(req)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]" onClick={() => handleDelete(req.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {req.status === "pending" && (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]" onClick={() => handleEditClick(req)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]" onClick={() => handleDelete(req.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingLeave} onOpenChange={(open) => !open && setEditingLeave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Leave Request</DialogTitle>
            <DialogDescription>Make changes to the leave request below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editForm.type}
                onChange={(e) => setEditForm({...editForm, type: e.target.value})}
              >
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="annual">Annual Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={editForm.startDate} onChange={(e) => setEditForm({...editForm, startDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={editForm.endDate} onChange={(e) => setEditForm({...editForm, endDate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Days</Label>
                <Input type="number" value={editForm.days} onChange={(e) => setEditForm({...editForm, days: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={editForm.reason} onChange={(e) => setEditForm({...editForm, reason: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLeave(null)}>Cancel</Button>
            <Button onClick={handleUpdateLeave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
