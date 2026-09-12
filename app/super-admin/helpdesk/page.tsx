"use client";

import React, { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/auth/auth-context";
import { listDocuments } from "@/lib/firebase/firestore";
import type { HelpdeskTicket } from "@/lib/schemas/helpdesk";
import type { Employee } from "@/lib/schemas/employee";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TicketCheck, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function HelpdeskPage() {
  const companyId = useCompanyId();
  const [tickets, setTickets] = useState<(HelpdeskTicket & { id: string })[]>([]);
  const [employees, setEmployees] = useState<(Employee & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ticketData, empData] = await Promise.all([
          listDocuments<HelpdeskTicket>(companyId, "helpdeskTickets"),
          listDocuments<Employee>(companyId, "employees")
        ]);
        setTickets(ticketData);
        setEmployees(empData);
      } catch (error) {
        console.error("Error fetching helpdesk data", error);
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
          <h1 className="text-2xl font-bold">Helpdesk</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage employee support tickets</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Support requests across the organization</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={<TicketCheck className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />}
              title="No tickets"
              description="You have no open support tickets."
              action={{ label: "Refresh", onClick: () => {} }}
            />
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => {
                const emp = employees.find(e => e.id === ticket.employeeId);
                const empName = emp ? `${emp.firstName} ${emp.lastName}` : "Unknown Employee";

                return (
                  <div key={ticket.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] transition-colors">
                    <div className="flex items-start gap-4 mb-3 sm:mb-0">
                      <Avatar className="h-10 w-10 mt-1">
                        <AvatarFallback>{empName.split(" ").map(n => n[0]).join("").substring(0,2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-sm">{ticket.subject}</h4>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-1">{ticket.description}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Requested by {empName} • {ticket.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={
                        ticket.status === "open" ? "warning" : 
                        ticket.status === "in_progress" ? "info" : "success"
                      }>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-[hsl(var(--muted-foreground))] capitalize">
                        {ticket.priority} Priority
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
