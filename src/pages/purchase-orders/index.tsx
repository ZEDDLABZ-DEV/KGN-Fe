/* eslint-disable @typescript-eslint/no-explicit-any */

import { useContext, useEffect, useState } from "react"
import { Select, Skeleton, Empty, Input, Tooltip, Modal, Form, DatePicker, Popconfirm } from "antd"
import { toast } from "react-hot-toast"
import moment from "moment"
import dayjs from "dayjs"
import { ParentLayout } from "../../layout/ParentLayout"
import { Request } from "../../utils/Request"
import { AuthContext } from "../../context/AuthContext"
import { isAdmin, canManagePurchaseOrders, canManageGRN } from "../../utils/roles"
import { getApiErrorMessage } from "../../utils/apiError"
import { normalizeVendors } from "../../utils/vendors"
import { PO_TRANSITIONS, getTransitions } from "../../utils/workflow"
import { StatusActionButtons, type StatusActionOption } from "../../components/status-actions/StatusActionButtons"
import { openSendToVendorWhatsApp } from "../../utils/purchaseOrderWhatsapp"
import { ItemsTableEditor } from "../../components/purchase-order-components/ItemsTableEditor"
import { validateItems, type EditableItem } from "../../utils/purchaseOrderItems"
import { canCreateGRNForPurchaseOrder } from "../../hooks/useGRN"
import { GRNRecordModal } from "../../components/grn-components/GRNRecordModal"
import {
  FiPlus,
  FiChevronDown,
  FiSearch,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiFileText,
  FiEye,
  FiPrinter,
  FiPackage,
  FiCalendar,
  FiPhone,
  FiClock,
  FiUser,
  FiMail,
  FiMapPin,
} from "react-icons/fi"
import { LuClipboardList } from "react-icons/lu"
import { BiRupee } from "react-icons/bi"

export interface POItem {
  id?: string
  itemName: string
  description?: string
  quantity: number
  unit: string
  unitPrice?: number
  totalPrice?: number
  remarks?: string
}

export interface Vendor {
  id: string
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
}

export interface Project {
  id: string
  name: string
  description?: string
}

export interface MaterialRequestItem {
  id?: string
  itemName: string
  quantity: number
  unit: string
  estimatedCost: number
  remarks?: string
}

export interface MaterialRequest {
  id: string
  title: string
  status?: string
  items: MaterialRequestItem[]
  project?: { id: string; name: string }
}

export interface PurchaseOrder {
  id: string
  poNumber?: string
  materialRequestId?: string
  materialRequest?: { id: string; title?: string; project?: { id: string; name: string } }
  vendorId?: string
  vendor?: Vendor
  vendorName?: string
  vendorContact?: string
  vendorEmail?: string
  vendorAddress?: string
  notes?: string
  expectedDelivery?: string
  status?: string
  items: POItem[]
  totalAmount?: number
  createdAt?: string
  createdBy?: { id: string; name: string }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  APPROVED: { label: "Approved", color: "text-emerald-700", bgColor: "bg-emerald-50", dotColor: "#10b981" },
  SENT: { label: "Sent", color: "text-blue-700", bgColor: "bg-blue-50", dotColor: "#3b82f6" },
  PARTIALLY_RECEIVED: { label: "Partially Received", color: "text-orange-700", bgColor: "bg-orange-50", dotColor: "#f97316" },
  RECEIVED: { label: "Received", color: "text-violet-700", bgColor: "bg-violet-50", dotColor: "#8b5cf6" },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bgColor: "bg-red-50", dotColor: "#ef4444" },
}

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
  label: cfg.label,
  value,
  color: cfg.dotColor,
}))

const renderStatusOption = (label: string, color: string) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
    <span>{label}</span>
  </div>
)

const StatusBadge = ({ status }: { status?: string }) => {
  const config = STATUS_CONFIG[status?.toUpperCase() || ""] || STATUS_CONFIG.APPROVED
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bgColor} ${config.color}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.dotColor }} />
      {config.label}
    </span>
  )
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0)

const formatDate = (date?: string) => (date ? moment(date).format("MMM DD, YYYY") : "—")

