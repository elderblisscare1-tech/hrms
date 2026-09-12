"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmployeeSchema, type CreateEmployeeInput } from "@/lib/schemas/employee";
import { useCompanyId } from "@/lib/auth/auth-context";
import { createDocument, listDocuments } from "@/lib/firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseConfig, db, storage } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, User, Briefcase, MapPin, Phone, Upload } from "lucide-react";

export default function AddEmployeePage() {
  const router = useRouter();
  const companyId = useCompanyId();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [addressTab, setAddressTab] = useState<"current" | "permanent">("current");
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    if (!companyId) return;
    const fetchData = async () => {
      try {
        const [deps, desigs, emps, rolesData] = await Promise.all([
          listDocuments(companyId, "departments"),
          listDocuments(companyId, "designations"),
          listDocuments(companyId, "employees"),
          listDocuments(companyId, "roles")
        ]);
        setDepartments(deps);
        setDesignations(desigs);
        // Wait, how to identify managers now? Maybe anyone can be a manager, or we check if they have a role that allows admin portal.
        // For now let's just show all employees as potential managers to keep it simple, or filter by role existence.
        setManagers(emps);
        setRoles(rolesData);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };
    fetchData();
  }, [companyId]);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfJoining: "",
      companyId: companyId,
      role: "employee",
      employmentStatus: "active",
      employmentType: "full_time",
    },
  });

  const onSubmit = async (data: CreateEmployeeInput) => {
    if (!password || password.length < 6) {
      alert("Please provide a password of at least 6 characters.");
      return;
    }

    if (!data.aadharNumber && !aadharFile && !data.panNumber && !panFile) {
      alert("Please provide at least one identity document (Aadhar Card or PAN Card, either number or upload).");
      return;
    }
    
    setLoading(true);
    try {
      // 1. Create auth user using secondary app (so admin doesn't get logged out)
      const secondaryApp = getApps().find(app => app.name === "Secondary") || initializeApp(firebaseConfig, "Secondary");
      const secondaryAuth = getAuth(secondaryApp);
      
      const cred = await createUserWithEmailAndPassword(secondaryAuth, data.email, password);
      const uid = cred.user.uid;
      
      // Sign out from the secondary auth instance so the session doesn't persist
      await secondaryAuth.signOut();
      
      // 2. Write to /users/{uid} to provide fallback auth claims
      await setDoc(doc(db, "users", uid), {
        companyId: companyId,
        role: data.role,
        employeeId: uid
      });
      
      let photoUrl = "";
      if (imageFile) {
        try {
          const storageRef = ref(storage, `companies/${companyId}/employees/${uid}/profile.jpg`);
          await uploadBytes(storageRef, imageFile);
          photoUrl = await getDownloadURL(storageRef);
        } catch (uploadErr) {
          console.error("Failed to upload image:", uploadErr);
        }
      }
      
      let aadharUrl = "";
      if (aadharFile) {
        try {
          const ext = aadharFile.name.split('.').pop() || 'jpg';
          const storageRef = ref(storage, `companies/${companyId}/employees/${uid}/aadhar.${ext}`);
          await uploadBytes(storageRef, aadharFile);
          aadharUrl = await getDownloadURL(storageRef);
        } catch (uploadErr) {
          console.error("Failed to upload Aadhar image:", uploadErr);
        }
      }

      let panUrl = "";
      if (panFile) {
        try {
          const ext = panFile.name.split('.').pop() || 'jpg';
          const storageRef = ref(storage, `companies/${companyId}/employees/${uid}/pan.${ext}`);
          await uploadBytes(storageRef, panFile);
          panUrl = await getDownloadURL(storageRef);
        } catch (uploadErr) {
          console.error("Failed to upload PAN image:", uploadErr);
        }
      }
      
      const cleanData = { 
        ...data, 
        password: password, 
        photoUrl: photoUrl,
        aadharUrl: aadharUrl,
        panUrl: panUrl
      };
      if (!cleanData.departmentId) delete cleanData.departmentId;
      if (!cleanData.designationId) delete cleanData.designationId;
      if (!cleanData.reportingManagerId) delete cleanData.reportingManagerId;

      await createDocument(companyId, "employees", cleanData, uid);
      
      alert("Employee created successfully!");
      router.push("/admin/employees");
    } catch (error: any) {
      console.error("Error creating employee:", error);
      alert("Failed to create employee: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold">Add New Employee</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Fill in the details to onboard a new team member</p>
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
              <label className="text-sm font-medium mb-1.5 block">Password *</label>
              <Input type="password" placeholder="Create a login password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
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

        {/* Identity Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-[hsl(var(--primary))]" />
              Identity Documents
            </CardTitle>
            <CardDescription>Provide at least one proof (Aadhar or PAN, number or upload)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aadhar Card Section */}
              <div className="p-4 border rounded-lg bg-[hsl(var(--muted)/0.3)]">
                <h5 className="text-sm font-semibold mb-3">Aadhar Card</h5>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Aadhar Number</label>
                    <Input placeholder="1234 5678 9012" {...register("aadharNumber")} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Upload Aadhar Image / PDF</label>
                    <Input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      onChange={(e) => setAadharFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              </div>

              {/* PAN Card Section */}
              <div className="p-4 border rounded-lg bg-[hsl(var(--muted)/0.3)]">
                <h5 className="text-sm font-semibold mb-3">PAN Card</h5>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">PAN Number</label>
                    <Input placeholder="ABCDE1234F" className="uppercase" {...register("panNumber")} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Upload PAN Image / PDF</label>
                    <Input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      onChange={(e) => setPanFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              </div>
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
            Add Employee
          </Button>
        </div>
      </form>
    </div>
  );
}
