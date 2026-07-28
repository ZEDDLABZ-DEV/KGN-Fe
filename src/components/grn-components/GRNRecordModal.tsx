import { useEffect, useRef, useState } from "react"
import { Modal, Skeleton, Tooltip } from "antd"
import { toast } from "react-hot-toast"
import { FiArrowLeft, FiPlus } from "react-icons/fi"
import { useGRN, canCreateGRNForPurchaseOrder, type GRN } from "../../hooks/useGRN"
import { getApiErrorMessage } from "../../utils/apiError"
import { printGRN } from "../../utils/grnPrint"
import { GRNSummaryTable } from "./GRNSummaryTable"
import { GRNsTable } from "./GRNsTable"
import { GRNFormContent, type GRNFormContentHandle, type GRNFormPOContext } from "./GRNFormContent"
import { GRNViewModal } from "./GRNViewModal"

interface GRNRecordModalProps {
  open: boolean
  po: GRNFormPOContext | null
  poStatus?: string
  canManage: boolean
  onClose: () => void
  /** Fired after any GRN mutation, in case the parent PO list needs a status refresh. */
  onMutated?: () => void
}

type RecordMode = "list" | "form"

/**
 * Two-mode "Record GRN" modal embedded on the Purchase Orders page.
 * List mode mirrors the standalone GRN page's summary + GRNs table for this
 * one PO; form mode reuses the exact same `GRNFormContent` as the standalone
 * page's Create/Edit modal so the two entry points never drift apart.
 */
export const GRNRecordModal = ({ open, po, poStatus, canManage, onClose, onMutated }: GRNRecordModalProps) => {
  const grnApi = useGRN()
  const { grns, summary, loading, loadForPurchaseOrder, deleteGRN, changeGRNStatus, createGRN, updateGRN } = grnApi

  const [recordMode, setRecordMode] = useState<RecordMode>("list")
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingGRN, setEditingGRN] = useState<GRN | null>(null)
  const [saving, setSaving] = useState(false)
  const contentRef = useRef<GRNFormContentHandle>(null)

  const [updatingStatus, setUpdatingStatus] = useState<{ id: string; status: string } | null>(null)

  const [viewOpen, setViewOpen] = useState(false)
  const [viewingGRN, setViewingGRN] = useState<GRN | null>(null)

  useEffect(() => {
    if (open && po?.id) {
      setRecordMode("list")
      loadForPurchaseOrder(po.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, po?.id])

  const reload = async () => {
    if (po?.id) await loadForPurchaseOrder(po.id)
  }

  const handleTransition = async (grn: GRN, status: string) => {
    setUpdatingStatus({ id: grn.id, status })
    try {
      await changeGRNStatus(grn.id, status)
      toast.success(`GRN marked as ${status.replace(/_/g, " ").toLowerCase()}`)
      await reload()
      onMutated?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update GRN status"))
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDelete = async (grn: GRN) => {
    try {
      await deleteGRN(grn.id)
      toast.success("GRN deleted")
      await reload()
      onMutated?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete GRN"))
    }
  }

  const handlePrint = (grn: GRN) => {
    const opened = printGRN(grn, { poNumber: po?.poNumber, vendorName: po?.vendorName })
    if (!opened) toast.error("Please allow popups to print this GRN")
  }

  const openCreateForm = () => {
    setFormMode("create")
    setEditingGRN(null)
    setRecordMode("form")
  }

  const openEditForm = (grn: GRN) => {
    setFormMode("edit")
    setEditingGRN(grn)
    setRecordMode("form")
  }

  const handleSaved = async () => {
    await reload()
    onMutated?.()
    setRecordMode("list")
  }

  const hasPendingSummaryItem = (summary || []).some((s) => s.pendingQuantity > 0)
  const newGRNDisabledReason = !canManage
    ? "Only admins or accountants can record GRNs"
    : !canCreateGRNForPurchaseOrder({ status: poStatus })
    ? "This purchase order is not eligible for a new GRN in its current status"
    : !hasPendingSummaryItem
    ? "All items on this purchase order have already been fully received"
    : undefined

  const handleClose = () => {
    setRecordMode("list")
    setEditingGRN(null)
    onClose()
  }

  return (
    <>
      <Modal
        title={recordMode === "form" ? (formMode === "edit" ? `Edit ${editingGRN?.grnNumber || "GRN"}` : "New GRN") : "Record GRN"}
        open={open}
        onCancel={handleClose}
        footer={
          recordMode === "form" ? (
            <div className="flex justify-between">
              <button
                onClick={() => setRecordMode("list")}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FiArrowLeft size={14} />
                Back
              </button>
              <button
                onClick={() => contentRef.current?.submit()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : formMode === "edit" ? "Save Changes" : "Create GRN"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          )
        }
        width={900}
        destroyOnClose
      >
        {recordMode === "list" ? (
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{po?.poNumber || "Purchase Order"}</h3>
                <p className="text-sm text-gray-500">{po?.vendorName || "—"}</p>
              </div>
              <Tooltip title={newGRNDisabledReason}>
                <button
                  onClick={openCreateForm}
                  disabled={!!newGRNDisabledReason}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <FiPlus size={16} />
                  New GRN
                </button>
              </Tooltip>
            </div>

            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <>
                <GRNSummaryTable summary={summary} />
                <GRNsTable
                  grns={grns}
                  canManage={canManage}
                  updatingStatus={updatingStatus}
                  onTransition={handleTransition}
                  onView={(grn) => {
                    setViewingGRN(grn)
                    setViewOpen(true)
                  }}
                  onEdit={openEditForm}
                  onPrint={handlePrint}
                  onDelete={handleDelete}
                  emptyDescription="No GRNs recorded yet for this purchase order"
                />
              </>
            )}
          </div>
        ) : (
          <GRNFormContent
            ref={contentRef}
            mode={formMode}
            po={po}
            summary={summary}
            grn={editingGRN}
            createGRN={createGRN}
            updateGRN={updateGRN}
            onSaved={handleSaved}
            onSavingChange={setSaving}
          />
        )}
      </Modal>

      <GRNViewModal
        open={viewOpen}
        grn={viewingGRN}
        poNumber={po?.poNumber}
        canManage={canManage}
        updatingStatus={updatingStatus}
        onTransition={async (grn, status) => {
          await handleTransition(grn, status)
          setViewingGRN((prev) => (prev && prev.id === grn.id ? { ...prev, status: status as GRN["status"] } : prev))
        }}
        onClose={() => {
          setViewOpen(false)
          setViewingGRN(null)
        }}
        onPrint={handlePrint}
      />
    </>
  )
}
