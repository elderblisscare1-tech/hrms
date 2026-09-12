"use client";

import React from "react";
import { BottomTabBar } from "@/components/shared/bottom-tab-bar";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] pb-20">
      <main className="max-w-lg mx-auto px-4 pt-4">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
