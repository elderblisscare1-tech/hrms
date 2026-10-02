"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { clientSchema, type Client } from "@/lib/schemas/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Client>) => Promise<void>;
  initialData: (Client & { id: string }) | null;
}

type ClientFormValues = z.input<typeof clientSchema>;

export function ClientDialog({ isOpen, onClose, onSave, initialData }: ClientDialogProps) {
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      status: "active",
      notes: "",
      nokName: "",
      vendorName: "",
      staffName: "",
      number: "",
      dutyStartDate: "",
      dutyEndDate: "",
      staffType: "",
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        company: initialData.company || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        status: initialData.status || "active",
        notes: initialData.notes || "",
        nokName: initialData.nokName || "",
        vendorName: initialData.vendorName || "",
        staffName: initialData.staffName || "",
        number: initialData.number || "",
        dutyStartDate: initialData.dutyStartDate || "",
        dutyEndDate: initialData.dutyEndDate || "",
        staffType: initialData.staffType || "",
      });
    } else {
      reset({
        name: "",
        company: "",
        email: "",
        phone: "",
        address: "",
        status: "active",
        notes: "",
        nokName: "",
        vendorName: "",
        staffName: "",
        number: "",
        dutyStartDate: "",
        dutyEndDate: "",
      staffType: "",
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: ClientFormValues) => {
    await onSave(data as Partial<Client>);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Client" : "Add New Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="name">Client Name <span className="text-red-500">*</span></Label>
              <Input id="name" {...register("name")} placeholder="e.g. John Doe" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="company">Company</Label>
              <Input id="company" {...register("company")} placeholder="e.g. Acme Corp" />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="john@example.com" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} placeholder="+1 (555) 000-0000" />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} placeholder="123 Main St, City, Country" />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="nokName">NOK Name</Label>
              <Input id="nokName" {...register("nokName")} placeholder="e.g. Jane Doe" />
            </div>
            
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input id="vendorName" {...register("vendorName")} placeholder="e.g. Supplier Inc" />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="staffName">Staff Name</Label>
              <Input id="staffName" {...register("staffName")} placeholder="e.g. John Smith" />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="number">Number</Label>
              <Input id="number" {...register("number")} placeholder="e.g. 123456789" />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="dutyStartDate">Duty Start Date</Label>
              <Input id="dutyStartDate" type="date" {...register("dutyStartDate")} />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="dutyEndDate">Duty End Date</Label>
              <Input id="dutyEndDate" type="date" {...register("dutyEndDate")} />
            </div>
            
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Status</Label>
              <Select 
                defaultValue={initialData?.status || "active"} 
                onValueChange={(val) => setValue("status", val as "active" | "inactive")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Staff Type</Label>
              <Select onValueChange={(val) => setValue("staffType", val)} defaultValue={initialData?.staffType || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gda">GDA</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="semi nurse">Semi Nurse</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                {...register("notes")} 
                placeholder="Any additional information..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
