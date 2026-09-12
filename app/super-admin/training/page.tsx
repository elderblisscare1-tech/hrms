"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments } from "@/lib/firebase/firestore";
import type { Training } from "@/lib/schemas/training";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { GraduationCap, Plus, Users, Clock } from "lucide-react";

export default function TrainingPage() {
  const companyId = useCompanyId();
  const [trainings, setTrainings] = useState<(Training & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await listDocuments<Training>(companyId, "trainings");
        setTrainings(data);
      } catch (error) {
        console.error("Error fetching training data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [companyId]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Training & Development</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage employee upskilling</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Course</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
          </div>
        ) : trainings.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={<GraduationCap className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />}
              title="No training programs"
              description="Create a training course for your employees."
              action={{ label: "Add Course", onClick: () => {} }}
            />
          </div>
        ) : (
          trainings.map((course) => (
            <Card key={course.id} className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-[hsl(var(--primary)/0.1)] rounded-xl">
                    <GraduationCap className="h-6 w-6 text-[hsl(var(--primary))]" />
                  </div>
                  <Badge variant={course.status === "active" ? "success" : "secondary"}>
                    {course.status}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg">{course.title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">{course.description}</p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[hsl(var(--border)/0.5)]">
                  <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    <Clock className="h-3.5 w-3.5" /> {course.durationHours}h
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    <Users className="h-3.5 w-3.5" /> Capacity: {course.capacity || "Unlimited"}
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">Manage Enrollments</Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
