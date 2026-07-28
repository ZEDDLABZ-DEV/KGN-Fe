import { useState } from "react"
import { Empty, Input, Modal } from "antd"
import { FiFileText, FiSearch } from "react-icons/fi"
import { canCreateGRNForPurchaseOrder } from "../../hooks/useGRN"

export interface SelectablePurchaseOrder {
  id: string
  poNumber?: string
  status?: string
  vendorName?: string
  vendor?: { name?: string }
  materialRequest?: { project?: { name?: string } }
}

interface SelectPurchaseOrderModalProps {
  open: boolean
  purchaseOrders: SelectablePurchaseOrder[]
  loading?: boolean
  onClose: () => void
  onSelect: (po: SelectablePurchaseOrder) => void
}

/** PO picker used by "All GRNs" mode's New GRN button — lists only POs eligible for a new GRN. */
export const SelectPurchaseOrderModal = ({ open, purchaseOrders, loading, onClose, onSelect }: SelectPurchaseOrderModalProps) => {
  const [search, setSearch] = useState("")

  const eligible = purchaseOrders.filter(canCreateGRNForPurchaseOrder)
  const term = search.trim().toLowerCase()
  const filtered = eligible.filter((po) => {
    if (!term) return true
    const vendorName = po.vendor?.name || po.vendorName || ""
    const projectName = po.materialRequest?.project?.name || ""
    return (
      po.poNumber?.toLowerCase().includes(term) ||
      vendorName.toLowerCase().includes(term) ||
      projectName.toLowerCase().includes(term)
    )
  })

  return (
    <Modal
      title="Select a Purchase Order"
      open={open}
      onCancel={() => {
        setSearch("")
        onClose()
      }}
      footer={null}
      width={560}
      destroyOnClose
    >
      <div className="flex flex-col gap-3 pt-2">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search by PO number, vendor or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
            allowClear
          />
        </div>

        <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200">
          {loading ? (
            <div className="p-6 text-center text-sm text-gray-400">Loading purchase orders...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  eligible.length === 0
                    ? "No purchase orders are currently eligible for a new GRN"
                    : "No purchase orders match your search"
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((po) => (
                <button
                  key={po.id}
                  onClick={() => onSelect(po)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                    <FiFileText className="text-indigo-600" size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">{po.poNumber || `PO-${po.id.slice(0, 8)}`}</div>
                    <div className="truncate text-xs text-gray-500">
                      {po.vendor?.name || po.vendorName || "—"}
                      {po.materialRequest?.project?.name ? ` · ${po.materialRequest.project.name}` : ""}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
