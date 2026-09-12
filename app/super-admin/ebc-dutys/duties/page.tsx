"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { collection, query, orderBy, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

interface Duty {
  id: string;
  title?: string;
  location?: string;
  date?: string | number;
  date?: string | number;
  categoryId?: string;
  categoryName?: string;
  status?: string;
  [key: string]: unknown;
}

const ApplicationsDialog = ({ dutyId, dutyTitle }: { dutyId: string, dutyTitle: string }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "duty_applications"), where("dutyId", "==", dutyId));
    const unsub = onSnapshot(q, (snapshot) => {
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [dutyId]);

  return (
    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Applications for {dutyTitle}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-4">
        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
        ) : applications.length === 0 ? (
          <div className="text-center text-muted-foreground">No applications found.</div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app.id} className="p-4 border rounded-lg flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-lg">{app.applicantName}</p>
                  <p className="text-sm font-medium">{app.applicantPhone}</p>
                  <p className="text-xs text-muted-foreground mt-2">Applied on: {app.appliedAt?.toDate?.()?.toLocaleString() ?? 'Just now'}</p>
                </div>
                <div className="flex gap-2">
                  {app.aadharFront && (
                    <div className="text-center">
                      <p className="text-xs mb-1 font-medium">Aadhar Front</p>
                      <a href={app.aadharFront} target="_blank" rel="noreferrer">
                        <img src={app.aadharFront} alt="Aadhar Front" className="h-20 w-32 object-cover rounded border hover:opacity-80 transition-opacity" />
                      </a>
                    </div>
                  )}
                  {app.aadharBack && (
                    <div className="text-center">
                      <p className="text-xs mb-1 font-medium">Aadhar Back</p>
                      <a href={app.aadharBack} target="_blank" rel="noreferrer">
                        <img src={app.aadharBack} alt="Aadhar Back" className="h-20 w-32 object-cover rounded border hover:opacity-80 transition-opacity" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DialogContent>
  );
};

export default function EbcDutysPage() {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDuty, setNewDuty] = useState({ title: "", description: "", location: "", categoryId: "", isPremium: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch categories for the dropdown
    const qCat = query(collection(db, "duty_categories"), orderBy("createdAt", "asc"));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });
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

    return () => {
      unsubscribe();
      unsubCat();
    };
  }, []);

  const handleAddDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDuty.title || !newDuty.categoryId) return;
    try {
      setSaving(true);
      const categoryName = categories.find(c => c.id === newDuty.categoryId)?.name || "";
      await addDoc(collection(db, "duties"), {
        title: newDuty.title,
        description: newDuty.description,
        location: newDuty.location,
        categoryId: newDuty.categoryId,
        categoryName,
        isPremium: newDuty.isPremium,
        status: "open",
        createdAt: serverTimestamp(),
        date: Date.now(),
      });
      setIsAddOpen(false);
      setNewDuty({ title: "", description: "", location: "", categoryId: "", isPremium: false });
    } catch (error) {
      console.error("Error adding duty:", error);
      alert("Failed to add duty");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDuty = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this duty? This action cannot be undone.")) return;
    
    try {
      await deleteDoc(doc(db, "duties", id));
    } catch (error) {
      console.error("Error deleting duty:", error);
      alert("Failed to delete duty");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">EBC Dutys Management</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add New Duty
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Duty</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddDuty} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Duty Title</Label>
                <Input required value={newDuty.title} onChange={e => setNewDuty({...newDuty, title: e.target.value})} placeholder="e.g. Night Care" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={newDuty.location} onChange={e => setNewDuty({...newDuty, location: e.target.value})} placeholder="e.g. Apollo Hospital" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={newDuty.description} onChange={e => setNewDuty({...newDuty, description: e.target.value})} placeholder="e.g. Duty requirements and details" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newDuty.categoryId} onValueChange={v => setNewDuty({...newDuty, categoryId: v})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="isPremium" 
                  checked={newDuty.isPremium} 
                  onCheckedChange={(checked) => setNewDuty({...newDuty, isPremium: checked === true})}
                />
                <Label htmlFor="isPremium">Mark as Premium Duty</Label>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Duty"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duties.map((duty) => (
                    <TableRow key={duty.id}>
                      <TableCell className="font-medium">{duty.title}</TableCell>
                      <TableCell>{duty.location || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {duty.categoryName || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={duty.status === 'open' ? 'default' : 'outline'}>
                          {duty.status?.toUpperCase() || 'OPEN'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              View Applications
                            </Button>
                          </DialogTrigger>
                          <ApplicationsDialog dutyId={duty.id} dutyTitle={duty.title || 'Duty'} />
                        </Dialog>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteDuty(duty.id)}>
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
