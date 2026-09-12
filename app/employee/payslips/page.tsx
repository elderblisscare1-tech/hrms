"use client";

import React, { useState, useEffect } from "react";
import { useRequireAuth } from "@/lib/auth/auth-context";
import { listDocuments } from "@/lib/firebase/firestore";
import type { Payslip } from "@/lib/schemas/payroll";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Download, Calendar } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function EmployeePayslipsPage() {
  const { claims } = useRequireAuth();
  const [payslips, setPayslips] = useState<(Payslip & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!claims?.companyId || !claims?.employeeId) return;
      try {
        const allPayslips = await listDocuments<Payslip>(claims.companyId, "payslips");
        const myPayslips = allPayslips.filter(p => p.employeeId === claims.employeeId);
        
        // Sort by year and month descending
        myPayslips.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        
        setPayslips(myPayslips);
      } catch (err) {
        console.error("Error fetching payslips:", err);
      } finally {
        setLoading(false);
      }
    }
    if (claims) fetchData();
  }, [claims]);

  const getMonthName = (monthNum: number) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Payslips</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">View and download your salary slips</p>
      </div>

      <div>
        {payslips.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />}
            title="No Payslips Yet"
            description="Your payslips will appear here once payroll is processed."
          />
        ) : (
          <div className="space-y-4">
            {payslips.map((payslip) => (
              <Card key={payslip.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-5 flex items-center justify-between border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                        <Receipt className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{getMonthName(payslip.month)} {payslip.year}</h3>
                        <div className="flex items-center gap-2 mt-1">
                           <Badge variant="outline" className="text-xs font-normal">
                             Net Pay: {formatCurrency(payslip.netPay)}
                           </Badge>
                           <Badge className={payslip.status === 'paid' ? 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.2)] border-none' : 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)/0.2)] border-none'}>
                             {payslip.status}
                           </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[hsl(var(--muted)/0.3)] p-4 flex justify-between items-center">
                    <div className="flex gap-4">
                      <div className="text-sm">
                        <span className="text-[hsl(var(--muted-foreground))] block text-xs">Gross Pay</span>
                        <span className="font-medium">{formatCurrency(payslip.grossPay)}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => alert("Downloading feature coming soon!")}>
                      <Download className="h-4 w-4" /> Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
