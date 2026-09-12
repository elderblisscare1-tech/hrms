"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type User } from "firebase/auth";
import { onAuthChange, getUserClaims, type UserClaims } from "@/lib/firebase/auth";
import { getDocument } from "@/lib/firebase/firestore";
import type { Role } from "@/lib/schemas/role";

interface AuthState {
  user: User | null;
  claims: UserClaims | null;
  roleDoc: Role | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  refreshClaims: () => Promise<void>;
  hasPermission: (section: string) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  claims: null,
  roleDoc: null,
  loading: true,
  error: null,
  refreshClaims: async () => {},
  hasPermission: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    claims: null,
    roleDoc: null,
    loading: true,
    error: null,
  });

  const hasPermission = useCallback((section: string) => {
    if (state.claims?.role === "hr_admin" || state.claims?.role === "super_admin" || state.claims?.role === "admin") return true;
    if (!state.roleDoc) return false;
    return state.roleDoc.permissions.adminSections.includes(section);
  }, [state.claims, state.roleDoc]);

  const refreshClaims = useCallback(async () => {
    if (!state.user) return;
    try {
      const claims = await getUserClaims(state.user);
      let roleDoc: Role | null = null;
      if (claims.companyId && claims.role && claims.role !== "hr_admin" && claims.role !== "super_admin" && claims.role !== "admin") {
        try {
          roleDoc = await getDocument(claims.companyId, "roles", claims.role) as Role;
        } catch (e) {
          console.error("Failed to fetch role doc:", e);
        }
      }
      setState((prev) => ({ ...prev, claims, roleDoc }));
    } catch (err) {
      console.error("Failed to refresh claims:", err);
    }
  }, [state.user]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        try {
          const claims = await getUserClaims(user);
          let roleDoc: Role | null = null;
          if (claims.companyId && claims.role && claims.role !== "hr_admin" && claims.role !== "super_admin" && claims.role !== "admin") {
            try {
              roleDoc = await getDocument(claims.companyId, "roles", claims.role) as Role;
            } catch (e) {
              console.error("Failed to fetch role doc:", e);
            }
          }
          setState({ user, claims, roleDoc, loading: false, error: null });
        } catch {
          setState({ user, claims: null, roleDoc: null, loading: false, error: null });
        }
      } else {
        setState({ user: null, claims: null, roleDoc: null, loading: false, error: null });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, refreshClaims, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useRequireAuth() {
  const auth = useAuth();
  if (!auth.loading && !auth.user) {
    throw new Error("Authentication required");
  }
  return auth as AuthContextValue & { user: User; claims: UserClaims };
}

export function useCompanyId(): string {
  const { claims } = useAuth();
  if (!claims?.companyId) {
    throw new Error("Company ID not found in user claims");
  }
  return claims.companyId;
}
