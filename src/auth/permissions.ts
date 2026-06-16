/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Role-Based Access Control (ref: BUSINESS_RULES.md §2 — Owner / Staff / Accountant)

export type Role = "OWNER" | "STAFF" | "ACCOUNTANT";

export function normalizeRole(role?: string | null): Role {
  const r = (role || "").toUpperCase();
  if (r === "STAFF") return "STAFF";
  if (r === "ACCOUNTANT") return "ACCOUNTANT";
  return "OWNER";
}

// Which sidebar/menu views each role may open.
export const ROLE_MENUS: Record<Role, string[]> = {
  OWNER: [
    "dashboard", "sales", "marketplace", "pos", "financial", "inventory",
    "operational", "risk", "geographic", "sharia", "ai_insights", "reports", "users", "settings"
  ],
  // Read-only finance: full visibility of money/zakat, but cannot operate the store.
  ACCOUNTANT: [
    "dashboard", "sales", "marketplace", "financial", "inventory",
    "operational", "risk", "geographic", "sharia", "ai_insights", "reports"
  ],
  // Daily operations only: no money figures, no reports, no compliance.
  STAFF: ["dashboard", "sales", "marketplace", "pos", "inventory", "operational", "geographic"]
};

// Action-level permissions.
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  OWNER: [
    "finance:view", "pos:checkout", "stock:write", "transactions:write", "zakat:pay",
    "settings:write", "data:reset", "risk:resolve", "reports:export", "recommendation:execute", "users:manage"
  ],
  ACCOUNTANT: ["finance:view", "reports:export"],
  STAFF: ["pos:checkout", "stock:write", "transactions:write"]
};

export function canAccessMenu(role: string | undefined, menu: string): boolean {
  return ROLE_MENUS[normalizeRole(role)].includes(menu);
}

export function can(role: string | undefined, permission: string): boolean {
  return ROLE_PERMISSIONS[normalizeRole(role)].includes(permission);
}

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  STAFF: "Staff",
  ACCOUNTANT: "Accountant"
};
