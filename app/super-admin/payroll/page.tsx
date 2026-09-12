"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments } from "@/lib/firebase/firestore";
import type { PayrollRun } from "@/lib/schemas/payroll";
import type { Employee } from "@/lib/schemas/employee";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Wallet, Plus, Download, FileText, CheckCircle2, Clock } from "lucide-react";

export default function PayrollPage() {
  const companyId = useCompanyId();
  const [payrollRuns, setPayrollRuns] = useState<(PayrollRun & { id: string })[]>([]);
  const [employees, setEmployees] = useState<(Employee & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await listDocuments<PayrollRun>(companyId, "payrollRuns");
        data.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        setPayrollRuns(data);
        
        const empData = await listDocuments<Employee>(companyId, "employees");
        setEmployees(empData.filter(e => e.employmentStatus === "active"));
      } catch (error) {
        console.error("Error fetching payroll data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [companyId]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage salary runs and payslips</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export Reports</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-2" />New Run</Button>
        </div>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Employee Payment Details</CardTitle>
          <CardDescription>Bank accounts and UPI QR codes for salary transfers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Employee</th>
                  <th className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Bank Details</th>
                  <th className="text-center text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider p-4">Payment QR</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const hasBank = emp.bankDetails?.accountNumber || emp.bankDetails?.upiId;
                  const qrSrc = emp.paymentQrUrl || (emp.bankDetails?.upiId ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${emp.bankDetails.upiId}&pn=${emp.firstName}` : null);
                  return (
                    <tr key={emp.id} className="border-b border-[hsl(var(--border)/0.5)] hover:bg-[hsl(var(--secondary)/0.3)] transition-colors">
                      <td className="p-4">
                        <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{emp.role}</p>
                      </td>
                      <td className="p-4">
                        {hasBank ? (
                          <div className="text-sm space-y-1">
                            {emp.bankDetails?.accountNumber && <p><span className="text-[hsl(var(--muted-foreground))]">A/C:</span> {emp.bankDetails.accountNumber}</p>}
                            {emp.bankDetails?.ifscCode && <p><span className="text-[hsl(var(--muted-foreground))]">IFSC:</span> {emp.bankDetails.ifscCode}</p>}
                            {emp.bankDetails?.bankName && <p><span className="text-[hsl(var(--muted-foreground))]">Bank:</span> {emp.bankDetails.bankName}</p>}
                            {emp.bankDetails?.upiId && <p><span className="text-[hsl(var(--muted-foreground))]">UPI:</span> {emp.bankDetails.upiId}</p>}
                          </div>
                        ) : (
                          <span className="text-sm text-[hsl(var(--muted-foreground))] italic">No details added</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {qrSrc ? (
                          <div className="flex justify-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={qrSrc} alt="Payment QR" className="h-16 w-16 object-contain rounded-md border border-[hsl(var(--border))]" />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md flex justify-center items-center p-6">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={qrSrc} alt="Payment QR Full" className="w-full max-w-sm h-auto object-contain rounded-md" />
                              </DialogContent>
                            </Dialog>
                          </div>
                        ) : (
                          <span className="text-xs text-[hsl(var(--muted-foreground))] italic">N/A</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-[hsl(var(--muted-foreground))]">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
