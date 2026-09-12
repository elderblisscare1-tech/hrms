"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments, createDocument, deleteDocument, updateDocument } from "@/lib/firebase/firestore";
import { uploadFile } from "@/lib/firebase/storage";
import type { Vendor } from "@/lib/schemas/vendor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Plus, Pencil, Trash2, Building2, Store, Search, Users, ExternalLink } from "lucide-react";

export default function VendorsPage() {
  const companyId = useCompanyId();
  const [vendors, setVendors] = useState<(Vendor & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<(Vendor & {id: string}) | null>(null);
  
  const [newVendorName, setNewVendorName] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newStaffList, setNewStaffList] = useState<{staffType: string, hours: string, rate: string}[]>([{ staffType: "", hours: "", rate: "" }]);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function fetchVendors() {
    try {
      const data = await listDocuments<Vendor>(companyId, "vendors");
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVendors();
  }, [companyId]);

  const handleSave = async () => {
    if (!newVendorName || !newCompanyName) return;
    setSaving(true);
    try {
      let finalPhotoUrl = newPhotoUrl;
      if (newPhotoFile) {
        setUploadingPhoto(true);
        try {
          finalPhotoUrl = await uploadFile(`companies/${companyId}/vendors/${Date.now()}_${newPhotoFile.name}`, newPhotoFile);
        } catch (e) {
          console.error("Failed to upload image", e);
          setUploadingPhoto(false);
          setSaving(false);
          alert("Failed to upload image. Please try again.");
          return;
        }
        setUploadingPhoto(false);
      }

      const staff = newStaffList.filter(s => s.staffType.trim() !== "");
      if (editingVendor) {
        await updateDocument(companyId, "vendors", editingVendor.id, {
          name: newVendorName,
          companyName: newCompanyName,
          phoneNumber: newPhoneNumber,
          photoUrl: finalPhotoUrl,
          staff: staff,
        });
      } else {
        await createDocument(companyId, "vendors", {
          name: newVendorName,
          companyName: newCompanyName,
          phoneNumber: newPhoneNumber,
          photoUrl: finalPhotoUrl,
          staff: staff,
          isActive: true,
          companyId: companyId
        });
      }
      setShowAddForm(false);
      resetForm();
      fetchVendors();
    } catch (error) {
      console.error("Error saving vendor", error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingVendor(null);
    setNewVendorName("");
    setNewCompanyName("");
    setNewPhoneNumber("");
    setNewPhotoFile(null);
    setNewPhotoUrl("");
    setNewStaffList([{ staffType: "", hours: "", rate: "" }]);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      try {
        await deleteDocument(companyId, "vendors", id);
        fetchVendors();
      } catch (error) {
        console.error("Error deleting vendor", error);
      }
    }
  };

  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.staff?.some(s => s.staffType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {loading ? "Loading..." : `${vendors.length} vendors managed`}
          </p>
        </div>
        <Button size="sm" onClick={() => {
          resetForm();
          setShowAddForm(!showAddForm);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card className="animate-slide-down border-[hsl(var(--primary)/0.3)]">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <Input placeholder="Vendor Name" value={newVendorName} onChange={(e) => setNewVendorName(e.target.value)} />
              <Input placeholder="Company Name" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} />
              <Input placeholder="Phone Number (Optional)" value={newPhoneNumber} onChange={(e) => setNewPhoneNumber(e.target.value)} />
              <div>
                <Input type="file" accept="image/*" onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setNewPhotoFile(e.target.files[0]);
                  }
                }} />
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">Profile Image (Optional)</p>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">Duty Details</h4>
                <Button size="sm" variant="outline" onClick={() => setNewStaffList([...newStaffList, {staffType: "", hours: "", rate: ""}])}>
                  <Plus className="h-3 w-3 mr-1" /> Add Duty
                </Button>
              </div>
              {newStaffList.map((staff, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input placeholder="Duty Type (e.g. Cleaner, Guard)" value={staff.staffType} onChange={(e) => {
                    const updated = [...newStaffList];
                    updated[index].staffType = e.target.value;
                    setNewStaffList(updated);
                  }} />
                  <Input placeholder="Hours (Optional, e.g. 8)" value={staff.hours || ""} onChange={(e) => {
                    const updated = [...newStaffList];
                    updated[index].hours = e.target.value;
                    setNewStaffList(updated);
                  }} />
                  <Input placeholder="Price/Rate (e.g. $1000/month)" value={staff.rate} onChange={(e) => {
                    const updated = [...newStaffList];
                    updated[index].rate = e.target.value;
                    setNewStaffList(updated);
                  }} />
                  <Button variant="ghost" size="icon" className="text-[hsl(var(--destructive))]" onClick={() => {
                    const updated = [...newStaffList];
                    updated.splice(index, 1);
                    setNewStaffList(updated.length ? updated : [{staffType: "", hours: "", rate: ""}]);
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { 
                setShowAddForm(false); 
                resetForm(); 
              }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || uploadingPhoto || !newVendorName || !newCompanyName}>
                {uploadingPhoto ? "Uploading..." : saving ? "Saving..." : editingVendor ? "Update" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <Input placeholder="Search vendors, companies, or duty types..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {/* Vendor Grid */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
        </div>
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={<Store className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />}
          title="No vendors found"
          description="Create your first vendor to start managing contracted duties."
          action={{ label: "Add Vendor", onClick: () => setShowAddForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((vendor) => (
            <Card key={vendor.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  {vendor.photoUrl ? (
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarImage src={vendor.photoUrl} alt={vendor.name} className="object-cover" />
                      <AvatarFallback>{vendor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[hsl(var(--primary)/0.1)]">
                      <Store className="h-5 w-5 text-[hsl(var(--primary))]" />
                    </div>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => {
                      setEditingVendor(vendor);
                      setNewVendorName(vendor.name);
                      setNewCompanyName(vendor.companyName);
                      setNewPhoneNumber(vendor.phoneNumber || "");
                      setNewPhotoUrl(vendor.photoUrl || "");
                      setNewPhotoFile(null);
                      setNewStaffList(vendor.staff?.length ? vendor.staff.map(s => ({ ...s, hours: s.hours || "" })) : [{ staffType: "", hours: "", rate: "" }]);
                      setShowAddForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-[hsl(var(--destructive))]" onClick={() => handleDelete(vendor.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-base">{vendor.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] mt-1">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{vendor.companyName}</span>
                  {vendor.phoneNumber && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{vendor.phoneNumber}</span>
                    </>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Duty Details</h4>
                  {vendor.staff && vendor.staff.length > 0 ? (
                    <div className="space-y-2">
                      {vendor.staff.map((s, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2 rounded bg-[hsl(var(--muted)/0.5)]">
                          <span className="font-medium">{s.staffType}</span>
                          <span className="text-[hsl(var(--muted-foreground))] text-right text-xs">
                            {s.hours && <>{s.hours} hours<br/></>}
                            <span className="font-semibold text-foreground">{s.rate}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] italic">No duties added.</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[hsl(var(--border)/0.5)]">
                  <Badge variant={vendor.isActive ? "success" : "secondary"} className="text-xs">
                    {vendor.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Link href={`/admin/vendors/${vendor.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-[hsl(var(--primary))] font-medium">
                      View Profile <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && vendors.length > 0 && (
             <div className="col-span-full text-center p-8 text-[hsl(var(--muted-foreground))]">
                No vendors match your search.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
