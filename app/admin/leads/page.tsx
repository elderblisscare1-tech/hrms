"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments, createDocument, updateDocument, deleteDocument } from "@/lib/firebase/firestore";
import type { Lead } from "@/lib/schemas/lead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Download, Edit, Trash2, Calendar, Search } from "lucide-react";
import * as xlsx from "xlsx";

export default function LeadsPage() {
  const companyId = useCompanyId();
  const [leads, setLeads] = useState<(Lead & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editLeadId, setEditLeadId] = useState<string | null>(null);

  // Selection State
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: "",
    email: "",
    phone: "",
    source: "",
    status: "new",
    notes: "",
    date: new Date().toISOString().split("T")[0]
  });

  // Filter State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLeads = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await listDocuments<Lead>(companyId, "leads");
      // Sort by date descending
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLeads(data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [companyId]);

  const handleSaveLead = async () => {
    if (!companyId) return;
    try {
      if (editLeadId) {
        await updateDocument(companyId, "leads", editLeadId, formData);
      } else {
        await createDocument(companyId, "leads", { ...formData, companyId });
      }
      setIsDialogOpen(false);
      fetchLeads();
      resetForm();
    } catch (error) {
      console.error("Error saving lead:", error);
      alert("Failed to save lead.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!companyId) return;
    if (confirm("Are you sure you want to delete this lead?")) {
      try {
        await deleteDocument(companyId, "leads", id);
        fetchLeads();
      } catch (error) {
        console.error("Error deleting lead:", error);
        alert("Failed to delete lead.");
      }
    }
  };

  const resetForm = () => {
    setEditLeadId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      source: "",
      status: "new",
      notes: "",
      date: new Date().toISOString().split("T")[0]
    });
  };

  const openEditDialog = (lead: Lead & { id: string }) => {
    setEditLeadId(lead.id);
    setFormData(lead);
    setIsDialogOpen(true);
  };

  const handleExportExcel = () => {
    const leadsToExport = selectedLeads.length > 0
      ? filteredLeads.filter(l => selectedLeads.includes(l.id))
      : filteredLeads;

    const ws = xlsx.utils.json_to_sheet(leadsToExport.map(l => ({
      Name: l.name,
      Email: l.email || "",
      Phone: l.phone,
      Source: l.source,
      Status: l.status.toUpperCase(),
      Notes: l.notes || "",
      Date: l.date
    })));
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Leads");
    xlsx.writeFile(wb, "leads_export.xlsx");
  };

  const filteredLeads = leads.filter(lead => {
    if (startDate && new Date(lead.date) < new Date(startDate)) return false;
    if (endDate && new Date(lead.date) > new Date(endDate)) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads Management</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage and export your leads</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportExcel} disabled={filteredLeads.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Export to Excel
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editLeadId ? "Edit Lead" : "Add New Lead"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Lead Name" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Email (Optional)</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email Address" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone Number" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Source</label>
                  <Input value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} placeholder="e.g. Website, Referral, Facebook" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Status</label>
                  <select className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                    value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <Textarea value={formData.notes || ""} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Add any notes here..." rows={3} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <Button onClick={handleSaveLead} className="mt-2">
                  Save Lead
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <span className="text-sm font-medium">Filter by Date:</span>
            </div>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-auto" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">to</span>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-auto" />
            {(startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); }}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center p-8 text-[hsl(var(--muted-foreground))]">
              No leads found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))]">
                    <th className="w-10 p-3">
                      <input
                        type="checkbox"
                        className="rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                        checked={filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads(filteredLeads.map(l => l.id));
                          } else {
                            setSelectedLeads([]);
                          }
                        }}
                      />
                    </th>
                    <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-3">Name</th>
                    <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-3">Contact</th>
                    <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-3">Source</th>
                    <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-3">Status</th>
                    <th className="text-left font-semibold text-[hsl(var(--muted-foreground))] p-3">Date</th>
                    <th className="text-right font-semibold text-[hsl(var(--muted-foreground))] p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map(lead => (
                    <tr key={lead.id} className="border-b border-[hsl(var(--border)/0.5)]">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          className="rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeads([...selectedLeads, lead.id]);
                            } else {
                              setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                            }
                          }}
                        />
                      </td>
                      <td className="p-3 font-medium">{lead.name}</td>
                      <td className="p-3">
                        <div className="text-xs">{lead.email || "No Email"}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{lead.phone}</div>
                      </td>
                      <td className="p-3">{lead.source}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3 text-[hsl(var(--muted-foreground))]">{lead.date}</td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(lead)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(lead.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
