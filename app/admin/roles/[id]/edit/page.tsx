"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoleSchema, type CreateRoleInput } from "@/lib/schemas/role";
import { useCompanyId } from "@/lib/auth/auth-context";
import { getDocument, updateDocument } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, ShieldCheck, CheckSquare, Loader2 } from "lucide-react";

const ADMIN_SECTIONS = [
  { id: "dashboard", label: "Dashboard", desc: "View key metrics and overview" },
  { id: "employees", label: "Employees", desc: "Manage employee records" },
  { id: "departments", label: "Departments", desc: "Manage organization structure" },
  { id: "designations", label: "Designations", desc: "Manage job titles" },
  { id: "attendance", label: "Attendance Reports", desc: "View attendance logs and reports" },
  { id: "daily_attendance", label: "Daily Attendance", desc: "Mark daily attendance for employees" },
  { id: "leave", label: "Leave", desc: "Approve or reject leave requests" },
  { id: "payroll", label: "Payroll", desc: "Run payroll and manage payslips" },
  { id: "performance", label: "Performance", desc: "Manage performance reviews" },
  { id: "training", label: "Training", desc: "Manage training programs" },
  { id: "assets", label: "Assets", desc: "Manage IT assets and assignments" },
  { id: "helpdesk", label: "Helpdesk", desc: "Manage employee support tickets" },
  { id: "compliance", label: "Compliance", desc: "Manage company policies" },
  { id: "roles", label: "Roles", desc: "Manage custom roles and permissions" },
  { id: "settings", label: "Settings", desc: "Manage company settings" },
];

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const companyId = useCompanyId();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  type FormInput = z.input<typeof createRoleSchema>;

  const { register, handleSubmit, control, setValue, formState: { errors }, reset } = useForm<FormInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      companyId: companyId,
      name: "",
      description: "",
      permissions: {
        canAccessEmployeePortal: true,
        canAccessAdminPortal: false,
        adminSections: [],
      }
    },
  });

  useEffect(() => {
    if (!id || !companyId) return;
    const loadRole = async () => {
      try {
        const role = await getDocument<CreateRoleInput>(companyId, "roles", id);
        if (role) {
          reset({
            companyId: role.companyId,
            name: role.name,
            description: role.description || "",
            permissions: role.permissions
          });
        }
      } catch (error) {
        console.error("Error fetching role:", error);
      } finally {
        setFetching(false);
      }
    };
    loadRole();
  }, [id, companyId, reset]);

  const canAccessAdminPortal = useWatch({ control, name: "permissions.canAccessAdminPortal" });
  const adminSections = useWatch({ control, name: "permissions.adminSections" }) || [];
  const canAccessEmployeePortal = useWatch({ control, name: "permissions.canAccessEmployeePortal" });

  const toggleSection = (sectionId: string) => {
    if (adminSections.includes(sectionId)) {
      setValue("permissions.adminSections", adminSections.filter(sid => sid !== sectionId), { shouldDirty: true });
    } else {
      setValue("permissions.adminSections", [...adminSections, sectionId], { shouldDirty: true });
    }
  };

  const onSubmit = async (data: FormInput) => {
    setSaving(true);
    try {
      await updateDocument(companyId, "roles", id, data);
      alert("Role updated successfully!");
      router.push("/admin/roles");
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role.");
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/admin/roles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Role</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Update access levels and permissions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-[hsl(var(--primary))]" />
              Role Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Role Name *</label>
              <Input placeholder="e.g. HR Assistant" error={errors.name?.message} {...register("name")} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea placeholder="Briefly describe what this role can do" className="resize-none" {...register("description")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="h-4 w-4 text-[hsl(var(--primary))]" />
              Portal Access
            </CardTitle>
            <CardDescription>Select which portals this role can log into</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-[hsl(var(--border))] rounded-lg">
              <div>
                <p className="font-medium">Employee Portal</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Can view own attendance, payslips, and apply for leave.</p>
              </div>
              <Switch 
                checked={!!canAccessEmployeePortal} 
                onCheckedChange={(val) => setValue("permissions.canAccessEmployeePortal", val, { shouldDirty: true })} 
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-[hsl(var(--border))] rounded-lg">
              <div>
                <p className="font-medium">Admin Portal</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Can access the administration dashboard to manage company data.</p>
              </div>
              <Switch 
                checked={!!canAccessAdminPortal} 
                onCheckedChange={(val) => {
                  setValue("permissions.canAccessAdminPortal", val);
                  if (!val) setValue("permissions.adminSections", []);
                }} 
              />
            </div>

            {canAccessAdminPortal && (
              <div className="pt-4 border-t border-[hsl(var(--border))] animate-fade-in">
                <h3 className="font-medium mb-4">Admin Sections</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ADMIN_SECTIONS.map((section) => {
                    const isSelected = adminSections.includes(section.id);
                    return (
                      <div 
                        key={section.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)]" : "border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))]"
                        }`}
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]" : "border-[hsl(var(--input))] bg-[hsl(var(--background))]"
                        }`}>
                          {isSelected && <CheckSquare className="h-3 w-3 text-[hsl(var(--primary-foreground))]" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{section.label}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{section.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/roles">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" loading={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
