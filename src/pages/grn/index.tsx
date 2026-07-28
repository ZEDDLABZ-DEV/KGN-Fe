/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useMemo, useState } from "react"
import { Empty, Segmented, Select, Skeleton, Tooltip } from "antd"
import { toast } from "react-hot-toast"
import { LuClipboardList } from "react-icons/lu"
import { FiChevronDown, FiPlus } from "react-icons/fi"
import { ParentLayout } from "../../layout/ParentLayout"
import { Request } from "../../utils/Request"
import { AuthContext } from "../../context/AuthContext"
import { getApiErrorMessage } from "../../utils/apiError"
import { canManageGRN } from "../../utils/roles"
import { printGRN } from "../../utils/grnPrint"
import {
  useGRN,
  canCreateGRNForPurchaseOrder,
  type GRN as GRNRecord,
  type GRNSummaryItem,
} from "../../hooks/useGRN"
import { GRNSummaryTable } from "../../components/grn-components/GRNSummaryTable"
import { GRNsTable } from "../../components/grn-components/GRNsTable"
import { GRNFormModal } from "../../components/grn-components/GRNFormModal"
import { GRNViewModal } from "../../components/grn-components/GRNViewModal"
import { SelectPurchaseOrderModal, type SelectablePurchaseOrder } from "../../components/grn-components/SelectPurchaseOrderModal"
import { GRN_STATUS_CONFIG } from "../../utils/grnStatus"

interface PurchaseOrderLite extends SelectablePurchaseOrder {
  items?: Array<{ id?: string; itemName: string; unit: string; quantity: number }>
}

interface Project {
  id: string
  name: string
}

type ViewMode = "By Purchase Order" | "All GRNs"

const poVendorName = (po?: PurchaseOrderLite | null) => po?.vendor?.name || po?.vendorName || "—"
const poLabel = (po?: PurchaseOrderLite | null) => (po ? po.poNumber || `PO-${po.id.slice(0, 8)}` : "")

