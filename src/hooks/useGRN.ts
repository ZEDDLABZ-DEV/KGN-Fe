/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import moment from "moment"
import { Request } from "../utils/Request"

export const GRN_STATUSES = ["PENDING", "COMPLETED", "PARTIALLY_RECEIVED", "REJECTED"] as const
export type GRNStatus = typeof GRN_STATUSES[number]

export interface GRNItem {
  id?: string
  purchaseOrderItemId: string
  itemName?: string
  unit?: string
  orderedQuantity?: number
  receivedQuantity: number
  damagedQuantity: number
  pendingQuantity?: number
  remarks?: string
}

export interface GRN {
  id: string
  grnNumber?: string
  purchaseOrderId: string
  receivedBy: string
  receivedDate: string
  status: GRNStatus
  remarks?: string
  items: GRNItem[]
  createdAt?: string
  updatedAt?: string
}

export interface GRNSummaryItem {
  itemId: string
  itemName: string
  unit: string
  orderedQuantity: number
  receivedQuantity: number
  damagedQuantity: number
  pendingQuantity: number
  unitPrice: number
  totalPrice: number
}

export interface GRNListFilters {
  status?: string
  projectId?: string
  purchaseOrderId?: string
}

/**
 * Single source of truth for GRN data-fetching + mutations, shared by the
 * standalone GRN page and the GRN section embedded on the Purchase Orders page.
 */
export function useGRN() {
  const [grns, setGrns] = useState<GRN[]>([])
  const [summary, setSummary] = useState<GRNSummaryItem[] | null>(null)
  const [loading, setLoading] = useState(false)

  const loadForPurchaseOrder = async (purchaseOrderId: string) => {
    setLoading(true)
    try {
      const [grnsRes, summaryRes]: [any, any] = await Promise.all([
        Request.get(`/v1/api/grn/purchase-order/${purchaseOrderId}`),
        Request.get(`/v1/api/grn/summary/purchase-order/${purchaseOrderId}`),
      ])
      const loadedGrns: GRN[] = grnsRes?.data || []
      const loadedSummary: GRNSummaryItem[] = summaryRes?.data?.summary || summaryRes?.summary || []
      setGrns(loadedGrns)
      setSummary(loadedSummary)
      return { grns: loadedGrns, summary: loadedSummary }
    } finally {
      setLoading(false)
    }
  }

  const loadAll = async (filters?: GRNListFilters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.set("status", filters.status)
      if (filters?.projectId) params.set("projectId", filters.projectId)
      if (filters?.purchaseOrderId) params.set("purchaseOrderId", filters.purchaseOrderId)
      const query = params.toString()
      const res: any = await Request.get(`/v1/api/grn${query ? `?${query}` : ""}`)
      const loadedGrns: GRN[] = res?.data || []
      setGrns(loadedGrns)
      return loadedGrns
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setGrns([])
    setSummary(null)
  }

  const createGRN = async (payload: any) => Request.post("/v1/api/grn", payload)

  const updateGRN = async (id: string, payload: any) => Request.put(`/v1/api/grn/${id}`, payload)

  const deleteGRN = async (id: string) => Request.delete(`/v1/api/grn/${id}`)

  const changeGRNStatus = async (id: string, status: string) => Request.patch(`/v1/api/grn/${id}/status`, { status })

  return {
    grns,
    summary,
    loading,
    loadForPurchaseOrder,
    loadAll,
    clear,
    createGRN,
    updateGRN,
    deleteGRN,
    changeGRNStatus,
  }
}

/** GRN creation is only allowed while the PO is in one of these statuses. */
export function canCreateGRNForPurchaseOrder(po: { status?: string } | null | undefined): boolean {
  return ["SENT", "APPROVED", "PARTIALLY_RECEIVED"].includes((po?.status || "").toUpperCase())
}

/**
 * Client-side pre-check mirroring backend validation (the backend remains the
 * source of truth). Returns a human-readable error naming the offending item,
 * or null if every line is valid.
 */
export function validateGRNLines(
  lines: Array<{ itemName?: string; purchaseOrderItemId: string; receivedQuantity: number; damagedQuantity: number }>,
  summary: GRNSummaryItem[] | null,
  extraAllowanceByItemId?: Map<string, number>
): string | null {
  if (lines.length === 0) {
    return "At least one item must have a non-zero received or damaged quantity"
  }

  for (const line of lines) {
    const name = line.itemName || "This item"

    if ((line.receivedQuantity || 0) < 0 || (line.damagedQuantity || 0) < 0) {
      return `${name}: quantities cannot be negative`
    }

    if (line.damagedQuantity > line.receivedQuantity) {
      return `${name}: damaged quantity cannot exceed received quantity`
    }

    const summaryItem = summary?.find((s) => s.itemId === line.purchaseOrderItemId)
    if (summaryItem) {
      const extraAllowance = extraAllowanceByItemId?.get(line.purchaseOrderItemId) || 0
      const maxAllowed = (summaryItem.pendingQuantity || 0) + extraAllowance
      if (line.receivedQuantity > maxAllowed) {
        return `${name}: received quantity cannot exceed the pending quantity (${maxAllowed})`
      }
    }
  }

  return null
}

/** Rows left at 0 received AND 0 damaged are silently dropped before validating/submitting. */
export function getSubmittableGRNLines<T extends { receivedQuantity: number; damagedQuantity: number }>(
  lines: T[]
): T[] {
  return lines.filter((l) => (l.receivedQuantity || 0) > 0 || (l.damagedQuantity || 0) > 0)
}

/** receivedDate must be within 365 days in the past through 1 day in the future. */
export function isReceivedDateValid(date: Date | string | null | undefined): boolean {
  const diffDays = moment(date).diff(moment().startOf("day"), "days")
  return moment(date).isValid() && diffDays <= 1 && diffDays >= -365
}
