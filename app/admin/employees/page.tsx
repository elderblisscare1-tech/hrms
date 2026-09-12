"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments, deleteDocument } from "@/lib/firebase/firestore";
import type { Employee } from "@/lib/schemas/employee";
import type { Department } from "@/lib/schemas/department";
import type { Designation } from "@/lib/schemas/designation";
import { useCollection } from "@/lib/hooks/use-firestore";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import {
  UserPlus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";



const statusBadge: Record<string, { label: string; variant: "success" | "warning" | "error" | "info" }> = {
  active: { label: "Active", variant: "success" },
  on_leave: { label: "On Leave", variant: "warning" },
  on_notice: { label: "On Notice", variant: "info" },
  resigned: { label: "Resigned", variant: "error" },
  terminated: { label: "Terminated", variant: "error" },
};

export default function EmployeesPage() {
  const companyId = useCompanyId();
  
  const { data: employees, loading: empLoading, mutate: mutateEmployees } = useCollection<Employee>(companyId, "employees");
  const { data: departmentsData, loading: deptLoading } = useCollection<Department>(companyId, "departments");
  const { data: designationsData, loading: desigLoading } = useCollection<Designation>(companyId, "designations");
  
  const loading = empLoading || deptLoading || desigLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const departmentsMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    departmentsData.forEach(d => { if (d.id) map[d.id] = d.name; });
    return map;
  }, [departmentsData]);

  const designationsMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    designationsData.forEach(d => { if (d.id) map[d.id] = d.title; });
    return map;
  }, [designationsData]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteDocument(companyId, "employees", id);
        // Remove from local state immediately for fast feedback
        mutateEmployees(employees.filter(e => e.id !== id), false);
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    }
  };

  const filteredEmployees = React.useMemo(() => employees.filter((emp) => {
    const matchesSearch =
      `${emp.firstName} ${emp.lastName} ${emp.email} ${emp.departmentId || ""}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "all" || emp.departmentId === selectedDept;
    return matchesSearch && matchesDept;
  }), [employees, searchQuery, selectedDept]);

  const departments = React.useMemo(() => [...new Set(employees.map((e) => e.departmentId).filter(Boolean))], [employees]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Manage your workforce — {employees.length} employees
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/admin/employees/new">
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                placeholder="Search by name, email, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm min-w-[160px]"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept as string} value={dept as string}>{departmentsMap[dept as string] || dept}</option>
              ))}
            </select>
            <div className="flex gap-1 border border-[hsl(var(--input))] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "table" ? "bg-[hsl(var(--primary))] text-white" : "hover:bg-[hsl(var(--secondary))]"}`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "grid" ? "bg-[hsl(var(--primary))] text-white" : "hover:bg-[hsl(var(--secondary))]"}`}
              >
                Grid
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
          <p className="text-[hsl(var(--muted-foreground))]">Loading employees...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />}
          title="No employees found"
          description="Try adjusting your search or filter criteria, or add a new employee."
          action={{ label: "Add Employee", onClick: () => {} }}
        />
      ) : viewMode === "table" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Employee</th>
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4 hidden md:table-cell">Department</th>
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4 hidden lg:table-cell">Designation</th>
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4 hidden lg:table-cell">Contact</th>
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Status</th>
                  <th className="text-right text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, index) => {
                  const status = statusBadge[emp.employmentStatus || "active"] || statusBadge.active;
                  return (
                    <tr
                      key={emp.id}
                      className="border-b border-[hsl(var(--border)/0.5)] hover:bg-[hsl(var(--secondary)/0.3)] transition-colors duration-150 group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 relative overflow-hidden">
                            {emp.photoUrl ? (
                              <Image src={emp.photoUrl} alt="Profile" fill sizes="36px" className="object-cover" />
                            ) : (
                              <AvatarFallback className="text-xs">
                                {emp.firstName[0]}{emp.lastName[0]}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <Link href={`/admin/employees/${emp.id}`} className="text-sm font-medium hover:text-[hsl(var(--primary))] transition-colors">
                              {emp.firstName} {emp.lastName}
                            </Link>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                          <span className="text-sm">{emp.departmentId ? (departmentsMap[emp.departmentId] || emp.departmentId) : "N/A"}</span>
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">{emp.designationId ? (designationsMap[emp.designationId] || emp.designationId) : "N/A"}</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {emp.phone}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/employees/${emp.id}`}>
                            <Button variant="ghost" size="icon-sm" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/employees/${emp.id}/edit`}>
                            <Button variant="ghost" size="icon-sm" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon-sm" title="Delete" className="text-[hsl(var(--destructive))]" onClick={() => handleDelete(emp.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="More" className="text-[hsl(var(--muted-foreground))]">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[hsl(var(--border))]">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Showing 1-{filteredEmployees.length} of {employees.length} employees
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="icon-sm" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="default" size="icon-sm" className="w-8">1</Button>
              <Button variant="outline" size="icon-sm" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => {
            const status = statusBadge[emp.employmentStatus || "active"] || statusBadge.active;
            return (
              <Card key={emp.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5 text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-3 relative overflow-hidden">
                    {emp.photoUrl ? (
                      <Image src={emp.photoUrl} alt="Profile" fill sizes="64px" className="object-cover" />
                    ) : (
                      <AvatarFallback className="text-lg">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Link href={`/admin/employees/${emp.id}`}>
                    <h3 className="font-semibold hover:text-[hsl(var(--primary))] transition-colors">
                      {emp.firstName} {emp.lastName}
                    </h3>
                  </Link>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{emp.designationId ? (designationsMap[emp.designationId] || emp.designationId) : "N/A"}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 flex items-center justify-center gap-1">
                    <Building2 className="h-3 w-3" /> {emp.departmentId ? (departmentsMap[emp.departmentId] || emp.departmentId) : "N/A"}
                  </p>
                  <div className="mt-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="mt-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/admin/employees/${emp.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    <Link href={`/admin/employees/${emp.id}/edit`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="text-[hsl(var(--destructive))]" onClick={() => handleDelete(emp.id)}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
