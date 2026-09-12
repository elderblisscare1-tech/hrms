"use client";

import React, { useState, useEffect } from "react";
import { useRequireAuth } from "@/lib/auth/auth-context";
import { listDocuments } from "@/lib/firebase/firestore";
import type { LeaveRequest } from "@/lib/schemas/leave";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarOff, CalendarClock, CheckCircle2, XCircle, Clock, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function EmployeeLeavePage() {
  const { claims } = useRequireAuth();
  const [leaves, setLeaves] = useState<(LeaveRequest & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaveBalance, setLeaveBalance] = useState({ casual: 4, earned: 8, total: 12 });
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    type: "casual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const fetchLeaves = async () => {
    if (!claims?.companyId || !claims?.employeeId) return;
    try {
      const allLeaves = await listDocuments<LeaveRequest>(claims.companyId, "leaveRequests");
      const myLeaves = allLeaves.filter(l => l.employeeId === claims.employeeId);
      
      // Sort by date descending
      myLeaves.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setLeaves(myLeaves);

      // Simple mock balance calculation
      const used = myLeaves.filter(l => l.status === "approved").reduce((acc, curr) => acc + curr.days, 0);
      setLeaveBalance({ casual: 4, earned: Math.max(8 - used, 0), total: 12 - used });
    } catch (err) {
      console.error("Error fetching leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (claims) fetchLeaves();
  }, [claims]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claims?.companyId || !claims?.employeeId) return;
    setIsSubmitting(true);
    
    try {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
      
      // Dynamically import createDocument
      const { createDocument } = await import("@/lib/firebase/firestore");
      
      await createDocument(claims.companyId, "leaveRequests", {
        employeeId: claims.employeeId,
        companyId: claims.companyId,
        type: formData.type as any,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        days: diffDays,
        status: "pending",
      });
      
      setIsApplyOpen(false);
      setFormData({ type: "casual", startDate: "", endDate: "", reason: "" });
      fetchLeaves();
    } catch (error) {
      console.error("Error applying for leave:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.2)] border-none">Approved</Badge>;
      case "pending": return <Badge className="bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)/0.2)] border-none">Pending</Badge>;
      case "rejected": return <Badge className="bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.2)] border-none">Rejected</Badge>;
      default: return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />;
      case "pending": return <Clock className="h-5 w-5 text-[hsl(var(--warning))]" />;
      case "rejected": return <XCircle className="h-5 w-5 text-[hsl(var(--destructive))]" />;
      default: return <CalendarClock className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Tracking</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage and track your time off</p>
        </div>
        
        <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" /> Apply Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleApply} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Leave Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="annual">Annual Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input 
                    type="date" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input 
                    type="date" 
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <Textarea 
                  placeholder="Why are you taking leave?" 
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="gradient-brand text-white border-none shadow-md">
          <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full">
             <p className="text-xs text-white/70 mb-1">Total Balance</p>
             <p className="text-3xl font-bold">{leaveBalance.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full">
             <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Casual</p>
             <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{leaveBalance.casual}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full">
             <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Earned</p>
             <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{leaveBalance.earned}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Leave History</h2>
        {leaves.length === 0 ? (
           <EmptyState
            icon={<CalendarOff className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />}
            title="No Leave History"
            description="You haven't requested any leaves yet."
          />
        ) : (
          <div className="space-y-3">
            {leaves.map((leave) => (
              <Card key={leave.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-[hsl(var(--secondary))]">
                      {getStatusIcon(leave.status)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm capitalize">{leave.type} Leave</h3>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {leave.startDate} to {leave.endDate} • {leave.days} day{leave.days > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(leave.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
