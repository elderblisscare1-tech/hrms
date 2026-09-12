"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCompanyId } from "@/lib/auth/auth-context";
import { getDocument, updateDocument, deleteDocument } from "@/lib/firebase/firestore";
import type { Vendor } from "@/lib/schemas/vendor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Store, Phone, Building2, Users, Power, Trash2, Loader2, Clock
} from "lucide-react";

export default function VendorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const companyId = useCompanyId();
  
  const [vendor, setVendor] = useState<(Vendor & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !id) return;
    
    const fetchVendor = async () => {
      try {
        const doc = await getDocument<Vendor>(companyId, "vendors", id);
        if (doc) {
          setVendor({ ...doc, id });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendor();
  }, [companyId, id]);

  const handleToggleStatus = async () => {
    if (!vendor) return;
    const statusToSet = !vendor.isActive;
    
    if (confirm(`Are you sure you want to mark this vendor as ${statusToSet ? "ACTIVE" : "INACTIVE"}?`)) {
      try {
        await updateDocument(companyId, "vendors", id, { isActive: statusToSet });
        setVendor({ ...vendor, isActive: statusToSet });
      } catch (err) {
        console.error("Error updating status:", err);
        alert("Failed to update status.");
      }
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to permanently delete this vendor? This action cannot be undone.")) {
      try {
        await deleteDocument(companyId, "vendors", id);
        router.push("/admin/vendors");
      } catch (err) {
        console.error("Error deleting vendor:", err);
        alert("Failed to delete vendor.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <p className="text-[hsl(var(--destructive))] font-medium">Vendor not found.</p>
        <Link href="/admin/vendors">
          <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2"/> Back to Vendors</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-10">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/vendors">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <h1 className="text-2xl font-bold">Vendor Profile</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleToggleStatus} 
            className={vendor.isActive ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]"}
          >
            <Power className="h-4 w-4 mr-2" />
            {vendor.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />Delete
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.8)] p-8 pt-12 pb-16 text-white text-center rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-4 right-20 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
        </div>
        
        <Avatar className="h-28 w-28 mx-auto mb-4 border-4 border-white shadow-md bg-white">
          {vendor.photoUrl ? (
            <AvatarImage src={vendor.photoUrl} alt={vendor.name} className="object-cover" />
          ) : (
            <AvatarFallback className="text-3xl bg-[hsl(var(--primary))] text-white font-bold">
              {vendor.name.charAt(0)}
            </AvatarFallback>
          )}
        </Avatar>
        <h1 className="text-3xl font-bold">{vendor.name}</h1>
        <div className="flex items-center justify-center gap-2 mt-2 opacity-90 text-sm font-medium">
          <Building2 className="h-4 w-4" />
          <span>{vendor.companyName}</span>
        </div>
        <div className="mt-4">
          <Badge variant={vendor.isActive ? "success" : "secondary"} className="bg-white text-black hover:bg-white">
            {vendor.isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
        </div>
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-8 px-4 relative z-10">
        
        {/* Contact Info */}
        <Card className="shadow-md">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-[hsl(var(--primary))]" />
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Phone Number</p>
                <p className="text-sm font-medium">{vendor.phoneNumber || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Company Name</p>
                <p className="text-sm font-medium">{vendor.companyName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Roster */}
        <Card className="shadow-md md:col-span-2">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-[hsl(var(--primary))]" />
                Contracted Duty Details
                </CardTitle>
                <Badge variant="outline">{vendor.staff?.length || 0} Types</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {vendor.staff && vendor.staff.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vendor.staff.map((staff, idx) => (
                        <div key={idx} className="p-4 border rounded-xl bg-[hsl(var(--muted)/0.3)] shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <h4 className="font-semibold">{staff.staffType}</h4>
                                <Badge variant="secondary" className="font-medium text-xs">
                                    {staff.rate}
                                </Badge>
                            </div>
                            <div className="flex items-center text-sm text-[hsl(var(--muted-foreground))] mt-auto pt-2 border-t border-[hsl(var(--border)/0.5)]">
                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                {staff.hours ? `${staff.hours} hours` : "Hours not specified"}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Store className="h-10 w-10 mx-auto text-[hsl(var(--muted-foreground)/0.5)] mb-3" />
                    <p className="text-[hsl(var(--muted-foreground))] text-sm">No duty details have been added for this vendor yet.</p>
                </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
