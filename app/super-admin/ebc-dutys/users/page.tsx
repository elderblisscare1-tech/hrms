"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EbcUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">Manage caregivers and customers from the EBC Dutys app.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-muted-foreground border rounded-md">
            Users table will be implemented here. Fetching from users_ebcdutys collection.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
