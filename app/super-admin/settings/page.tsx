"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { uploadFile } from "@/lib/firebase/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Save } from "lucide-react";

interface CompanySettings {
  name: string;
  website: string;
  timezone: string;
  currency: string;
  workingHours: string;
  logoUrl?: string;
}

export default function SettingsPage() {
  const companyId = useCompanyId();
  const [settings, setSettings] = useState<CompanySettings>({
    name: "",
    website: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
    workingHours: "09:00 - 18:00",
    logoUrl: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchCompany() {
      try {
        const docRef = doc(db, "companies", companyId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setSettings({ ...settings, ...snapshot.data() } as CompanySettings);
        }
      } catch (error) {
        console.error("Error fetching company settings", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [companyId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, "companies", companyId);
      await setDoc(docRef, { ...settings }, { merge: true });
      alert("Settings saved successfully.");
    } catch (error) {
      console.error("Error saving settings", error);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const path = `companies/${companyId}/logo/${file.name}`;
      const downloadUrl = await uploadFile(path, file);
      setSettings(prev => ({ ...prev, logoUrl: downloadUrl }));
      
      // Auto-save just the logo
      const docRef = doc(db, "companies", companyId);
      await setDoc(docRef, { logoUrl: downloadUrl }, { merge: true });
      alert("Logo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading logo", error);
      alert("Failed to upload logo.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage company preferences</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving || loading}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/> General Settings</CardTitle>
            <CardDescription>Company details and core config</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-[hsl(var(--secondary))] rounded"></div>
                <div className="h-10 bg-[hsl(var(--secondary))] rounded"></div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input name="name" value={settings.name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website</label>
                  <Input name="website" value={settings.website} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timezone</label>
                  <select 
                    name="timezone"
                    value={settings.timezone}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency</label>
                  <select 
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Working Hours</label>
                  <Input name="workingHours" value={settings.workingHours} onChange={handleChange} placeholder="e.g. 09:00 - 18:00" />
                </div>
                
                <div className="space-y-2 pt-4 border-t border-[hsl(var(--border))]">
                  <label className="text-sm font-medium block">Company Logo</label>
                  <div className="flex items-center gap-4">
                    {settings.logoUrl ? (
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-white border border-[hsl(var(--border))] flex items-center justify-center shrink-0">
                        <img src={settings.logoUrl} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0 text-[hsl(var(--muted-foreground))]">
                        <span className="text-xs">No Logo</span>
                      </div>
                    )}
                    <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={saving} className="flex-1" />
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Upload a square image for best results (PNG or JPG).</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
