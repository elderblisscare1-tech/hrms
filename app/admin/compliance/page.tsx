"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Shield, Plus, FileText, Download, CheckCircle2 } from "lucide-react";

interface Policy {
  id: string;
  title: string;
  description: string;
  version: string;
  status: "active" | "draft" | "archived";
  lastUpdated: string;
}

export default function CompliancePage() {
  const companyId = useCompanyId();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await listDocuments<Policy>(companyId, "policies");
        setPolicies(data);
      } catch (error) {
        console.error("Error fetching compliance data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [companyId]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Compliance & Policies</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage company policies and documents</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm"><Plus className="h-4 w-4 mr-2" />New Policy</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Policies</CardTitle>
          <CardDescription>Active and drafted policies for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
          ) : policies.length === 0 ? (
            <EmptyState
              icon={<Shield className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />}
              title="No policies found"
              description="Upload your company's HR and compliance policies."
              action={{ label: "Add Policy", onClick: () => {} }}
            />
          ) : (
            <div className="space-y-4">
              {policies.map((policy) => (
                <div key={policy.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] transition-colors">
                  <div className="flex items-start gap-4 mb-3 sm:mb-0">
                    <div className="p-3 bg-[hsl(var(--primary)/0.1)] rounded-xl text-[hsl(var(--primary))]">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{policy.title}</h4>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-1">{policy.description}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5 flex items-center gap-1">
                        Version {policy.version} • Last updated {policy.lastUpdated}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={policy.status === "active" ? "success" : "secondary"}>
                      {policy.status}
                    </Badge>
                    <Button variant="ghost" size="icon-sm" title="Download">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
