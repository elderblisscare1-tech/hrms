"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCompanyId } from "@/lib/auth/auth-context";
import { getDocument, updateDocument, deleteDocument } from "@/lib/firebase/firestore";
import type { Employee } from "@/lib/schemas/employee";
import type { Department } from "@/lib/schemas/department";
import type { Designation } from "@/lib/schemas/designation";
import type { Role } from "@/lib/schemas/role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Pencil, Mail, Phone, Building2, Calendar, MapPin,
  Briefcase, Shield, Clock, Download, Users, Key, Eye, EyeOff, Loader2, Trash2, Power, RefreshCw
} from "lucide-react";
import { auth, firebaseConfig } from "@/lib/firebase/client";
import { getApps, initializeApp } from "firebase/app";
import { sendPasswordResetEmail, getAuth, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { Input } from "@/components/ui/input";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const companyId = useCompanyId();
  
  const [employee, setEmployee] = useState<(Employee & { id: string }) | null>(null);
  const [departmentName, setDepartmentName] = useState("N/A");
  const [designationName, setDesignationName] = useState("N/A");
  const [managerName, setManagerName] = useState("N/A");
  const [roleName, setRoleName] = useState("N/A");
  const [loading, setLoading] = useState(true);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!companyId || !id) return;
    
    const fetchEmployee = async () => {
      try {
        const empDoc = await getDocument<Employee>(companyId, "employees", id);
        if (empDoc) {
          setEmployee({ ...empDoc, id });
          
          if (empDoc.departmentId) {
            const d = await getDocument<Department>(companyId, "departments", empDoc.departmentId);
            if (d) setDepartmentName(d.name);
          }
          if (empDoc.designationId) {
            const d = await getDocument<Designation>(companyId, "designations", empDoc.designationId);
            if (d) setDesignationName(d.title);
          }
          if (empDoc.reportingManagerId) {
            const m = await getDocument<Employee>(companyId, "employees", empDoc.reportingManagerId);
            if (m) setManagerName(`${m.firstName} ${m.lastName}`);
          }
          if (empDoc.role) {
            const r = await getDocument<Role>(companyId, "roles", empDoc.role);
            if (r) setRoleName(r.name);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployee();
  }, [companyId, id]);

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }
  
  const handleToggleStatus = async () => {
    if (!employee) return;
    const isCurrentlyActive = employee.employmentStatus === "active";
    const statusToSet = isCurrentlyActive ? "terminated" : "active";
    
    if (confirm(`Are you sure you want to mark this employee as ${statusToSet.toUpperCase()}?`)) {
      try {
        await updateDocument(companyId, "employees", id, { employmentStatus: statusToSet });
        setEmployee({ ...employee, employmentStatus: statusToSet });
      } catch (err) {
        console.error("Error updating status:", err);
        alert("Failed to update status.");
      }
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to permanently delete this employee? This action cannot be undone.")) {
      try {
        await deleteDocument(companyId, "employees", id);
        router.push("/admin/employees");
      } catch (err) {
        console.error("Error deleting employee:", err);
        alert("Failed to delete employee.");
      }
    }
  };
  
  const handleSendResetEmail = async () => {
    if (!employee) return;
    if (confirm(`Send a password reset email to ${employee.email}?`)) {
      try {
        await sendPasswordResetEmail(auth, employee.email);
        alert("Password reset email sent successfully!");
      } catch (err: any) {
        console.error(err);
        alert("Failed to send email: " + err.message);
      }
    }
  };

  const handleUpdatePasswordRecord = async () => {
    if (!employee) return;
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setIsResetting(true);
    try {
      // Call the API endpoint to update the password securely via Firebase Admin SDK
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: id,
          newPassword: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update password');
      }

      await updateDocument(companyId, "employees", id, { password: newPassword });
      setEmployee({ ...employee, password: newPassword });
      setNewPassword("");
      setIsEditingPassword(false);
      alert("Password updated successfully!");
    } catch (err) {
      alert("Failed to update database record.");
    } finally {
      setIsResetting(false);
    }
  };
  
  if (!employee) {
    return <div className="flex justify-center p-12 text-[hsl(var(--destructive))]">Employee not found.</div>;
  }

  const safeCurrentAddress = employee.currentAddress || {};
  const safePermanentAddress = employee.permanentAddress || {};
  const safeContact = employee.emergencyContact || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/employees">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <h1 className="text-2xl font-bold">Employee Profile</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleToggleStatus} 
            className={employee.employmentStatus === "active" ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]"}
          >
            <Power className="h-4 w-4 mr-2" />
            {employee.employmentStatus === "active" ? "Deactivate" : "Activate"}
          </Button>
          <Link href={`/admin/employees/${id}/edit`}>
            <Button size="sm" variant="secondary"><Pencil className="h-4 w-4 mr-2" />Edit</Button>
          </Link>
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />Delete
          </Button>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="overflow-hidden">
        <div className="h-32 gradient-brand relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-20 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
          </div>
        </div>
        <CardContent className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col md:flex-row gap-4">
            <Avatar className="h-24 w-24 border-4 border-[hsl(var(--card))] shadow-lg bg-[hsl(var(--muted))] -mt-12 shrink-0">
              {employee.photoUrl && <AvatarImage src={employee.photoUrl} alt="Profile" className="object-cover" />}
              <AvatarFallback className="text-2xl bg-[hsl(var(--primary))] text-white">
                {employee.firstName[0]}{employee.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-3 md:pt-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h2 className="text-xl font-bold">{employee.firstName} {employee.lastName}</h2>
                <Badge variant={employee.employmentStatus === "active" ? "success" : "secondary"}>
                  {employee.employmentStatus.replace("_", " ").toUpperCase()}
                </Badge>
                <Badge variant="secondary">{roleName.toUpperCase()}</Badge>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                {designationName} · {departmentName}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {employee.email}</span>
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {employee.phone}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {new Date(employee.dateOfJoining).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-[hsl(var(--primary))]" />Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Full Name", value: `${employee.firstName} ${employee.lastName}` },
              { label: "Email", value: employee.email },
              { label: "Phone", value: employee.phone },
              { label: "Date of Birth", value: employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "N/A" },
              { label: "Gender", value: employee.gender ? employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1) : "N/A" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-1 border-b border-[hsl(var(--border)/0.5)] last:border-0">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">{item.label}</span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Employment Info */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4 text-[hsl(var(--primary))]" />Employment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Department", value: departmentName },
              { label: "Designation", value: designationName },
              { label: "Employment Type", value: employee.employmentType.replace("_", " ").toUpperCase() },
              { label: "Date of Joining", value: new Date(employee.dateOfJoining).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) },
              { label: "Reporting Manager", value: managerName },
              { label: "Role", value: roleName.toUpperCase() },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-1 border-b border-[hsl(var(--border)/0.5)] last:border-0">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">{item.label}</span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Account Security (Admin Only View) */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4 text-[hsl(var(--primary))]" />Account Credentials (Admin)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-1 border-b border-[hsl(var(--border)/0.5)]">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Email</span>
              <span className="text-sm font-medium">{employee.email}</span>
            </div>
            
            <div className="flex flex-col py-2 border-b border-[hsl(var(--border)/0.5)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Password Record</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tracking-wide">
                    {employee.password ? (showPassword ? employee.password : "••••••••") : "Not available"}
                  </span>
                  {employee.password && (
                    <Button variant="ghost" size="icon-sm" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" onClick={() => setIsEditingPassword(!isEditingPassword)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              
              {isEditingPassword && (
                <div className="flex gap-2 items-center mt-2 bg-[hsl(var(--muted))] p-3 rounded-lg border">
                  <Input 
                    type="password" 
                    placeholder="New password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 h-8"
                  />
                  <Button size="sm" onClick={handleUpdatePasswordRecord} loading={isResetting}>Save</Button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <p className="text-xs text-[hsl(var(--muted-foreground))] flex flex-col gap-1">
                 <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Official Password Reset</span>
                 Send an email link for the user to securely change their login password.
              </p>
              <Button size="sm" variant="outline" onClick={handleSendResetEmail}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Send Reset Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-[hsl(var(--primary))]" />Address Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold mb-2 text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Current Address</h4>
              {safeCurrentAddress.line1 ? (
                <>
                  <p className="text-sm">{safeCurrentAddress.line1} {safeCurrentAddress.line2 && `, ${safeCurrentAddress.line2}`}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{safeCurrentAddress.city}, {safeCurrentAddress.state} — {safeCurrentAddress.pincode}</p>
                </>
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))] italic">No current address provided</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2 text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Permanent Address</h4>
              {safePermanentAddress.line1 ? (
                <>
                  <p className="text-sm">{safePermanentAddress.line1} {safePermanentAddress.line2 && `, ${safePermanentAddress.line2}`}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{safePermanentAddress.city}, {safePermanentAddress.state} — {safePermanentAddress.pincode}</p>
                </>
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))] italic">No permanent address provided</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4 text-[hsl(var(--primary))]" />Emergency Contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {safeContact.name ? (
              <>
                <div className="flex justify-between items-center py-1 border-b border-[hsl(var(--border)/0.5)]">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">Name</span>
                  <span className="text-sm font-medium">{safeContact.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[hsl(var(--border)/0.5)]">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">Phone</span>
                  <span className="text-sm font-medium">{safeContact.phone}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[hsl(var(--border)/0.5)] last:border-0">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">Relationship</span>
                  <span className="text-sm font-medium">{safeContact.relationship}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No emergency contact provided</p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