const GRN = () => {
  const { user } = useContext(AuthContext) as any
  const canManage = canManageGRN(user)

  const [mode, setMode] = useState<ViewMode>("By Purchase Order")

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderLite[]>([])
  const [posLoading, setPosLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])

  const [selectedPOId, setSelectedPOId] = useState<string | null>(null)
  const selectedPO = useMemo(() => purchaseOrders.find((p) => p.id === selectedPOId) || null, [purchaseOrders, selectedPOId])

  const grnApi = useGRN()
  const { grns, summary, loading, loadForPurchaseOrder, loadAll, clear, deleteGRN, changeGRNStatus } = grnApi

  // All GRNs mode filters
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [projectFilter, setProjectFilter] = useState<string | undefined>(undefined)

  const [updatingStatus, setUpdatingStatus] = useState<{ id: string; status: string } | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingGRN, setEditingGRN] = useState<GRNRecord | null>(null)

  const [viewOpen, setViewOpen] = useState(false)
  const [viewingGRN, setViewingGRN] = useState<GRNRecord | null>(null)

  const [pickerOpen, setPickerOpen] = useState(false)

  const fetchPurchaseOrders = async () => {
    setPosLoading(true)
    try {
      const res: any = await Request.get("/v1/api/purchase-orders")
      setPurchaseOrders(res.data || [])
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load purchase orders"))
    } finally {
      setPosLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const res: any = await Request.get("/v1/api/projects/all")
      setProjects(res.data || [])
    } catch {
      // Project filter is a nice-to-have; failure here shouldn't block the page.
    }
  }

  useEffect(() => {
    fetchPurchaseOrders()
    fetchProjects()
  }, [])

  useEffect(() => {
    if (mode === "By Purchase Order" && selectedPOId) {
      loadForPurchaseOrder(selectedPOId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedPOId])

  useEffect(() => {
    if (mode === "All GRNs") {
      loadAll({ status: statusFilter, projectId: projectFilter })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, statusFilter, projectFilter])

  const handleSelectPO = (poId: string) => {
    setSelectedPOId(poId)
  }

  const handleModeChange = (value: string) => {
    const next = value as ViewMode
    setMode(next)
    clear()
    if (next === "By Purchase Order") {
      setStatusFilter(undefined)
      setProjectFilter(undefined)
    } else {
      setSelectedPOId(null)
    }
  }

  const reloadCurrentView = async () => {
    if (mode === "By Purchase Order" && selectedPOId) {
      await loadForPurchaseOrder(selectedPOId)
    } else if (mode === "All GRNs") {
      await loadAll({ status: statusFilter, projectId: projectFilter })
    }
  }

  const resolvePOForGRN = (purchaseOrderId: string): PurchaseOrderLite | null =>
    purchaseOrders.find((p) => p.id === purchaseOrderId) || null

  const handleTransition = async (grn: GRNRecord, status: string) => {
    setUpdatingStatus({ id: grn.id, status })
    try {
      await changeGRNStatus(grn.id, status)
      toast.success(`GRN marked as ${GRN_STATUS_CONFIG[status]?.label || status}`)
      await reloadCurrentView()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update GRN status"))
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDelete = async (grn: GRNRecord) => {
    try {
      await deleteGRN(grn.id)
      toast.success("GRN deleted")
      await reloadCurrentView()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete GRN"))
    }
  }

  const handlePrint = (grn: GRNRecord) => {
    const po = resolvePOForGRN(grn.purchaseOrderId)
    const opened = printGRN(grn, { poNumber: poLabel(po), vendorName: poVendorName(po) })
    if (!opened) toast.error("Please allow popups to print this GRN")
  }

  const openViewModal = (grn: GRNRecord) => {
    setViewingGRN(grn)
    setViewOpen(true)
  }

  const openEditModal = (grn: GRNRecord) => {
    setFormMode("edit")
    setEditingGRN(grn)
    setFormOpen(true)
  }

  const openCreateModalForCurrentPO = () => {
    setFormMode("create")
    setEditingGRN(null)
    setFormOpen(true)
  }

  const handlePickerSelect = async (po: SelectablePurchaseOrder) => {
    setPickerOpen(false)
    setMode("By Purchase Order")
    setSelectedPOId(po.id)
    await loadForPurchaseOrder(po.id)
    setFormMode("create")
    setEditingGRN(null)
    setFormOpen(true)
  }

  const handleSaved = async () => {
    setFormOpen(false)
    setEditingGRN(null)
    await reloadCurrentView()
  }

  const hasPendingSummaryItem = (summary || []).some((s: GRNSummaryItem) => s.pendingQuantity > 0)

  const newGRNDisabledReason = (po: PurchaseOrderLite | null) => {
    if (!canManage) return "Only admins or accountants can record GRNs"
    if (!po) return "Select a purchase order first"
    if (!canCreateGRNForPurchaseOrder(po)) return "This purchase order is not eligible for a new GRN in its current status"
    if (!hasPendingSummaryItem) return "All items on this purchase order have already been fully received"
    return undefined
  }

  const byPOFormPO = selectedPO
    ? { id: selectedPO.id, poNumber: selectedPO.poNumber, vendorName: poVendorName(selectedPO), items: selectedPO.items }
    : null

  const editingGRNPO = editingGRN ? resolvePOForGRN(editingGRN.purchaseOrderId) : null
  const formPO =
    formMode === "edit" && editingGRNPO
      ? { id: editingGRNPO.id, poNumber: editingGRNPO.poNumber, vendorName: poVendorName(editingGRNPO), items: editingGRNPO.items }
      : byPOFormPO

  const viewingGRNPO = viewingGRN ? resolvePOForGRN(viewingGRN.purchaseOrderId) : null

  const projectOptions = projects.map((p) => ({ label: p.name, value: p.id }))
  const statusOptions = Object.entries(GRN_STATUS_CONFIG).map(([value, cfg]) => ({ label: cfg.label, value }))

  return (
    <ParentLayout title="GRN">
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                <LuClipboardList className="text-indigo-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Goods Receiving Notes</h1>
                <p className="text-sm text-gray-500">Track goods received against purchase orders</p>
              </div>
            </div>

            <Segmented
              value={mode}
              onChange={handleModeChange}
              options={["By Purchase Order", "All GRNs"]}
              size="large"
            />
          </div>
        </div>

        {mode === "By Purchase Order" ? (
          <>
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <Select
                placeholder="Select a purchase order..."
                value={selectedPOId || undefined}
                onChange={handleSelectPO}
                loading={posLoading}
                className="w-full sm:w-80"
                size="large"
                showSearch
                filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                options={purchaseOrders.map((po) => ({
                  label: `${poLabel(po)} — ${poVendorName(po)}`,
                  value: po.id,
                }))}
                suffixIcon={<FiChevronDown className="text-gray-400" />}
              />

              <Tooltip title={newGRNDisabledReason(selectedPO)}>
                <button
                  onClick={openCreateModalForCurrentPO}
                  disabled={!!newGRNDisabledReason(selectedPO)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <FiPlus size={18} />
                  New GRN
                </button>
              </Tooltip>
            </div>

            {!selectedPOId ? (
              <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="text-center">
                      <p className="text-gray-500">Select a purchase order to view its GRNs</p>
                      <p className="mt-1 text-sm text-gray-400">Choose a purchase order from the dropdown above</p>
                    </div>
                  }
                />
              </div>
            ) : loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <Skeleton active paragraph={{ rows: 6 }} />
              </div>
            ) : (
              <>
                <GRNSummaryTable summary={summary} />
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200 p-4">
                    <h4 className="text-sm font-semibold text-gray-900">GRNs for {poLabel(selectedPO)}</h4>
                  </div>
                  <GRNsTable
                    grns={grns}
                    canManage={canManage}
                    updatingStatus={updatingStatus}
                    onTransition={handleTransition}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onPrint={handlePrint}
                    onDelete={handleDelete}
                    emptyDescription="No GRNs recorded yet for this purchase order"
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  placeholder="Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  allowClear
                  className="w-44"
                  options={statusOptions}
                />
                <Select
                  placeholder="Project"
                  value={projectFilter}
                  onChange={setProjectFilter}
                  allowClear
                  showSearch
                  filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                  className="w-52"
                  options={projectOptions}
                />
              </div>

              <Tooltip title={!canManage ? "Only admins or accountants can record GRNs" : undefined}>
                <button
                  onClick={() => setPickerOpen(true)}
                  disabled={!canManage}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <FiPlus size={18} />
                  New GRN
                </button>
              </Tooltip>
            </div>

            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <Skeleton active paragraph={{ rows: 6 }} />
              </div>
            ) : (
              <GRNsTable
                grns={grns}
                canManage={canManage}
                updatingStatus={updatingStatus}
                onTransition={handleTransition}
                onView={openViewModal}
                onEdit={openEditModal}
                onPrint={handlePrint}
                onDelete={handleDelete}
                pagination={{ pageSize: 20 }}
                emptyDescription="No GRNs match your filters"
                extraColumns={[
                  {
                    title: "Project",
                    key: "project",
                    render: (grn) => resolvePOForGRN(grn.purchaseOrderId)?.materialRequest?.project?.name || "—",
                  },
                  {
                    title: "PO Number",
                    key: "poNumber",
                    render: (grn) => poLabel(resolvePOForGRN(grn.purchaseOrderId)) || "—",
                  },
                ]}
              />
            )}
          </>
        )}
      </div>

      <GRNFormModal
        open={formOpen}
        mode={formMode}
        po={formPO}
        summary={summary}
        grn={editingGRN}
        onClose={() => {
          setFormOpen(false)
          setEditingGRN(null)
        }}
        onSaved={handleSaved}
        createGRN={grnApi.createGRN}
        updateGRN={grnApi.updateGRN}
      />

      <GRNViewModal
        open={viewOpen}
        grn={viewingGRN}
        poNumber={viewingGRNPO ? poLabel(viewingGRNPO) : undefined}
        canManage={canManage}
        updatingStatus={updatingStatus}
        onTransition={async (grn, status) => {
          await handleTransition(grn, status)
          setViewingGRN((prev) => (prev && prev.id === grn.id ? { ...prev, status: status as GRNRecord["status"] } : prev))
        }}
        onClose={() => {
          setViewOpen(false)
          setViewingGRN(null)
        }}
        onPrint={handlePrint}
      />

      <SelectPurchaseOrderModal
        open={pickerOpen}
        purchaseOrders={purchaseOrders}
        loading={posLoading}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
      />
    </ParentLayout>
  )
}

export { GRN }
