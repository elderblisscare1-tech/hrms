"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { collection, query, orderBy, onSnapshot, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function LeadsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "duty_applications"), orderBy("appliedAt", "desc"));
    
    const unsub = onSnapshot(q, async (snapshot) => {
      // For each application, optionally fetch duty title if we want, but doing it fast here:
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Let's also fetch the duty titles
      const updatedApps = await Promise.all(
        apps.map(async (app) => {
          if (app.dutyId) {
            try {
              const dutyDoc = await getDoc(doc(db, "duties", app.dutyId));
              if (dutyDoc.exists()) {
                return { ...app, dutyTitle: dutyDoc.data().title };
              }
            } catch (e) {
              console.error(e);
            }
          }
          return { ...app, dutyTitle: "Unknown Duty" };
        })
      );

      setApplications(updatedApps);
      setLoading(false);
    });
    
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (applicationId: string, status: string) => {
    try {
      const res = await fetch("/api/duties/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to update status");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating status");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Duty Leads</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Duty Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No applications found yet.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Duty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied At</TableHead>
                    <TableHead>Aadhar Photos</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.applicantName}</TableCell>
                      <TableCell>{app.applicantPhone}</TableCell>
                      <TableCell>{app.dutyTitle || app.dutyId}</TableCell>
                      <TableCell>
                        <Badge variant={app.status === "pending" ? "outline" : "default"} className="capitalize">
                          {app.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.appliedAt?.toDate?.()?.toLocaleString() ?? "Just now"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {app.aadharFront && (
                            <a href={app.aadharFront} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">
                              Front
                            </a>
                          )}
                          {app.aadharBack && (
                            <a href={app.aadharBack} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">
                              Back
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.status === "pending" && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 h-8 px-2"
                              onClick={() => handleUpdateStatus(app.id, "approved")}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-8 px-2"
                              onClick={() => handleUpdateStatus(app.id, "rejected")}
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                        {app.status !== "pending" && (
                          <span className="text-muted-foreground text-sm">Reviewed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
