"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments } from "@/lib/firebase/firestore";
import type { Asset } from "@/lib/schemas/asset";
import type { Employee } from "@/lib/schemas/employee";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Laptop, Plus, Tag, Monitor, Smartphone } from "lucide-react";

export default function AssetsPage() {
  const companyId = useCompanyId();
  const [assets, setAssets] = useState<(Asset & { id: string })[]>([]);
  const [employees, setEmployees] = useState<(Employee & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [assetData, empData] = await Promise.all([
          listDocuments<Asset>(companyId, "assets"),
          listDocuments<Employee>(companyId, "employees")
        ]);
        setAssets(assetData);
        setEmployees(empData);
      } catch (error) {
        console.error("Error fetching asset data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [companyId]);

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "laptop": return <Laptop className="h-5 w-5" />;
      case "monitor": return <Monitor className="h-5 w-5" />;
      case "phone": return <Smartphone className="h-5 w-5" />;
      default: return <Tag className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">IT Assets</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage devices and equipment</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Asset</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Inventory</CardTitle>
          <CardDescription>Track assignments and status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
          ) : assets.length === 0 ? (
            <EmptyState
              icon={<Laptop className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />}
              title="No assets found"
              description="Add your first company asset."
              action={{ label: "Add Asset", onClick: () => {} }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))]">
                    <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Asset</th>
                    <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Assigned To</th>
                    <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Status</th>
                    <th className="text-right text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => {
                    const emp = employees.find(e => e.id === asset.assignedTo);
                    const empName = emp ? `${emp.firstName} ${emp.lastName}` : "Unassigned";

                    return (
                      <tr key={asset.id} className="border-b border-[hsl(var(--border)/0.5)] hover:bg-[hsl(var(--secondary)/0.3)] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[hsl(var(--primary)/0.1)] rounded-lg text-[hsl(var(--primary))]">
                              {getIcon(asset.type)}
                            </div>
                            <div>
                              <p className="font-medium">{asset.name}</p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">SN: {asset.serialNumber || "N/A"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{empName}</td>
                        <td className="p-4">
                          <Badge variant={asset.status === "assigned" ? "success" : asset.status === "available" ? "info" : "warning"}>
                            {asset.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm">Manage</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
