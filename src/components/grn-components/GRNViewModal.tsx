import { Modal } from "antd"
import moment from "moment"
import { FiPrinter } from "react-icons/fi"
import type { GRN } from "../../hooks/useGRN"
import { GRNStatusBadge } from "./GRNStatusBadge"
import { StatusActionButtons } from "../status-actions/StatusActionButtons"
import { getTransitions, GRN_TRANSITIONS } from "../../utils/workflow"

const formatDate = (date?: string) => (date ? moment(date).format("MMM DD, YYYY") : "—")

interface GRNViewModalProps {
  open: boolean
  grn: GRN | null
  poNumber?: string
  canManage: boolean
  updatingStatus?: { id: string; status: string } | null
  onTransition: (grn: GRN, status: string) => void
  onClose: () => void
  onPrint: (grn: GRN) => void
}

export const GRNViewModal = ({
  open,
  grn,
  poNumber,
  canManage,
  updatingStatus,
  onTransition,
  onClose,
  onPrint,
}: GRNViewModalProps) => {
  return (
    <Modal title={null} open={open} onCancel={onClose} footer={null} width={820} destroyOnClose>
      {grn && (
        <div className="flex flex-col gap-5 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{grn.grnNumber || `GRN-${grn.id.slice(0, 8)}`}</h2>
              <GRNStatusBadge status={grn.status} />
            </div>
            {canManage && (
              <StatusActionButtons
                options={getTransitions(GRN_TRANSITIONS, grn.status?.toUpperCase())}
                updatingStatus={updatingStatus?.id === grn.id ? updatingStatus.status : null}
                onTransition={(status) => onTransition(grn, status)}
              />
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">GRN Number</div>
                <div className="font-medium text-gray-900">{grn.grnNumber || `GRN-${grn.id.slice(0, 8)}`}</div>
              </div>
              <div>
                <div className="text-gray-500">PO Number</div>
                <div className="font-medium text-gray-900">{poNumber || `PO-${grn.purchaseOrderId.slice(0, 8)}`}</div>
              </div>
              <div>
                <div className="text-gray-500">Received By</div>
                <div className="font-medium text-gray-900">{grn.receivedBy || "—"}</div>
              </div>
              <div>
                <div className="text-gray-500">Received Date</div>
                <div className="font-medium text-gray-900">{formatDate(grn.receivedDate)}</div>
              </div>
            </div>

            {grn.remarks && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-500">Remarks</div>
                <p className="mt-1 text-sm text-gray-900">{grn.remarks}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Items</h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">#</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Item</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Unit</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Ordered</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Received</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Damaged</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {grn.items?.map((item, idx) => {
                    const net = (item.receivedQuantity || 0) - (item.damagedQuantity || 0)
                    return (
                      <tr key={item.id || item.purchaseOrderItemId || idx}>
                        <td className="whitespace-nowrap px-4 py-2.5 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                          {item.itemName || "—"}
                          {item.remarks && <div className="mt-1 text-xs text-gray-500">{item.remarks}</div>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-center text-sm text-gray-600">{item.unit || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-center text-sm text-gray-700">{item.orderedQuantity ?? "—"}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-center text-sm text-gray-700">{item.receivedQuantity ?? 0}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-center text-sm text-gray-700">{item.damagedQuantity ?? 0}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-center text-sm font-semibold text-gray-900">{net}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              onClick={() => onPrint(grn)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FiPrinter size={16} />
              Print GRN
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
