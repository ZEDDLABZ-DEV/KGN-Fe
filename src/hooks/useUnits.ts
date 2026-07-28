/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { Request } from "../utils/Request"

export type UnitStatus = "ACTIVE" | "INACTIVE"
export type UnitStatusFilter = UnitStatus | "ALL"

export interface Unit {
  id: string
  name: string
  status: UnitStatus
  createdById: string | null
  createdAt: string
  updatedAt: string
}

let activeUnitsCache: Unit[] | null = null
let activeUnitsPromise: Promise<Unit[]> | null = null

/** Call after any admin mutation (create/rename/status/delete) so dropdowns pick up the change. */
export function invalidateActiveUnitsCache() {
  activeUnitsCache = null
  activeUnitsPromise = null
}

/**
 * Memoized fetch of the active units list. Many `UnitSelect` dropdowns can be
 * rendered at once (one per item row) — this ensures a single network request
 * is shared across all of them instead of firing one per row.
 */
export function fetchActiveUnits(): Promise<Unit[]> {
  if (activeUnitsCache) return Promise.resolve(activeUnitsCache)
  if (activeUnitsPromise) return activeUnitsPromise

  activeUnitsPromise = Request.get("/v1/api/units?status=ACTIVE")
    .then((res: any) => {
      const units: Unit[] = res?.data || []
      activeUnitsCache = units
      return units
    })
    .catch((err) => {
      activeUnitsPromise = null
      throw err
    })

  return activeUnitsPromise
}

/**
 * Single source of truth for Units-of-Measurement data-fetching + mutations,
 * used by the admin Units page. Owns `loading` state, never toasts itself —
 * the calling page decides how to surface errors.
 */
export function useUnits() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(false)

  const loadUnits = async (status: UnitStatusFilter = "ALL") => {
    setLoading(true)
    try {
      const res: any = await Request.get(`/v1/api/units?status=${status}`)
      const loaded: Unit[] = res?.data || []
      setUnits(loaded)
      return loaded
    } finally {
      setLoading(false)
    }
  }

  const createUnit = async (name: string) => Request.post("/v1/api/units", { name })

  const renameUnit = async (id: string, name: string) => Request.put(`/v1/api/units/${id}`, { name })

  const changeUnitStatus = async (id: string, status: UnitStatus) =>
    Request.patch(`/v1/api/units/${id}/status`, { status })

  const deleteUnit = async (id: string) => Request.delete(`/v1/api/units/${id}`)

  return {
    units,
    loading,
    loadUnits,
    createUnit,
    renameUnit,
    changeUnitStatus,
    deleteUnit,
  }
}
