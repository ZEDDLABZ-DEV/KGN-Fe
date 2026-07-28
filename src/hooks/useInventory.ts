/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { Request } from "../utils/Request"

export interface InventoryItem {
  id: string
  name: string
  unit: string
  createdAt?: string
  updatedAt?: string
}

export interface ProjectStockRow {
  inventoryItemId: string
  name: string
  unit: string
  currentStock: number
}

export interface ProjectStockResult {
  project: { id: string; name: string; projectId?: string }
  stock: ProjectStockRow[]
}

export interface MaterialStockRow {
  projectId: string
  projectName: string
  currentStock: number
}

export interface MaterialStockResult {
  inventoryItem: { id: string; name: string; unit: string }
  stock: MaterialStockRow[]
}

export type InventoryMovementType = "IN" | "OUT"

export interface InventoryMovement {
  id: string
  inventoryItemId: string
  projectId: string
  type: InventoryMovementType
  quantity: number
  unit: string
  referenceType?: string
  referenceId?: string
  notes?: string
  createdById?: string
  createdAt?: string
  inventoryItem?: { id: string; name: string; unit: string }
  project?: { id: string; name: string; projectId?: string }
}

export interface MovementFilters {
  projectId?: string
  inventoryItemId?: string
  type?: InventoryMovementType
}

export interface IssueMaterialPayload {
  projectId: string
  inventoryItemId: string
  quantity: number
  notes?: string
}

/**
 * The `Request` interceptor already unwraps the outer axios envelope, but
 * individual inventory endpoints may still hand back either the bare payload
 * directly or one further `{ data: ... }` wrapper — never assume one shape.
 */
function unwrapBody<T>(res: any): T {
  if (res && typeof res === "object" && !Array.isArray(res) && "data" in res) return res.data as T
  return res as T
}

/**
 * Single source of truth for Inventory data-fetching + the one mutation
 * ("Issue Material"). Owns loading state per resource, exposes plain async
 * methods, never toasts itself — the calling page/component decides how to
 * surface errors.
 */
export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)

  const [projectStock, setProjectStock] = useState<ProjectStockResult | null>(null)
  const [projectStockLoading, setProjectStockLoading] = useState(false)

  const [materialStock, setMaterialStock] = useState<MaterialStockResult | null>(null)
  const [materialStockLoading, setMaterialStockLoading] = useState(false)

  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)

  const loadItems = async () => {
    setItemsLoading(true)
    try {
      const res: any = await Request.get("/v1/api/inventory/items")
      const loaded = unwrapBody<InventoryItem[]>(res) || []
      setItems(loaded)
      return loaded
    } finally {
      setItemsLoading(false)
    }
  }

  const loadProjectStock = async (projectId: string) => {
    setProjectStockLoading(true)
    try {
      const res: any = await Request.get(`/v1/api/inventory/stock/project/${projectId}`)
      const loaded = unwrapBody<ProjectStockResult>(res)
      setProjectStock(loaded)
      return loaded
    } finally {
      setProjectStockLoading(false)
    }
  }

  const clearProjectStock = () => setProjectStock(null)

  const loadMaterialStock = async (inventoryItemId: string) => {
    setMaterialStockLoading(true)
    try {
      const res: any = await Request.get(`/v1/api/inventory/stock/material/${inventoryItemId}`)
      const loaded = unwrapBody<MaterialStockResult>(res)
      setMaterialStock(loaded)
      return loaded
    } finally {
      setMaterialStockLoading(false)
    }
  }

  const clearMaterialStock = () => setMaterialStock(null)

  const loadMovements = async (filters?: MovementFilters) => {
    setMovementsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters?.projectId) params.set("projectId", filters.projectId)
      if (filters?.inventoryItemId) params.set("inventoryItemId", filters.inventoryItemId)
      if (filters?.type) params.set("type", filters.type)
      const query = params.toString()
      const res: any = await Request.get(`/v1/api/inventory/movements${query ? `?${query}` : ""}`)
      const loaded = unwrapBody<InventoryMovement[]>(res) || []
      setMovements(loaded)
      return loaded
    } finally {
      setMovementsLoading(false)
    }
  }

  const issueMaterial = async (payload: IssueMaterialPayload) => Request.post("/v1/api/inventory/issue", payload)

  return {
    items,
    itemsLoading,
    loadItems,
    projectStock,
    projectStockLoading,
    loadProjectStock,
    clearProjectStock,
    materialStock,
    materialStockLoading,
    loadMaterialStock,
    clearMaterialStock,
    movements,
    movementsLoading,
    loadMovements,
    issueMaterial,
  }
}
