/* eslint-disable @typescript-eslint/no-explicit-any */
export const getRoleName = (user: any): string =>
  (typeof user?.role === "string" ? user.role : user?.role?.name)?.toLowerCase?.() ?? ""

export const isAdmin = (user: any): boolean => ["admin", "super_admin"].includes(getRoleName(user))

export const isAccountant = (user: any): boolean => getRoleName(user) === "accountant"

export const isSupervisor = (user: any): boolean => getRoleName(user) === "supervisor"

export const canManagePurchaseOrders = (user: any): boolean => isAdmin(user)

export const canManageGRN = (user: any): boolean => isAdmin(user) || isAccountant(user)

// Inventory has no create/approval workflow of its own — stock reads are open to
// everyone who touches procurement or money; only the "Issue Material" mutation
// is narrower, excluding accountant.
export const canViewInventory = (user: any): boolean => isAdmin(user) || isAccountant(user) || isSupervisor(user)
export const canIssueInventory = (user: any): boolean => isAdmin(user) || isSupervisor(user)
