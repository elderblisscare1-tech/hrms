"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createDocument } from "@/lib/firebase/firestore";
import type { PerformanceReview } from "@/lib/schemas/performance";
import type { Employee } from "@/lib/schemas/employee";
import { useAuth } from "@/lib/auth/auth-context";

interface CreateReviewDialogProps {
  companyId: string;
  employees: (Employee & { id: string })[];
  onReviewCreated: () => void;
  trigger?: React.ReactNode;
}

export function CreateReviewDialog({ companyId, employees, onReviewCreated, trigger }: CreateReviewDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [employeeId, setEmployeeId] = useState("");
  const [reviewCycle, setReviewCycle] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [goals, setGoals] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !reviewCycle || !feedback) return;

    setLoading(true);
    try {
      const newReview: PerformanceReview = {
        employeeId,
        reviewerId: user?.uid || "admin",
        reviewCycle,
        rating: rating > 0 ? rating : undefined,
        feedback,
        goals: goals.split("\n").map(g => g.trim()).filter(Boolean),
        status: "submitted",
        companyId,
      };

      await createDocument(companyId, "performanceReviews", newReview);
      setOpen(false);
      onReviewCreated();
      // Reset
      setEmployeeId("");
      setReviewCycle("");
      setRating(0);
      setFeedback("");
      setGoals("");
    } catch (error) {
      console.error("Error creating review", error);
      alert("Failed to create review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Performance Review</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Employee</label>
            <select
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Review Cycle</label>
            <Input required placeholder="e.g. Q3 2026, Annual 2026" value={reviewCycle} onChange={(e) => setReviewCycle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating (1-5)</label>
            <Input type="number" min="1" max="5" placeholder="Optional" value={rating || ""} onChange={(e) => setRating(parseInt(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Feedback</label>
            <Textarea required placeholder="Enter performance feedback..." className="min-h-[100px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Goals (One per line)</label>
            <Textarea placeholder="Goal 1&#10;Goal 2..." className="min-h-[100px]" value={goals} onChange={(e) => setGoals(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Submit Review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
