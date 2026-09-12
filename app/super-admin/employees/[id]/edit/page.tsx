"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmployeeSchema, type CreateEmployeeInput } from "@/lib/schemas/employee";
import { useCompanyId } from "@/lib/auth/auth-context";
import { getDocument, updateDocument, listDocuments } from "@/lib/firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, User, Briefcase, MapPin, Phone, Loader2, Upload } from "lucide-react";

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const companyId = useCompanyId();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>("");
  const [addressTab, setAddressTab] = useState<"current" | "permanent">("current");
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      companyId: companyId,
      role: "employee",
      employmentStatus: "active",
      employmentType: "full_time",
    },
  });

  useEffect(() => {
    if (!companyId || !id) return;
    const fetchData = async () => {
      try {
        const [deps, desigs, emps, rolesData, empDoc] = await Promise.all([
          listDocuments(companyId, "departments"),
          listDocuments(companyId, "designations"),
          listDocuments(companyId, "employees"),
          listDocuments(companyId, "roles"),
          getDocument<CreateEmployeeInput>(companyId, "employees", id)
        ]);
        setDepartments(deps);
        setDesignations(desigs);
        setManagers(emps);
        setRoles(rolesData);
        if (empDoc) {
          reset(empDoc);
          if (empDoc.photoUrl) setCurrentPhotoUrl(empDoc.photoUrl);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [companyId, id, reset]);

  const onSubmit = async (data: CreateEmployeeInput) => {
    setLoading(true);
    try {
      let photoUrl = currentPhotoUrl;
      if (imageFile) {
        try {
          const storageRef = ref(storage, `companies/${companyId}/employees/${id}/profile.jpg`);
          await uploadBytes(storageRef, imageFile);
          photoUrl = await getDownloadURL(storageRef);
        } catch (uploadErr) {
          console.error("Failed to upload image:", uploadErr);
        }
      }

      const cleanData = { ...data, photoUrl };
      if (!cleanData.departmentId) delete cleanData.departmentId;
      if (!cleanData.designationId) delete cleanData.designationId;
      if (!cleanData.reportingManagerId) delete cleanData.reportingManagerId;

      await updateDocument(companyId, "employees", id, cleanData);
      alert("Employee updated successfully!");
      router.push("/admin/employees");
    } catch (error: any) {
      console.error("Error updating employee:", error);
      alert("Failed to update employee: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Employee</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Update details for this team member</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-[hsl(var(--primary))]" />
              Personal Information
            </CardTitle>
            <CardDescription>Basic details about the employee</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 pb-2 border-b border-[hsl(var(--border)/0.5)] mb-4">
              <div className="h-16 w-16 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden border">
                {imageFile ? (
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-full w-full object-cover" />
                ) : currentPhotoUrl ? (
                  <img src={currentPhotoUrl} alt="Current Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
                )}
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1.5 block">Profile Photo (Optional)</label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="max-w-xs"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">First Name *</label>
              <Input placeholder="John" error={errors.firstName?.message} {...register("firstName")} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Last Name *</label>
              <Input placeholder="Doe" error={errors.lastName?.message} {...register("lastName")} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email *</label>
              <Input type="email" placeholder="john@company.com" error={errors.email?.message} {...register("email")} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone *</label>
              <Input placeholder="+91 98765 43210" error={errors.phone?.message} {...register("phone")} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Date of Birth</label>
              <Input type="date" {...register("dateOfBirth")} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Gender</label>
              <select className="flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm" {...register("gender")}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-[hsl(var(--primary))]" />
              Employment Details
            </CardTitle>
            <CardDescription>Role and department information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Date of Joining *</label>
              <Input type="date" error={errors.dateOfJoining?.message} {...register("dateOfJoining")} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Employment Type</label>
              <select className="flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm" {...register("employmentType")}>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Work Location</label>
              <Input placeholder="e.g. Office, Remote, Site" {...register("workLocation")} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Status</label>
              <select className="flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm" {...register("employmentStatus")}>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="on_notice">On Notice</option>
                <option value="resigned">Resigned</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Department</label>
              <select className="flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm" {...register("departmentId")}>
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Designation</label>
              <select className="flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm" {...register("designationId")}>
                <option value="">Select Designation</option>
                {designations.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Role</label>
              <select className="flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm" {...register("role")}>
                <option value="">Select Role</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Reporting Manager</label>
              <select className="flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm" {...register("reportingManagerId")}>
                <option value="">Select Manager</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader className="pb-3 border-b mb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-[hsl(var(--primary))]" />
                Address
              </CardTitle>
              <div className="flex bg-[hsl(var(--muted))] rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setAddressTab("current")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    addressTab === "current" 
                      ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm" 
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  }`}
                >
                  Current Address
                </button>
                <button
                  type="button"
                  onClick={() => setAddressTab("permanent")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    addressTab === "permanent" 
                      ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm" 
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  }`}
                >
                  Permanent Address
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Current Address Fields */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${addressTab === "current" ? "block" : "hidden"}`}>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Address Line 1</label>
                <Input placeholder="Street address" {...register("currentAddress.line1")} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Address Line 2</label>
                <Input placeholder="Apartment, suite, etc." {...register("currentAddress.line2")} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">City</label>
                <Input placeholder="Mumbai" {...register("currentAddress.city")} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">State</label>
                <Input placeholder="Maharashtra" {...register("currentAddress.state")} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Pincode</label>
                <Input placeholder="400001" {...register("currentAddress.pincode")} />
              </div>
            </div>

            {/* Permanent Address Fields */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${addressTab === "permanent" ? "block" : "hidden"}`}>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Address Line 1</label>
                <Input placeholder="Street address" {...register("permanentAddress.line1")} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Address Line 2</label>
                <Input placeholder="Apartment, suite, etc." {...register("permanentAddress.line2")} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">City</label>
                <Input placeholder="Mumbai" {...register("permanentAddress.city")} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">State</label>
                <Input placeholder="Maharashtra" {...register("permanentAddress.state")} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Pincode</label>
                <Input placeholder="400001" {...register("permanentAddress.pincode")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4 text-[hsl(var(--primary))]" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input placeholder="Contact name" {...register("emergencyContact.name")} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone</label>
              <Input placeholder="+91 98765 43210" {...register("emergencyContact.phone")} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Relationship</label>
              <Input placeholder="Spouse, Parent, etc." {...register("emergencyContact.relationship")} />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/employees">
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
