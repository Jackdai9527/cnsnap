export const adminRoleValues = [
  "super_admin",
  "operations",
  "purchasing",
  "warehouse",
  "finance",
  "customer_support",
  "content_manager"
] as const;

export type AdminRole = (typeof adminRoleValues)[number];

export const allAdminRoleValues = ["admin", ...adminRoleValues] as const;

export type AppRole = AdminRole | "admin" | "user";
export type NormalizedRole = AdminRole | "user";

const adminRoleSet = new Set<string>(allAdminRoleValues);

export const adminRoleFilterValues = [...allAdminRoleValues];

const sharedViewPermissions = ["dashboard.view"] as const;
const orderAdminPermissions = ["orders.view", "orders.update", "orders.manage", "orders.refund", "orders.export"] as const;
const financeAdminPermissions = [
  "finance.view",
  "payments.view",
  "payments.update",
  "wallet_transactions.view",
  "recharges.view",
  "refunds.view",
  "refunds.update",
  "refunds.approve",
  "exchange_rate.manage",
  "service_fee.manage"
] as const;
export const rolePermissions = {
  super_admin: ["*"],
  operations: [
    ...sharedViewPermissions,
    ...orderAdminPermissions,
    "diy_orders.view",
    "order_logs.view",
    "packages.view",
    "packages.update",
    "warehouse.view",
    "shipping_records.view",
    "products.view",
    "value_added_services.view",
    "value_added_services.manage",
    "api_logs.view",
    "users.view",
    "tickets.manage",
    "user_addresses.view",
    "risk_users.view",
    "support.view",
    "reports.view",
    "legacy.view"
  ],
  purchasing: [
    ...sharedViewPermissions,
    "orders.view",
    "orders.update",
    "diy_orders.view",
    "products.view",
    "value_added_services.view",
    "api_logs.view",
    "order_logs.view"
  ],
  warehouse: [
    ...sharedViewPermissions,
    "orders.view",
    "packages.view",
    "packages.update",
    "warehouse.view",
    "shipping_records.view",
    "shipping.view",
    "shipping_calculator.view"
  ],
  finance: [
    ...sharedViewPermissions,
    "orders.view",
    "orders.refund",
    ...financeAdminPermissions
  ],
  customer_support: [
    ...sharedViewPermissions,
    "orders.view",
    "packages.view",
    "users.view",
    "tickets.manage",
    "user_addresses.view",
    "risk_users.view",
    "support.view",
    "help_articles.manage"
  ],
  content_manager: [
    ...sharedViewPermissions,
    "content.view",
    "pages.manage",
    "footer.manage",
    "seo.manage",
    "media_library.manage",
    "help_articles.manage",
    "faq.manage",
    "announcements.manage",
    "email_templates.manage",
    "support.view"
  ]
} satisfies Record<AdminRole, readonly string[]>;

const permissionAliases: Record<string, readonly string[]> = {
  "general_settings.manage": ["settings.manage"],
  "api_settings.manage": ["settings.manage"],
  "smtp_settings.manage": ["settings.manage"],
  "auth_settings.manage": ["settings.manage"],
  "language_settings.manage": ["settings.manage"],
  "currency_settings.manage": ["settings.manage"],
  "sensitive_keywords.manage": ["settings.manage"],
  "admin_users.manage": ["admins.manage"],
  "refunds.approve": ["refunds.update", "orders.refund"],
  "orders.manage": ["orders.update"],
  "finance.view": ["payments.view", "wallet_transactions.view", "recharges.view", "refunds.view"]
};

export function normalizeRole(role?: string | null): NormalizedRole {
  if (role === "admin") return "super_admin";
  if (role && adminRoleValues.includes(role as AdminRole)) return role as AdminRole;
  return "user";
}

export function isAdminRole(role?: string | null) {
  return adminRoleSet.has(role ?? "") || normalizeRole(role) !== "user";
}

export function hasPermission(role: string | null | undefined, permission?: string) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "user") return false;
  if (!permission) return true;

  const permissions = rolePermissions[normalizedRole];
  if (permissions.includes("*") || permissions.includes(permission)) return true;

  const aliases = permissionAliases[permission] ?? [];
  return aliases.some((alias) => permissions.includes(alias));
}

export function assertPermission(role: string | null | undefined, permission?: string) {
  if (!hasPermission(role, permission)) {
    throw new Error(permission ? `Permission required: ${permission}` : "Admin access required.");
  }
}
