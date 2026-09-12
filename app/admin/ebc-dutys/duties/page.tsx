"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

interface Duty {
  id: string;
  title?: string;
  location?: string;
  date?: string | number;
  isPremium?: boolean;
  status?: string;
  [key: string]: unknown;
}

export default function EbcDutysAdminPage() {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch duties directly from Firestore for the admin panel
    const q = query(collection(db, "duties"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDuties(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching duties:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">EBC Dutys Management</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New Duty
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Duties</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : duties.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No duties found. Create one to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duties.map((duty) => (
                    <TableRow key={duty.id}>
                      <TableCell className="font-medium">{duty.title}</TableCell>
                      <TableCell>{duty.location}</TableCell>
                      <TableCell>
                        {duty.date ? new Date(duty.date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={duty.isPremium ? "default" : "secondary"}>
                          {duty.isPremium ? "Premium" : "Regular"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={duty.status === 'open' ? 'default' : 'outline'}>
                          {duty.status?.toUpperCase() || 'OPEN'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
