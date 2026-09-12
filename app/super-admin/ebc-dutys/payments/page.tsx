"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EbcPaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Earnings</h1>
          <p className="text-muted-foreground">Track payouts to caregivers and revenue from customers.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-muted-foreground border rounded-md">
            Payment logs and payout approvals will be shown here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
