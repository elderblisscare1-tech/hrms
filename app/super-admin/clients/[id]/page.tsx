"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCompanyId } from "@/lib/auth/auth-context";
import { getDocument, listDocuments, updateDocument } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import type { Client, ClientStaffAssignment } from "@/lib/schemas/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, History, Clock, User, Building, Phone, Mail, MapPin } from "lucide-react";
import { AssignStaffDialog } from "./components/assign-staff-dialog";
import { ExportClientHistoryDialog } from "@/components/shared/export-client-history-dialog";
import { format } from "date-fns";

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const companyId = useCompanyId();
  
  const [client, setClient] = useState<(Client & { id: string }) | null>(null);
  const [assignments, setAssignments] = useState<(ClientStaffAssignment & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const fetchClientDetails = async () => {
    try {
      const clientData = await getDocument<Client>(companyId, "clients", clientId);
      if (clientData) {
        setClient(clientData as Client & { id: string });
      } else {
        router.push("/super-admin/clients");
      }
    } catch (error) {
      console.error("Error fetching client details:", error);
    }
  };

  const fetchAssignments = async () => {
    try {
      // Fetch assignments for this client, ideally ordered by assignedAt desc
      // Note: Ordering requires a composite index in Firestore if combined with where().
      // For simplicity if no index exists, we can fetch by where() and sort in memory.
      const data = await listDocuments<ClientStaffAssignment>(companyId, "clientStaffAssignments", [
        where("clientId", "==", clientId)
      ]);
      
      // Sort in memory by assignedAt descending
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.assignedAt).getTime();
        const dateB = new Date(b.assignedAt).getTime();
        return dateB - dateA;
      });
      
      setAssignments(sortedData);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchClientDetails(), fetchAssignments()]);
    setLoading(false);
  };

  useEffect(() => {
    if (clientId && companyId) {
      loadData();
    }
  }, [clientId, companyId]);

  const activeAssignment = assignments.find(a => a.status === "active");
  const historyAssignments = assignments.filter(a => a.status === "completed");

  const handleAssignmentComplete = async () => {
    setShowAssignDialog(false);
    await fetchAssignments();
  };

  const handleUnassignCurrent = async () => {
    if (!activeAssignment) return;
    if (confirm("Are you sure you want to remove the current staff member without assigning a new one?")) {
      try {
        await updateDocument(companyId, "clientStaffAssignments", activeAssignment.id, {
          status: "completed",
          unassignedAt: new Date().toISOString()
        });
        await fetchAssignments();
      } catch (error) {
        console.error("Error unassigning staff:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
      </div>
    );
  }

  if (!client) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/super-admin/clients")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {client.name}
            <Badge variant={client.status === "active" ? "success" : "secondary"}>
              {client.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </h1>
          {client.company && <p className="text-sm text-[hsl(var(--muted-foreground))]">{client.company}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Profile Card */}
        <Card className="md:col-span-1 shadow-sm border-[hsl(var(--primary)/0.2)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-[hsl(var(--primary))]" />
              Client Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {client.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 text-[hsl(var(--muted-foreground))]" />
                  <div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Email</p>
                    <p className="text-sm font-medium">{client.email}</p>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 text-[hsl(var(--muted-foreground))]" />
                  <div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-medium">{client.phone}</p>
                  </div>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-[hsl(var(--muted-foreground))]" />
                  <div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Address</p>
                    <p className="text-sm font-medium">{client.address}</p>
                  </div>
                </div>
              )}
            </div>
            
            {client.notes && (
              <div className="pt-4 border-t border-[hsl(var(--border)/0.5)]">
                <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-[hsl(var(--foreground)/0.8)] whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff Assignments Section */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-[hsl(var(--primary))]" />
                  Current Assigned Staff
                </CardTitle>
                <CardDescription>The staff member currently handling this client.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowAssignDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                {activeAssignment ? "Change Staff" : "Assign Staff"}
              </Button>
            </CardHeader>
            <CardContent>
              {activeAssignment ? (
                <div className="bg-[hsl(var(--primary)/0.05)] rounded-lg p-4 border border-[hsl(var(--primary)/0.2)] flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[hsl(var(--primary))] flex items-center gap-2">
                      {activeAssignment.employeeName || "Unknown Staff"}
                      <Badge variant="success" className="h-5 text-[10px]">Active</Badge>
                    </h4>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Assigned since {format(new Date(activeAssignment.assignedAt), "MMM dd, yyyy h:mm a")}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleUnassignCurrent}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--muted)/0.3)]">
                  <User className="h-8 w-8 text-[hsl(var(--muted-foreground))] mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No staff currently assigned</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Assign a staff member to handle this client.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                  Assignment History
                </CardTitle>
                <CardDescription>Log of previous staff members assigned to this client.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                Export History
              </Button>
            </CardHeader>
            <CardContent>
              {historyAssignments.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">No assignment history found.</p>
              ) : (
                <div className="space-y-4">
                  {historyAssignments.map((assignment, index) => (
                    <div key={assignment.id} className="relative pl-6 pb-4 border-l border-[hsl(var(--border))] last:border-0 last:pb-0">
                      <div className="absolute left-[-5px] top-1 h-2 w-2 rounded-full bg-[hsl(var(--muted-foreground))] ring-4 ring-[hsl(var(--background))]"></div>
                      <div className="bg-[hsl(var(--muted)/0.3)] rounded-md p-3">
                        <h4 className="font-medium text-sm">{assignment.employeeName || "Unknown Staff"}</h4>
                        <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> From: {format(new Date(assignment.assignedAt), "MMM dd, yyyy h:mm a")}</span>
                          {assignment.unassignedAt && (
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> To: {format(new Date(assignment.unassignedAt), "MMM dd, yyyy h:mm a")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showAssignDialog && (
        <AssignStaffDialog
          isOpen={showAssignDialog}
          onClose={() => setShowAssignDialog(false)}
          clientId={clientId}
          activeAssignment={activeAssignment}
          onComplete={handleAssignmentComplete}
        />
      )}

      <ExportClientHistoryDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        clientId={clientId}
      />
    </div>
  );
}
