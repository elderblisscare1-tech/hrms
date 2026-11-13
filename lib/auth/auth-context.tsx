"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { type User } from "firebase/auth";
import { onAuthChange, getUserClaims, type UserClaims } from "@/lib/firebase/auth";
import type { Role } from "@/lib/schemas/role";
import {
  fetchRoleDefinition,
  hasSectionPermission,
  getUserAccessDetails,
} from "@/lib/auth/rbac";

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
  access: ReturnType<typeof getUserAccessDetails>;
}

const defaultAccess = {
  isSuperAdmin: false,
  isAdmin: false,
  canAccessAdminPortal: false,
  canAccessEmployeePortal: false,
  firstAdminRoute: "/admin/dashboard",
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  claims: null,
  roleDoc: null,
  loading: true,
  error: null,
  refreshClaims: async () => {},
  hasPermission: () => false,
  access: defaultAccess,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    claims: null,
    roleDoc: null,
    loading: true,
    error: null,
  });

  const hasPermission = useCallback(
    (section: string) => {
      return hasSectionPermission(section, state.claims, state.roleDoc);
    },
    [state.claims, state.roleDoc]
  );

  const refreshClaims = useCallback(async () => {
    if (!state.user) return;
    try {
      const claims = await getUserClaims(state.user);
      const companyId = claims.companyId || "demo_company";
      const roleDoc = await fetchRoleDefinition(companyId, claims.role);
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
          const companyId = claims.companyId || "demo_company";
          const roleDoc = await fetchRoleDefinition(companyId, claims.role);
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

  const access = useMemo(() => {
    return getUserAccessDetails(state.claims, state.roleDoc);
  }, [state.claims, state.roleDoc]);

  return (
    <AuthContext.Provider value={{ ...state, refreshClaims, hasPermission, access }}>
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
