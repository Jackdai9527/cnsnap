"use client";

import { createContext, useContext, type ReactNode } from "react";
import { hasPermission } from "@/lib/auth/permissions";

const AdminPermissionContext = createContext<string>("user");

export function AdminPermissionProvider({ role, children }: { role: string; children: ReactNode }) {
  return <AdminPermissionContext.Provider value={role}>{children}</AdminPermissionContext.Provider>;
}

export function useAdminRole() {
  return useContext(AdminPermissionContext);
}

export function Can({ permission, children, fallback = null }: { permission: string; children: ReactNode; fallback?: ReactNode }) {
  const role = useAdminRole();
  if (!hasPermission(role, permission)) return <>{fallback}</>;
  return <>{children}</>;
}
