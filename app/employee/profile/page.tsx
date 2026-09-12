"use client";

import React, { useState, useEffect } from "react";
import { useRequireAuth } from "@/lib/auth/auth-context";
import { getDocument } from "@/lib/firebase/firestore";
import type { Employee } from "@/lib/schemas/employee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, Mail, MapPin, Briefcase, Building, CreditCard, HeartPulse, IdCard, ExternalLink } from "lucide-react";

export default function EmployeeProfilePage() {
  const { claims } = useRequireAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!claims?.companyId || !claims?.employeeId) return;
      try {
        const empData = await getDocument<Employee>(claims.companyId, "employees", claims.employeeId);
        if (empData) setEmployee(empData);
      } catch (err) {
        console.error("Error fetching employee:", err);
      } finally {
        setLoading(false);
      }
    }
    if (claims) fetchData();
  }, [claims]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6 text-center text-[hsl(var(--muted-foreground))]">
        Profile not found.
      </div>
    );
  }

  const employeeName = `${employee.firstName} ${employee.lastName}`;
  const initials = `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`;

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.8)] -mx-4 -mt-4 p-8 pt-12 pb-16 text-white text-center rounded-b-[2.5rem] shadow-sm">
        <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white shadow-md">
          {employee.photoUrl && (
            <AvatarImage src={employee.photoUrl} alt={initials} className="object-cover" />
          )}
          <AvatarFallback className="text-2xl bg-white text-[hsl(var(--primary))] font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">{employeeName}</h1>
        <p className="opacity-90 mt-1">{employee.role}</p>
        <div className="flex items-center justify-center gap-2 mt-2 opacity-80 text-sm">
          <Briefcase className="h-4 w-4" />
          <span>Emp ID: {employee.id || 'N/A'}</span>
        </div>
      </div>

      <div className="px-4 -mt-10 space-y-4">
        {/* Personal Details */}
        <Card className="shadow-md">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-[hsl(var(--primary))]" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Email</p>
                <p className="text-sm font-medium">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Phone</p>
                <p className="text-sm font-medium">{employee.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-1 text-[hsl(var(--muted-foreground))]" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Current Address</p>
                  <p className="text-sm font-medium">
                    {employee.currentAddress?.line1 ? (
                      <>
                        {employee.currentAddress.line1}{employee.currentAddress.line2 && `, ${employee.currentAddress.line2}`}<br/>
                        {employee.currentAddress.city}, {employee.currentAddress.state} - {employee.currentAddress.pincode}
                      </>
                    ) : 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Permanent Address</p>
                  <p className="text-sm font-medium">
                    {employee.permanentAddress?.line1 ? (
                      <>
                        {employee.permanentAddress.line1}{employee.permanentAddress.line2 && `, ${employee.permanentAddress.line2}`}<br/>
                        {employee.permanentAddress.city}, {employee.permanentAddress.state} - {employee.permanentAddress.pincode}
                      </>
                    ) : 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card className="shadow-md">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[hsl(var(--primary))]" />
              Bank Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Bank Name</p>
                <p className="text-sm font-medium">{employee.bankDetails?.bankName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Account Name</p>
                <p className="text-sm font-medium">{employee.bankDetails?.accountName || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Account Number</p>
                <p className="text-sm font-medium">{employee.bankDetails?.accountNumber || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">IFSC Code</p>
                <p className="text-sm font-medium">{employee.bankDetails?.ifscCode || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Identity Documents */}
        <Card className="shadow-md">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <IdCard className="h-4 w-4 text-[hsl(var(--primary))]" />
              Identity Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg bg-[hsl(var(--muted)/0.3)]">
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Aadhar Card</p>
                <p className="text-sm font-medium">{employee.aadharNumber || 'Not provided'}</p>
                {employee.aadharUrl && (
                  <a 
                    href={employee.aadharUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-[hsl(var(--primary))] hover:underline font-medium"
                  >
                    View Document <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="p-3 border rounded-lg bg-[hsl(var(--muted)/0.3)]">
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">PAN Card</p>
                <p className="text-sm font-medium uppercase">{employee.panNumber || 'Not provided'}</p>
                {employee.panUrl && (
                  <a 
                    href={employee.panUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-[hsl(var(--primary))] hover:underline font-medium"
                  >
                    View Document <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="shadow-md mb-6">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-[hsl(var(--destructive))]" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
             <div className="space-y-3">
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Name</p>
                <p className="text-sm font-medium">{employee.emergencyContact?.name || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Phone</p>
                <p className="text-sm font-medium">{employee.emergencyContact?.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Relationship</p>
                <p className="text-sm font-medium">{employee.emergencyContact?.relationship || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
