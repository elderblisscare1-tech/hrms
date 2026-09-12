"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EbcSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure global options for the EBC Dutys app.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>App Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-muted-foreground border rounded-md">
            Duty pricing, notification preferences, and other global EBC app settings will be configured here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