const getPOTotal = (po: PurchaseOrder) =>
  po.items?.reduce((sum, item) => sum + item.quantity * (item.unitPrice || 0), 0) || 0

const PurchaseOrders = () => {
  const { user } = useContext(AuthContext) as any

  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(false)

  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([])
  const [materialRequestsLoading, setMaterialRequestsLoading] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")

  // Card actions
  const [actionMenuPO, setActionMenuPO] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<{ poId: string; status: string } | null>(null)

  // Vendors (shared by Create/Edit)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorsLoading, setVendorsLoading] = useState(false)

  // Create PO modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm] = Form.useForm()
  const [createItems, setCreateItems] = useState<EditableItem[]>([])

  // Edit PO modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editForm] = Form.useForm()
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null)
  const [editItems, setEditItems] = useState<EditableItem[]>([])
  const [originalEditItems, setOriginalEditItems] = useState<EditableItem[]>([])

  // View PO modal
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null)

  // Record GRN modal
  const [grnModalOpen, setGrnModalOpen] = useState(false)
  const [grnModalPO, setGrnModalPO] = useState<PurchaseOrder | null>(null)

  const isPOManager = canManagePurchaseOrders(user) || isAdmin(user)
  const canRecordGRN = canManageGRN(user)

  const fetchProjects = async () => {
    setProjectsLoading(true)
    try {
      const res: any = await Request.get("/v1/api/projects/all")
      setProjects(res.data || [])
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load projects"))
    } finally {
      setProjectsLoading(false)
    }
  }

  const fetchPurchaseOrdersForProject = async (projectId: string, status?: string) => {
    setLoading(true)
    try {
      const query = status ? `?status=${status}` : ""
      const res: any = await Request.get(`/v1/api/purchase-orders${query}`)
      const all: PurchaseOrder[] = res.data || []
      setPurchaseOrders(all.filter((po) => po.materialRequest?.project?.id === projectId))
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load purchase orders"))
      setPurchaseOrders([])
    } finally {
      setLoading(false)
    }
  }

  const fetchApprovedMaterialRequests = async (projectId: string) => {
    setMaterialRequestsLoading(true)
    try {
      const res: any = await Request.get(`/v1/api/material-requests?projectId=${projectId}&status=APPROVED`)
      setMaterialRequests(res.data || [])
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load material requests"))
      setMaterialRequests([])
    } finally {
      setMaterialRequestsLoading(false)
    }
  }

  const fetchActiveVendors = async () => {
    setVendorsLoading(true)
    try {
      const res: any = await Request.get("/v1/api/vendors/active")
      setVendors(normalizeVendors<Vendor>(res))
    } catch (err) {
      setVendors([])
      toast.error(getApiErrorMessage(err, "Failed to load active vendors"))
    } finally {
      setVendorsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleSelectProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId) || null
    setSelectedProject(project)
    setPurchaseOrders([])
    setMaterialRequests([])
    setSearchTerm("")
    setStatusFilter("")
    if (project) {
      fetchPurchaseOrdersForProject(project.id)
      fetchApprovedMaterialRequests(project.id)
    }
  }

  // Basic status PATCH. The SENT transition gets special WhatsApp-gated handling wired in a later step.
  const handleStatusTransition = async (po: PurchaseOrder, status: string) => {
    setUpdatingStatus({ poId: po.id, status })
    try {
      await Request.patch(`/v1/api/purchase-orders/${po.id}/status`, { status })
      setPurchaseOrders((prev) => prev.map((p) => (p.id === po.id ? { ...p, status } : p)))
      toast.success(`Purchase order marked as ${STATUS_CONFIG[status]?.label || status}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update purchase order status"))
    } finally {
      setUpdatingStatus(null)
    }
  }

  // "Send to Vendor" opens WhatsApp with a pre-filled message; the status PATCH only
  // fires if a message was actually opened (i.e. the vendor has a phone number on file).
  const handleSendToVendor = (po: PurchaseOrder) => {
    const vendorPhone = po.vendor?.phone || po.vendorContact
    const opened = openSendToVendorWhatsApp(
      {
        id: po.id,
        poNumber: po.poNumber,
        projectName: selectedProject?.name,
        expectedDelivery: po.expectedDelivery ? formatDate(po.expectedDelivery) : undefined,
        items: po.items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
        })),
      },
      vendorPhone
    )

    if (!opened) {
      toast.error("This vendor has no phone number on file. Add one before sending to vendor.")
      return
    }

    handleStatusTransition(po, "SENT")
  }

  const renderSendToVendorOption = (po: PurchaseOrder, variant: "button" | "link" = "button") => (
    option: StatusActionOption
  ) => {
    if (option.special !== "whatsapp") return undefined

    const buttonClasses =
      variant === "link"
        ? "text-sm font-medium text-slate-900 hover:text-slate-700"
        : "rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"

    return (
      <Popconfirm
        key={option.status}
        title="Send to Vendor?"
        description="This opens WhatsApp with a pre-filled message for the vendor. Continue?"
        okText="Send"
        cancelText="Cancel"
        onConfirm={() => handleSendToVendor(po)}
      >
        <button type="button" className={buttonClasses}>
          {option.label}
        </button>
      </Popconfirm>
    )
  }

  const openCreateModal = () => {
    createForm.resetFields()
    setCreateItems([])
    setCreateModalOpen(true)
    void fetchActiveVendors()
  }

  const handleMaterialRequestSelect = (materialRequestId: string) => {
    const mr = materialRequests.find((m) => m.id === materialRequestId)
    setCreateItems(
      mr
        ? mr.items.map((item) => ({
            itemName: item.itemName,
            description: "",
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.estimatedCost,
            remarks: item.remarks || "",
          }))
        : []
    )
  }

  const handleCreatePO = async () => {
    let values
    try {
      values = await createForm.validateFields()
    } catch {
      return
    }

    if (!validateItems(createItems)) {
      toast.error("Every item needs a name and a quantity greater than 0")
      return
    }

    setCreateLoading(true)
    try {
      await Request.post("/v1/api/purchase-orders", {
        materialRequestId: values.materialRequestId,
        vendorId: values.vendorId,
        notes: values.notes,
        expectedDelivery: values.expectedDelivery ? values.expectedDelivery.format("YYYY-MM-DD") : undefined,
        items: createItems.map((item) => ({
          itemName: item.itemName,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          remarks: item.remarks,
        })),
      })
      toast.success("Purchase order created")
      setCreateModalOpen(false)
      setCreateItems([])
      if (selectedProject) fetchPurchaseOrdersForProject(selectedProject.id)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create purchase order"))
    } finally {
      setCreateLoading(false)
    }
  }

  const openEditModal = (po: PurchaseOrder) => {
    setEditingPO(po)
    editForm.setFieldsValue({
      vendorName: po.vendor?.name || po.vendorName,
      vendorContact: po.vendor?.phone || po.vendorContact,
      vendorEmail: po.vendor?.email || po.vendorEmail,
      vendorAddress: po.vendor?.address || po.vendorAddress,
      notes: po.notes,
      expectedDelivery: po.expectedDelivery ? dayjs(po.expectedDelivery) : undefined,
    })
    const items: EditableItem[] = po.items.map((item) => ({ ...item }))
    setEditItems(items)
    setOriginalEditItems(items)
    setEditModalOpen(true)
  }

  const itemHasChanged = (item: EditableItem, original?: EditableItem) => {
    if (!original) return true
    return (
      item.itemName !== original.itemName ||
      item.description !== original.description ||
      item.quantity !== original.quantity ||
      item.unit !== original.unit ||
      item.unitPrice !== original.unitPrice ||
      item.remarks !== original.remarks
    )
  }

  const toItemPayload = (item: EditableItem) => ({
    itemName: item.itemName,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    remarks: item.remarks,
  })

  const handleUpdatePO = async () => {
    if (!editingPO) return

    let values
    try {
      values = await editForm.validateFields()
    } catch {
      return
    }

    if (!validateItems(editItems)) {
      toast.error("Every item needs a name and a quantity greater than 0")
      return
    }

    setEditLoading(true)
    try {
      await Request.put(`/v1/api/purchase-orders/${editingPO.id}`, {
        vendorName: values.vendorName,
        vendorContact: values.vendorContact,
        vendorEmail: values.vendorEmail,
        vendorAddress: values.vendorAddress,
        notes: values.notes,
        expectedDelivery: values.expectedDelivery ? values.expectedDelivery.format("YYYY-MM-DD") : undefined,
      })

      const originalById = new Map(originalEditItems.filter((item) => item.id).map((item) => [item.id, item]))
      const currentIds = new Set(editItems.filter((item) => item.id).map((item) => item.id))

      const creates = editItems
        .filter((item) => !item.id)
        .map((item) => Request.post(`/v1/api/purchase-orders/${editingPO.id}/items`, toItemPayload(item)))

      const updates = editItems
        .filter((item) => item.id && itemHasChanged(item, originalById.get(item.id)))
        .map((item) => Request.put(`/v1/api/purchase-orders/items/${item.id}`, toItemPayload(item)))

      const deletes = originalEditItems
        .filter((item) => item.id && !currentIds.has(item.id))
        .map((item) => Request.delete(`/v1/api/purchase-orders/items/${item.id}`))

      await Promise.all([...creates, ...updates, ...deletes])

      const refreshed: any = await Request.get(`/v1/api/purchase-orders/${editingPO.id}`)
      const updatedPO: PurchaseOrder = refreshed.data
      setPurchaseOrders((prev) => prev.map((p) => (p.id === updatedPO.id ? updatedPO : p)))

      toast.success("Purchase order updated")
      setEditModalOpen(false)
      setEditingPO(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update purchase order"))
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeletePO = async (po: PurchaseOrder) => {
    try {
      await Request.delete(`/v1/api/purchase-orders/${po.id}`)
      setPurchaseOrders((prev) => prev.filter((p) => p.id !== po.id))
      toast.success("Purchase order deleted")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete purchase order"))
    }
  }

  const openViewModal = (po: PurchaseOrder) => {
    setViewingPO(po)
    setViewModalOpen(true)
  }

  const openGrnModal = (po: PurchaseOrder) => {
    setGrnModalPO(po)
    setGrnModalOpen(true)
  }

  // GRN mutations can flip the PO's own status (e.g. SENT -> PARTIALLY_RECEIVED),
  // so refresh the PO list whenever something changes inside the GRN modal.
  const handleGRNMutated = () => {
    if (selectedProject) fetchPurchaseOrdersForProject(selectedProject.id)
  }

  const grnDisabledReason = (po: PurchaseOrder) => {
    if (!canRecordGRN) return "Only admins or accountants can record GRNs"
    if (!canCreateGRNForPurchaseOrder(po)) return "This purchase order is not eligible for a GRN in its current status"
    return undefined
  }

  const handlePrintPO = (po: PurchaseOrder) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("Please allow popups to print this purchase order")
      return
    }

    const poNumber = po.poNumber || `PO-${po.id.slice(0, 8)}`
    const vendorName = po.vendor?.name || po.vendorName || "—"
    const vendorPhone = po.vendor?.phone || po.vendorContact || "—"
    const vendorEmail = po.vendor?.email || po.vendorEmail || "—"
    const vendorAddress = po.vendor?.address || po.vendorAddress || "—"
    const grandTotal = po.totalAmount ?? getPOTotal(po)

    const itemsRows = po.items
      .map(
        (item, idx) => `
          <tr>
            <td class="center">${idx + 1}</td>
            <td>${item.itemName}</td>
            <td>${item.description || "—"}</td>
            <td class="center">${item.quantity}</td>
            <td class="center">${item.unit}</td>
            <td class="right">${formatCurrency(item.unitPrice || 0)}</td>
            <td class="right">${formatCurrency(item.quantity * (item.unitPrice || 0))}</td>
          </tr>
        `
      )
      .join("")

    printWindow.document.write(`
      <html>
        <head>
          <title>PO - ${poNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 16px; }
            h1 { margin: 0 0 6px 0; font-size: 24px; }
            .meta { color: #555; font-size: 13px; line-height: 1.8; }
            .info-section { margin: 20px 0; padding: 12px; background-color: #f9f9f9; border-radius: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f5f5f5; font-weight: 600; }
            .right { text-align: right; }
            .center { text-align: center; }
            tfoot td { font-weight: 700; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>KGN</h1>
              <div class="meta">
                <div><strong>Purchase Order:</strong> ${poNumber}</div>
                <div><strong>Status:</strong> ${STATUS_CONFIG[po.status?.toUpperCase() || ""]?.label || po.status || "—"}</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="meta">
                <div><strong>Created:</strong> ${formatDate(po.createdAt)}</div>
                ${po.expectedDelivery ? `<div><strong>Expected Delivery:</strong> ${formatDate(po.expectedDelivery)}</div>` : ""}
              </div>
            </div>
          </div>

          <div class="info-section">
            <div class="meta">
              <div><strong>Vendor:</strong> ${vendorName}</div>
              <div><strong>Contact:</strong> ${vendorPhone}</div>
              <div><strong>Email:</strong> ${vendorEmail}</div>
              <div><strong>Address:</strong> ${vendorAddress}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 34px;">#</th>
                <th>Item</th>
                <th>Description</th>
                <th class="center" style="width: 70px;">Qty</th>
                <th class="center" style="width: 90px;">Unit</th>
                <th class="right" style="width: 100px;">Unit Price</th>
                <th class="right" style="width: 110px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6" class="right">Grand Total</td>
                <td class="right">${formatCurrency(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>

          ${po.notes ? `<div class="info-section"><strong>Notes:</strong><p>${po.notes}</p></div>` : ""}

          <div style="margin-top: 40px; font-size: 12px; color: #666;">
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const filteredPOs = purchaseOrders.filter((po) => {
    const term = searchTerm.trim().toLowerCase()
    const matchesSearch =
      !term ||
      po.poNumber?.toLowerCase().includes(term) ||
      po.vendor?.name?.toLowerCase().includes(term) ||
      po.vendorName?.toLowerCase().includes(term) ||
      po.items?.some((item) => item.itemName?.toLowerCase().includes(term))
    const matchesStatus = !statusFilter || po.status?.toUpperCase() === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPOs = purchaseOrders.length
  const sentCount = purchaseOrders.filter((po) => po.status?.toUpperCase() === "SENT").length
  const approvedCount = purchaseOrders.filter((po) => po.status?.toUpperCase() === "APPROVED").length
  const totalValue = purchaseOrders.reduce((sum, po) => sum + getPOTotal(po), 0)

  const hasActiveFilters = !!searchTerm || !!statusFilter
  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
  }

  return (
    <ParentLayout title="Purchase Orders">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                <LuClipboardList className="text-indigo-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Purchase Orders</h1>
                <p className="text-sm text-gray-500">Select a project to view and manage purchase orders</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select
                placeholder="Select a project..."
                value={selectedProject?.id}
                onChange={handleSelectProject}
                loading={projectsLoading}
                className="w-64"
                size="large"
                showSearch
                filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                options={projects.map((p) => ({ label: p.name, value: p.id }))}
                suffixIcon={<FiChevronDown className="text-gray-400" />}
              />
              {selectedProject && isPOManager && (
                <Tooltip
                  title={
                    !materialRequestsLoading && materialRequests.length === 0
                      ? "No approved material requests available for this project yet"
                      : undefined
                  }
                >
                  <button
                    onClick={openCreateModal}
                    disabled={!materialRequestsLoading && materialRequests.length === 0}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    <FiPlus size={18} />
                    New PO
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {!selectedProject ? (
          <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-center">
                  <p className="text-gray-500">Select a project to view purchase orders</p>
                  <p className="text-sm text-gray-400 mt-1">Choose a project from the dropdown above</p>
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
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <FiFileText className="text-gray-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{totalPOs}</p>
                    <p className="text-xs text-gray-500">Total POs</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <span className="h-3 w-3 rounded-full bg-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{sentCount}</p>
                    <p className="text-xs text-gray-500">Sent</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
                    <p className="text-xs text-gray-500">Approved</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                    <BiRupee className="text-violet-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-violet-600">{formatCurrency(totalValue)}</p>
                    <p className="text-xs text-gray-500">Total Value</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search by vendor, PO number or item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 pl-10 rounded-lg border-gray-200"
                  allowClear
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={statusFilter || undefined}
                  onChange={(value) => setStatusFilter(value || "")}
                  placeholder="Status"
                  className="w-44"
                  allowClear
                  options={STATUS_OPTIONS.map((s) => ({
                    label: renderStatusOption(s.label, s.color),
                    value: s.value,
                  }))}
                />
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm font-medium text-gray-500 hover:text-gray-700">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* PO List */}
            {filteredPOs.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="text-center">
                      <p className="text-gray-500">
                        {purchaseOrders.length === 0 ? "No purchase orders yet" : "No purchase orders match your filters"}
                      </p>
                      {purchaseOrders.length === 0 && isPOManager && (
                        <Tooltip
                          title={
                            !materialRequestsLoading && materialRequests.length === 0
                              ? "No approved material requests available for this project yet"
                              : undefined
                          }
                        >
                          <button
                            onClick={openCreateModal}
                            disabled={!materialRequestsLoading && materialRequests.length === 0}
                            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            <FiPlus size={16} />
                            Create first PO
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredPOs.map((po) => {
                  const vendorName = po.vendor?.name || po.vendorName || "—"
                  const vendorPhone = po.vendor?.phone || po.vendorContact
                  const total = po.totalAmount ?? getPOTotal(po)
                  const canEditOrDelete = isPOManager && po.status?.toUpperCase() === "APPROVED"
                  const editDeleteDisabledReason = !isPOManager
                    ? "Only admins can edit or delete purchase orders"
                    : "Only purchase orders in Approved status can be edited or deleted"
                  const transitions = getTransitions(PO_TRANSITIONS, po.status?.toUpperCase())

                  return (
                    <div key={po.id} className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                          <FiPackage className="text-indigo-600" size={20} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-gray-900">
                                  {po.poNumber || `PO-${po.id.slice(0, 8)}`}
                                </h3>
                                <StatusBadge status={po.status} />
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <span>{vendorName}</span>
                                {vendorPhone && (
                                  <span className="inline-flex items-center gap-1 text-gray-400">
                                    <FiPhone size={12} />
                                    {vendorPhone}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions Menu */}
                            <div className="relative shrink-0">
                              <button
                                onClick={() => setActionMenuPO(actionMenuPO === po.id ? null : po.id)}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              >
                                <FiMoreVertical size={18} />
                              </button>
                              {actionMenuPO === po.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setActionMenuPO(null)} />
                                  <div className="absolute right-0 top-9 z-20 w-52 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                                    <button
                                      onClick={() => {
                                        setActionMenuPO(null)
                                        openViewModal(po)
                                      }}
                                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <FiEye size={16} className="text-gray-400" />
                                      View Details
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActionMenuPO(null)
                                        handlePrintPO(po)
                                      }}
                                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <FiPrinter size={16} className="text-gray-400" />
                                      Print PO
                                    </button>
                                    {isPOManager && (
                                      <Tooltip title={!canEditOrDelete ? editDeleteDisabledReason : undefined} placement="left">
                                        <button
                                          onClick={() => {
                                            if (!canEditOrDelete) return
                                            setActionMenuPO(null)
                                            openEditModal(po)
                                          }}
                                          disabled={!canEditOrDelete}
                                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                                        >
                                          <FiEdit2 size={16} className={canEditOrDelete ? "text-gray-400" : ""} />
                                          Edit PO
                                        </button>
                                      </Tooltip>
                                    )}
                                    <Tooltip title={grnDisabledReason(po)} placement="left">
                                      <button
                                        onClick={() => {
                                          if (grnDisabledReason(po)) return
                                          setActionMenuPO(null)
                                          openGrnModal(po)
                                        }}
                                        disabled={!!grnDisabledReason(po)}
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                                      >
                                        <FiFileText size={16} className={grnDisabledReason(po) ? "" : "text-gray-400"} />
                                        Record GRN
                                      </button>
                                    </Tooltip>
                                    {isPOManager && (
                                      <>
                                        <div className="my-1 border-t border-gray-100" />
                                        {canEditOrDelete ? (
                                          <Popconfirm
                                            title="Delete this purchase order?"
                                            description="This action cannot be undone."
                                            okText="Delete"
                                            okButtonProps={{ danger: true }}
                                            cancelText="Cancel"
                                            onConfirm={() => {
                                              setActionMenuPO(null)
                                              handleDeletePO(po)
                                            }}
                                          >
                                            <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
                                              <FiTrash2 size={16} />
                                              Delete PO
                                            </button>
                                          </Popconfirm>
                                        ) : (
                                          <Tooltip title={editDeleteDisabledReason} placement="left">
                                            <button
                                              disabled
                                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-300 cursor-not-allowed"
                                            >
                                              <FiTrash2 size={16} />
                                              Delete PO
                                            </button>
                                          </Tooltip>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Items Preview */}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {po.items?.slice(0, 3).map((item, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                {item.itemName}
                                <span className="text-gray-400">×{item.quantity}</span>
                              </span>
                            ))}
                            {(po.items?.length || 0) > 3 && (
                              <span className="text-xs text-gray-400">+{(po.items?.length || 0) - 3} more</span>
                            )}
                          </div>

                          {/* Meta Info */}
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-1.5">
                              <BiRupee className="text-violet-600" size={16} />
                              <span className="text-sm font-semibold text-violet-700">{formatCurrency(total)}</span>
                            </div>
                            {po.expectedDelivery && (
                              <div className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                <FiCalendar size={12} />
                                Expected {formatDate(po.expectedDelivery)}
                              </div>
                            )}
                            <div className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                              <FiClock size={12} />
                              Created {formatDate(po.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                        <div>
                          {isPOManager && (
                            <StatusActionButtons
                              options={transitions}
                              updatingStatus={updatingStatus?.poId === po.id ? updatingStatus.status : null}
                              onTransition={(status) => handleStatusTransition(po, status)}
                              renderCustom={renderSendToVendorOption(po, "link")}
                              variant="link"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Tooltip title={grnDisabledReason(po) || "Record GRN"}>
                            <button
                              onClick={() => {
                                if (grnDisabledReason(po)) return
                                openGrnModal(po)
                              }}
                              disabled={!!grnDisabledReason(po)}
                              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                              <FiFileText size={16} />
                            </button>
                          </Tooltip>
                          <button
                            onClick={() => handlePrintPO(po)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                          >
                            <FiPrinter size={16} />
                          </button>
                          <button
                            onClick={() => openViewModal(po)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                          >
                            <FiEye size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create PO Modal */}
      <Modal
        title="New Purchase Order"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreatePO}
        confirmLoading={createLoading}
        okText="Create PO"
        width={800}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" className="mt-4">
          <Form.Item
            label="Material Request"
            name="materialRequestId"
            rules={[{ required: true, message: "Please select a material request" }]}
          >
            <Select
              placeholder="Select an approved material request"
              showSearch
              loading={materialRequestsLoading}
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              options={materialRequests.map((mr) => ({ label: mr.title, value: mr.id }))}
              notFoundContent={materialRequestsLoading ? "Loading..." : "No approved material requests found"}
              onChange={handleMaterialRequestSelect}
            />
          </Form.Item>

          <Form.Item label="Vendor" name="vendorId" rules={[{ required: true, message: "Please select a vendor" }]}>
            <Select
              placeholder="Select a vendor"
              showSearch
              optionFilterProp="label"
              loading={vendorsLoading}
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              options={vendors.map((v) => ({ label: v.name, value: v.id }))}
              notFoundContent={
                vendorsLoading
                  ? "Loading..."
                  : "No active approved vendors. Ask an admin to approve a vendor first."
              }
            />
          </Form.Item>

          <Form.Item label="Expected Delivery" name="expectedDelivery">
            <DatePicker className="w-full" format="MMM DD, YYYY" />
          </Form.Item>

          <Form.Item label={null}>
            <ItemsTableEditor items={createItems} onChange={setCreateItems} />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Any additional notes for this purchase order..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit PO Modal */}
      <Modal
        title={`Edit ${editingPO?.poNumber || "Purchase Order"}`}
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false)
          setEditingPO(null)
        }}
        onOk={handleUpdatePO}
        confirmLoading={editLoading}
        okText="Save Changes"
        width={800}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Vendor Name"
              name="vendorName"
              rules={[{ required: true, message: "Please enter the vendor name" }]}
            >
              <Input placeholder="Vendor name" />
            </Form.Item>
            <Form.Item label="Vendor Contact" name="vendorContact">
              <Input placeholder="Phone number" />
            </Form.Item>
            <Form.Item label="Vendor Email" name="vendorEmail">
              <Input placeholder="Email address" />
            </Form.Item>
            <Form.Item label="Vendor Address" name="vendorAddress">
              <Input placeholder="Address" />
            </Form.Item>
          </div>

          <Form.Item label="Expected Delivery" name="expectedDelivery">
            <DatePicker className="w-full" format="MMM DD, YYYY" />
          </Form.Item>

          <Form.Item label={null}>
            <ItemsTableEditor items={editItems} onChange={setEditItems} />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Any additional notes for this purchase order..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        title={null}
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false)
          setViewingPO(null)
        }}
        footer={null}
        width={820}
        destroyOnClose
      >
        {viewingPO && (
          <div className="flex flex-col gap-5 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {viewingPO.poNumber || `PO-${viewingPO.id.slice(0, 8)}`}
                </h2>
                <StatusBadge status={viewingPO.status} />
              </div>
              {isPOManager && (
                <StatusActionButtons
                  options={getTransitions(PO_TRANSITIONS, viewingPO.status?.toUpperCase())}
                  updatingStatus={updatingStatus?.poId === viewingPO.id ? updatingStatus.status : null}
                  onTransition={(status) => handleStatusTransition(viewingPO, status)}
                  renderCustom={renderSendToVendorOption(viewingPO, "button")}
                />
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Vendor Details</h3>
              <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <FiUser className="shrink-0 text-gray-400" size={14} />
                  {viewingPO.vendor?.name || viewingPO.vendorName || "—"}
                </div>
                <div className="flex items-center gap-2">
                  <FiPhone className="shrink-0 text-gray-400" size={14} />
                  {viewingPO.vendor?.phone || viewingPO.vendorContact || "—"}
                </div>
                <div className="flex items-center gap-2">
                  <FiMail className="shrink-0 text-gray-400" size={14} />
                  {viewingPO.vendor?.email || viewingPO.vendorEmail || "—"}
                </div>
                <div className="flex items-center gap-2">
                  <FiMapPin className="shrink-0 text-gray-400" size={14} />
                  {viewingPO.vendor?.address || viewingPO.vendorAddress || "—"}
                </div>
              </div>
            </div>

            <ItemsTableEditor items={viewingPO.items} onChange={() => {}} disabled />

            {viewingPO.notes && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-1 text-sm font-semibold text-gray-700">Notes</h3>
                <p className="text-sm text-gray-600">{viewingPO.notes}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                onClick={() => handlePrintPO(viewingPO)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FiPrinter size={16} />
                Print
              </button>
              {isPOManager && (
                <Tooltip
                  title={
                    viewingPO.status?.toUpperCase() !== "APPROVED"
                      ? "Only purchase orders in Approved status can be edited"
                      : undefined
                  }
                >
                  <button
                    onClick={() => {
                      if (viewingPO.status?.toUpperCase() !== "APPROVED") return
                      setViewModalOpen(false)
                      openEditModal(viewingPO)
                    }}
                    disabled={viewingPO.status?.toUpperCase() !== "APPROVED"}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    <FiEdit2 size={16} />
                    Edit PO
                  </button>
                </Tooltip>
              )}
              <button
                onClick={() => {
                  setViewModalOpen(false)
                  setViewingPO(null)
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Record GRN Modal */}
      <GRNRecordModal
        open={grnModalOpen}
        po={
          grnModalPO
            ? {
                id: grnModalPO.id,
                poNumber: grnModalPO.poNumber,
                vendorName: grnModalPO.vendor?.name || grnModalPO.vendorName,
                items: grnModalPO.items,
              }
            : null
        }
        poStatus={grnModalPO?.status}
        canManage={canRecordGRN}
        onClose={() => {
          setGrnModalOpen(false)
          setGrnModalPO(null)
        }}
        onMutated={handleGRNMutated}
      />
    </ParentLayout>
  )
}

export { PurchaseOrders }
