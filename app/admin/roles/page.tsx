"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments, deleteDocument } from "@/lib/firebase/firestore";
import type { Role } from "@/lib/schemas/role";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RolesPage() {
  const companyId = useCompanyId();
  const [roles, setRoles] = useState<(Role & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      const data = await listDocuments<Role>(companyId, "roles");
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [companyId]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this role?")) {
      try {
        await deleteDocument(companyId, "roles", id);
        fetchRoles();
      } catch (error) {
        console.error("Error deleting role:", error);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-[hsl(var(--primary))]" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Manage access control and permissions for your team
          </p>
        </div>
        <Link href="/admin/roles/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-[hsl(var(--muted-foreground))]">
            Loading roles...
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-[hsl(var(--muted-foreground))] mb-4">No custom roles found.</p>
            <Link href="/admin/roles/new">
              <Button variant="outline">Create your first role</Button>
            </Link>
          </div>
        ) : (
          roles.map((role) => (
            <Card key={role.id} className="hover:shadow-md transition-shadow relative group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{role.name}</h3>
                    {role.description && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        {role.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/roles/${role.id}/edit`} className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[hsl(var(--destructive))] cursor-pointer" onClick={() => handleDelete(role.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Portal Access</p>
                    <div className="flex gap-2">
                      {role.permissions.canAccessEmployeePortal && (
                        <Badge variant="secondary" className="text-[10px]">Employee Portal</Badge>
                      )}
                      {role.permissions.canAccessAdminPortal && (
                        <Badge variant="default" className="text-[10px] bg-[hsl(var(--primary))]">Admin Portal</Badge>
                      )}
                    </div>
                  </div>

                  {role.permissions.canAccessAdminPortal && role.permissions.adminSections && role.permissions.adminSections.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Admin Sections</p>
                      <div className="flex flex-wrap gap-1.5">
                        {role.permissions.adminSections.map(section => (
                          <Badge key={section} variant="outline" className="text-[10px] capitalize">
                            {section.replace("-", " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
