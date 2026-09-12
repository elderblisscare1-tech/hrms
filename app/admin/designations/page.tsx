"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments, createDocument, deleteDocument, updateDocument } from "@/lib/firebase/firestore";
import type { Designation } from "@/lib/schemas/designation";
import type { Department } from "@/lib/schemas/department";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Award, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function DesignationsPage() {
  const companyId = useCompanyId();
  const [designations, setDesignations] = useState<(Designation & { id: string })[]>([]);
  const [departments, setDepartments] = useState<(Department & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDes, setEditingDes] = useState<(Designation & {id: string}) | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDepartmentId, setNewDepartmentId] = useState("");
  const [newLevel, setNewLevel] = useState("1");
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    try {
      const [desData, deptData] = await Promise.all([
        listDocuments<Designation>(companyId, "designations"),
        listDocuments<Department>(companyId, "departments")
      ]);
      setDesignations(desData);
      setDepartments(deptData);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const handleSave = async () => {
    if (!newTitle || !newDepartmentId) return;
    setSaving(true);
    try {
      if (editingDes) {
        await updateDocument(companyId, "designations", editingDes.id, {
          title: newTitle,
          departmentId: newDepartmentId,
          level: parseInt(newLevel, 10) || 1
        });
      } else {
        await createDocument(companyId, "designations", {
          title: newTitle,
          departmentId: newDepartmentId,
          level: parseInt(newLevel, 10) || 1,
          isActive: true,
          companyId: companyId
        });
      }
      setShowAddForm(false);
      setEditingDes(null);
      setNewTitle("");
      setNewDepartmentId("");
      setNewLevel("1");
      fetchData();
    } catch (error) {
      console.error("Error creating designation", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this designation?")) {
      try {
        await deleteDocument(companyId, "designations", id);
        fetchData();
      } catch (error) {
        console.error("Error deleting designation", error);
      }
    }
  };

  const filtered = designations.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, typeof designations>>((acc, d) => {
    const dept = departments.find(dept => dept.id === d.departmentId);
    const deptName = dept ? dept.name : "Unassigned";
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Designations</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {loading ? "Loading..." : `${designations.length} designations across departments`}
          </p>
        </div>
        <Button size="sm" onClick={() => {
          setEditingDes(null);
          setNewTitle("");
          setNewDepartmentId("");
          setNewLevel("1");
          setShowAddForm(!showAddForm);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Designation
        </Button>
      </div>

      {showAddForm && (
        <Card className="animate-slide-down border-[hsl(var(--primary)/0.3)]">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input placeholder="Designation title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="flex-1" />
              <select 
                className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm min-w-[160px]"
                value={newDepartmentId}
                onChange={e => setNewDepartmentId(e.target.value)}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              <Input placeholder="Level (1-10)" type="number" min="1" max="10" value={newLevel} onChange={e => setNewLevel(e.target.value)} className="w-28" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving || !newTitle || !newDepartmentId}>
                  {saving ? "Saving..." : editingDes ? "Update" : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  setShowAddForm(false);
                  setEditingDes(null);
                  setNewTitle("");
                  setNewDepartmentId("");
                  setNewLevel("1");
                }}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <Input placeholder="Search designations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
        </div>
      ) : designations.length === 0 ? (
        <EmptyState
          icon={<Award className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />}
          title="No designations found"
          description="Create your first designation and assign it to a department."
          action={{ label: "Add Designation", onClick: () => setShowAddForm(true) }}
        />
      ) : (
        Object.entries(grouped).map(([dept, deptDesignations]) => (
          <div key={dept}>
            <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">{dept}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {deptDesignations.sort((a, b) => (a.level || 1) - (b.level || 1)).map((des) => (
                <Card key={des.id} className="group hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[hsl(var(--primary)/0.08)]">
                      <Award className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{des.title}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Level {des.level || 1}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => {
                        setEditingDes(des);
                        setNewTitle(des.title);
                        setNewDepartmentId(des.departmentId || "");
                        setNewLevel((des.level || 1).toString());
                        setShowAddForm(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon-sm" className="text-[hsl(var(--destructive))]" onClick={() => handleDelete(des.id)} title="Delete">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
      {!loading && designations.length > 0 && Object.keys(grouped).length === 0 && (
         <div className="text-center p-8 text-[hsl(var(--muted-foreground))]">
            No designations match your search.
         </div>
      )}
    </div>
  );
}
