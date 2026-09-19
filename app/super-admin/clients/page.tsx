"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments, createDocument, deleteDocument, updateDocument } from "@/lib/firebase/firestore";
import type { Client } from "@/lib/schemas/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Pencil, Trash2, Building, Search, Phone, Mail, ArrowRight, Download } from "lucide-react";
import Link from "next/link";
import { ClientDialog } from "./components/client-dialog";
import { ExportClientHistoryDialog } from "@/components/shared/export-client-history-dialog";

export default function ClientsPage() {
  const companyId = useCompanyId();
  const [clients, setClients] = useState<(Client & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [showDialog, setShowDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<(Client & { id: string }) | null>(null);

  async function fetchClients() {
    try {
      const data = await listDocuments<Client>(companyId, "clients");
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClients();
  }, [companyId]);

  const handleSave = async (clientData: Partial<Client>) => {
    if (!clientData.name) return;
    try {
      if (editingClient) {
        await updateDocument(companyId, "clients", editingClient.id, {
          ...clientData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await createDocument(companyId, "clients", {
          ...clientData,
          status: clientData.status || "active",
          companyId: companyId,
          createdAt: new Date().toISOString()
        });
      }
      setShowDialog(false);
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      console.error("Error saving client", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this client?")) {
      try {
        await deleteDocument(companyId, "clients", id);
        fetchClients();
      } catch (error) {
        console.error("Error deleting client", error);
      }
    }
  };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {loading ? "Loading..." : `${clients.length} clients configured`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
          <Button size="sm" onClick={() => {
            setEditingClient(null);
            setShowDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <Input placeholder="Search clients by name or company..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />}
          title="No clients found"
          description="Create your first client to start assigning staff."
          action={{ label: "Add Client", onClick: () => setShowDialog(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Card key={client.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[hsl(var(--primary)/0.1)]">
                    <Building className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => {
                      setEditingClient(client);
                      setShowDialog(true);
                    }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-[hsl(var(--destructive))]" onClick={() => handleDelete(client.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-base">{client.name}</h3>
                {client.company && <p className="text-sm font-medium text-[hsl(var(--primary))] mt-0.5">{client.company}</p>}
                
                <div className="mt-3 space-y-2 flex-1">
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[hsl(var(--border)/0.5)]">
                  <Badge variant={client.status === "active" ? "success" : "secondary"} className="text-xs">
                    {client.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                  
                  <Link href={`/super-admin/clients/${client.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Manage Staff <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && clients.length > 0 && (
             <div className="col-span-full text-center p-8 text-[hsl(var(--muted-foreground))]">
                No clients match your search.
             </div>
          )}
        </div>
      )}

      {showDialog && (
        <ClientDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          onSave={handleSave}
          initialData={editingClient}
        />
      )}

      <ExportClientHistoryDialog 
        isOpen={showExportDialog} 
        onClose={() => setShowExportDialog(false)} 
      />
    </div>
  );
}
