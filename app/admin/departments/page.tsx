"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments, createDocument, deleteDocument, updateDocument } from "@/lib/firebase/firestore";
import type { Department } from "@/lib/schemas/department";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Pencil, Trash2, Building2, Users, Search } from "lucide-react";

export default function DepartmentsPage() {
  const companyId = useCompanyId();
  const [departments, setDepartments] = useState<(Department & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDept, setEditingDept] = useState<(Department & {id: string}) | null>(null);
  
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchDepartments() {
    try {
      const data = await listDocuments<Department>(companyId, "departments");
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDepartments();
  }, [companyId]);

  const handleSave = async () => {
    if (!newDeptName) return;
    setSaving(true);
    try {
      if (editingDept) {
        await updateDocument(companyId, "departments", editingDept.id, {
          name: newDeptName,
          description: newDeptDesc
        });
      } else {
        await createDocument(companyId, "departments", {
          name: newDeptName,
          description: newDeptDesc,
          isActive: true,
          companyId: companyId
        });
      }
      setShowAddForm(false);
      setEditingDept(null);
      setNewDeptName("");
      setNewDeptDesc("");
      fetchDepartments();
    } catch (error) {
      console.error("Error creating department", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this department?")) {
      try {
        await deleteDocument(companyId, "departments", id);
        fetchDepartments();
      } catch (error) {
        console.error("Error deleting department", error);
      }
    }
  };

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {loading ? "Loading..." : `${departments.length} departments configured`}
          </p>
        </div>
        <Button size="sm" onClick={() => {
          setEditingDept(null);
          setNewDeptName("");
          setNewDeptDesc("");
          setShowAddForm(!showAddForm);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card className="animate-slide-down border-[hsl(var(--primary)/0.3)]">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input placeholder="Department name" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className="flex-1" />
              <Input placeholder="Description (optional)" value={newDeptDesc} onChange={(e) => setNewDeptDesc(e.target.value)} className="flex-1" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving || !newDeptName}>
                  {saving ? "Saving..." : editingDept ? "Update" : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { 
                  setShowAddForm(false); 
                  setEditingDept(null);
                  setNewDeptName(""); 
                  setNewDeptDesc(""); 
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <Input placeholder="Search departments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {/* Department Grid */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />}
          title="No departments found"
          description="Create your first department to start organizing your employees."
          action={{ label: "Add Department", onClick: () => setShowAddForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dept) => (
            <Card key={dept.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[hsl(var(--primary)/0.1)]">
                    <Building2 className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => {
                      setEditingDept(dept);
                      setNewDeptName(dept.name);
                      setNewDeptDesc(dept.description || "");
                      setShowAddForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-[hsl(var(--destructive))]" onClick={() => handleDelete(dept.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-base">{dept.name}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">{dept.description || "No description provided."}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[hsl(var(--border)/0.5)]">
                  <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]">
                    <Users className="h-3.5 w-3.5" />
                    <span>Dynamic Count</span> {/* This would require fetching employees per department */}
                  </div>
                  <Badge variant={dept.isActive ? "success" : "secondary"} className="text-xs">
                    {dept.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && departments.length > 0 && (
             <div className="col-span-full text-center p-8 text-[hsl(var(--muted-foreground))]">
                No departments match your search.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
