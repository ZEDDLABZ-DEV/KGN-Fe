/* eslint-disable @typescript-eslint/no-explicit-any */

export type VendorApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"
export type VendorAccountStatus = "ACTIVE" | "INACTIVE" | "BLOCKED"

export const unwrapVendorList = (res: any): any[] => {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.vendors)) return res.vendors
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data?.vendors)) return res.data.vendors
  return []
}

export const normalizeVendors = <T extends { id: string; name: string }>(res: any): T[] =>
  unwrapVendorList(res)
    .map((vendor) => ({
      ...vendor,
      id: String(vendor?.id ?? vendor?._id ?? ""),
      name: vendor?.name ?? vendor?.vendorName ?? "",
      approvalStatus: String(vendor?.approvalStatus || "PENDING").toUpperCase(),
      status: String(vendor?.status || "ACTIVE").toUpperCase(),
    }))
    .filter((vendor) => vendor.id && vendor.name) as T[]
