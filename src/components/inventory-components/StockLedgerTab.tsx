import { useEffect, useState } from "react"
import { Empty, Select, Skeleton } from "antd"
import moment from "moment"
import { FiArrowDown, FiArrowUp, FiRefreshCw } from "react-icons/fi"
import { useInventory, type InventoryItem, type InventoryMovementType } from "../../hooks/useInventory"
import { getApiErrorMessage } from "../../utils/apiError"
import { ErrorState } from "./ErrorState"

interface Project {
  id: string
  name: string
  projectId?: string
}

interface StockLedgerTabProps {
  projects: Project[]
  items: InventoryItem[]
  refreshToken: number
}

type TypeFilter = InventoryMovementType | "ALL"

const TYPE_OPTIONS: { label: string; value: TypeFilter }[] = [
  { label: "All Types", value: "ALL" },
  { label: "IN", value: "IN" },
  { label: "OUT", value: "OUT" },
]

/** Full chronological movement log (IN from GRNs, OUT from Issue Material), filterable by project/type/material. */
export const StockLedgerTab = ({ projects, items, refreshToken }: StockLedgerTabProps) => {
  const [projectFilter, setProjectFilter] = useState<string | undefined>(undefined)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL")
  const [itemFilter, setItemFilter] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const { movements, movementsLoading, loadMovements } = useInventory()

  const fetchMovements = async () => {
    setError(null)
    try {
      await loadMovements({
        projectId: projectFilter,
        inventoryItemId: itemFilter,
        type: typeFilter === "ALL" ? undefined : typeFilter,
      })
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load stock ledger"))
    }
  }

  useEffect(() => {
    fetchMovements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectFilter, typeFilter, itemFilter, refreshToken])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            placeholder="Project"
            value={projectFilter}
            onChange={setProjectFilter}
            allowClear
            showSearch
            className="w-48"
            filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            options={projects.map((p) => ({ label: p.name, value: p.id }))}
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            className="w-36"
            options={TYPE_OPTIONS}
          />
          <Select
            placeholder="Material"
            value={itemFilter}
            onChange={setItemFilter}
            allowClear
            showSearch
            className="w-56"
            filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            options={items.map((item) => ({ label: `${item.name} (${item.unit})`, value: item.id }))}
          />
        </div>

        <button
          onClick={fetchMovements}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <FiRefreshCw size={14} />
          Refresh
        </button>
      </div>

      {movementsLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <ErrorState message={error} onRetry={fetchMovements} />
        </div>
      ) : movements.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No stock movements found." />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100 overflow-hidden">
          {movements.map((movement) => {
            const isIn = movement.type === "IN"
            const reference =
              movement.referenceType && movement.referenceId
                ? `${movement.referenceType} #${movement.referenceId.slice(0, 8)}`
                : movement.referenceType

            return (
              <div key={movement.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isIn ? "bg-emerald-50" : "bg-red-50"
                    }`}
                  >
                    {isIn ? (
                      <FiArrowDown className="text-emerald-600" size={16} />
                    ) : (
                      <FiArrowUp className="text-red-600" size={16} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {movement.inventoryItem?.name || "—"} · {movement.project?.name || "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {moment(movement.createdAt).format("DD MMM YYYY, hh:mm A")}
                      {reference ? ` · ${reference}` : ""}
                    </p>
                    {movement.notes && <p className="mt-1 text-xs text-gray-400">{movement.notes}</p>}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      isIn ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {movement.type}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {movement.quantity} {movement.unit}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
