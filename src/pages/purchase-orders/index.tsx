/* eslint-disable @typescript-eslint/no-explicit-any */

import { useContext, useEffect, useState } from "react"
import {
  Modal,
  Form,
  Input,
  Select,
  Skeleton,
  Empty,
  InputNumber,
  DatePicker,
} from "antd"
import { toast } from "react-hot-toast"
import { ParentLayout } from "../../layout/ParentLayout"
import { Request } from "../../utils/Request"
import { AuthContext } from "../../context/AuthContext"
import moment from "moment"
import {
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiFileText,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiPrinter,
  FiEye,
  FiPackage,
} from "react-icons/fi"
import { LuClipboardList } from "react-icons/lu"
import { BiRupee } from "react-icons/bi"

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  DRAFT: { label: "Draft", color: "text-gray-700", bgColor: "bg-gray-100", dotColor: "#6b7280" },
  SENT: { label: "Sent", color: "text-blue-700", bgColor: "bg-blue-50", dotColor: "#3b82f6" },
  CONFIRMED: { label: "Confirmed", color: "text-emerald-700", bgColor: "bg-emerald-50", dotColor: "#10b981" },
  DELIVERED: { label: "Delivered", color: "text-violet-700", bgColor: "bg-violet-50", dotColor: "#8b5cf6" },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bgColor: "bg-red-50", dotColor: "#ef4444" },
}

const STATUS_OPTIONS = [
  { label: "Draft", value: "DRAFT", color: "#6b7280" },
  { label: "Sent", value: "SENT", color: "#3b82f6" },
  { label: "Confirmed", value: "CONFIRMED", color: "#10b981" },
  { label: "Delivered", value: "DELIVERED", color: "#8b5cf6" },
  { label: "Cancelled", value: "CANCELLED", color: "#ef4444" },
]

const renderStatusOption = (label: string, color: string) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ 
      width: 8, 
      height: 8, 
      borderRadius: '50%', 
      backgroundColor: color,
      flexShrink: 0
    }} />
    <span>{label}</span>
  </div>
)

const UNIT_OPTIONS = [
  { label: "Pieces", value: "PCS" },
  { label: "Kilograms", value: "KG" },
  { label: "Meters", value: "M" },
  { label: "Square Meters", value: "SQM" },
  { label: "Cubic Meters", value: "CUM" },
  { label: "Liters", value: "L" },
  { label: "Bags", value: "BAGS" },
  { label: "Tons", value: "TONS" },
  { label: "Sets", value: "SETS" },
  { label: "Numbers", value: "NOS" },
  { label: "Running Meters", value: "RM" },
  { label: "Square Feet", value: "SQFT" },
]

interface POItem {
  id?: string
  itemName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice?: number
  remarks?: string
}

interface PurchaseOrder {
  id: string
  poNumber?: string
  materialRequestId?: string
  materialRequest?: { id: string; title: string }
  vendorName: string
  vendorContact?: string
  vendorEmail?: string
  vendorAddress?: string
  notes?: string
  expectedDelivery?: string
  status?: string
  items: POItem[]
  project?: { id: string; name: string }
  createdAt?: string
  createdBy?: { id: string; name: string }
  totalAmount?: number
}

interface Project {
  id: string
  name: string
  description?: string
}

interface Vendor {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}

interface MaterialRequest {
  id: string
  title: string
  items: any[]
}

interface GRNItem {
  poItemId?: string
  itemName: string
  orderedQuantity: number
  receivedQuantity: number
  damagedQuantity: number
  remarks?: string
}

interface GoodsReceiptNote {
  id?: string
  grnNumber?: string
  purchaseOrderId: string
  receivedDate?: string
  items: GRNItem[]
  remarks?: string
  receivedBy?: string
}

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(false)
  const { permissions = [] } = useContext(AuthContext) as any
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [form] = Form.useForm()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([])

  // GRN
  const [grnModalOpen, setGrnModalOpen] = useState(false)
  const [grnLoading, setGrnLoading] = useState(false)
  const [grnPO, setGrnPO] = useState<PurchaseOrder | null>(null)
  const [grnItems, setGrnItems] = useState<GRNItem[]>([])
  const [existingGRN, setExistingGRN] = useState<GoodsReceiptNote | null>(null)
  const [grnForm] = Form.useForm()

  // Items for the form
  const [formItems, setFormItems] = useState<POItem[]>([
    { itemName: "", quantity: 1, unit: "PCS", unitPrice: 0, remarks: "" }
  ])

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Actions
  const [actionMenuPO, setActionMenuPO] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null)
  const [editForm] = Form.useForm()
  const [editFormItems, setEditFormItems] = useState<POItem[]>([])

  // View details
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null)

  const canCreateGRNForPO = (po: PurchaseOrder) => {
    const allowedStatuses = ["SENT", "APPROVED", "PARTIALLY_RECEIVED"]
    const status = (po.status || "").toUpperCase()
    return allowedStatuses.includes(status)
  }

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false)
    form.resetFields()
    setFormItems([{ itemName: "", quantity: 1, unit: "PCS", unitPrice: 0, remarks: "" }])
  }

  const handleAddItem = () => {
    setFormItems([...formItems, { itemName: "", quantity: 1, unit: "PCS", unitPrice: 0, remarks: "" }])
  }

  const handleRemoveItem = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...formItems]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].totalPrice = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0)
    }
    setFormItems(newItems)
  }

  const handleEditAddItem = () => {
    setEditFormItems([...editFormItems, { itemName: "", quantity: 1, unit: "PCS", unitPrice: 0, remarks: "" }])
  }

  const handleEditRemoveItem = (index: number) => {
    if (editFormItems.length > 1) {
      setEditFormItems(editFormItems.filter((_, i) => i !== index))
    }
  }

  const handleEditItemChange = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...editFormItems]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].totalPrice = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0)
    }
    setEditFormItems(newItems)
  }

  const handleMaterialRequestChange = (mrId: string) => {
    const mr = materialRequests.find(m => m.id === mrId)
    if (mr && mr.items) {
      const items: POItem[] = mr.items.map((item: any) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.estimatedCost || 0,
        totalPrice: (item.quantity || 0) * (item.estimatedCost || 0),
        remarks: item.remarks || "",
      }))
      setFormItems(items)
    }
  }

  const validateItems = (items: POItem[]): boolean => {
    for (const item of items) {
      if (!item.itemName || item.itemName.trim() === "") {
        toast.error("Please fill in all item names")
        return false
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error("Quantity must be greater than 0")
        return false
      }
    }
    return true
  }

  const openGRNModal = async (po: PurchaseOrder) => {
    if (!canCreateGRNForPO(po)) {
      toast.error("GRN can only be created when PO status is SENT, APPROVED, or PARTIALLY_RECEIVED")
      return
    }

    setGrnPO(po)
    setExistingGRN(null)

    // default (new GRN) values
    const defaultItems: GRNItem[] = (po.items || []).map((item) => ({
      poItemId: item.id,
      itemName: item.itemName,
      orderedQuantity: item.quantity,
      receivedQuantity: item.quantity,
      damagedQuantity: 0,
      remarks: "",
    }))

    // Try to load an existing GRN for this PO (if backend supports it)
    try {
      const res: any = await Request.get(`/v1/api/grn?purchaseOrderId=${po.id}`)
      const grns: GoodsReceiptNote[] = res?.data || res || []
      const latest = Array.isArray(grns) ? grns[0] : null
      if (latest?.id) {
        setExistingGRN(latest)
        grnForm.setFieldsValue({
          receivedDate: latest.receivedDate ? moment(latest.receivedDate) : moment(),
          remarks: latest.remarks || "",
          receivedBy: latest.receivedBy || "",
        })

        // merge quantities into PO items by purchaseOrderItemId
        const byPoItemId = new Map<string, any>()
        ;(latest.items || []).forEach((it: any) => {
          // API returns purchaseOrderItemId, not poItemId
          const itemId = it?.purchaseOrderItemId || it?.poItemId
          if (itemId) byPoItemId.set(itemId, it)
        })

        const merged: GRNItem[] = (po.items || []).map((poItem) => {
          const grnIt = poItem.id ? byPoItemId.get(poItem.id) : null
          return {
            poItemId: poItem.id,
            itemName: poItem.itemName,
            orderedQuantity: poItem.quantity,
            receivedQuantity: grnIt?.receivedQuantity ?? 0,
            damagedQuantity: grnIt?.damagedQuantity ?? 0,
            remarks: grnIt?.remarks || "",
          }
        })
        setGrnItems(merged)
      } else {
        setGrnItems(defaultItems)
        grnForm.setFieldsValue({ receivedDate: moment(), remarks: "", receivedBy: "" })
      }
    } catch (e) {
      // backend might not support GET yet, fall back silently
      setGrnItems(defaultItems)
      grnForm.setFieldsValue({ receivedDate: moment(), remarks: "", receivedBy: "" })
    }

    setGrnModalOpen(true)
  }

  const handleGRNItemChange = (index: number, field: keyof GRNItem, value: any) => {
    const newItems = [...grnItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setGrnItems(newItems)
  }

  const handleCreateOrUpdateGRN = async (values: any) => {
    if (!grnPO) return

    try {
      setGrnLoading(true)
      const payload = {
        purchaseOrderId: grnPO.id,
        receivedBy: values.receivedBy,
        receivedDate: values.receivedDate?.toISOString(),
        remarks: values.remarks || "",
        items: grnItems.map((item) => ({
          purchaseOrderItemId: item.poItemId,
          receivedQuantity: item.receivedQuantity || 0,
          damagedQuantity: item.damagedQuantity || 0,
          remarks: item.remarks || "",
        })),
      }

      if (existingGRN?.id) {
        await Request.put(`/v1/api/grn/${existingGRN.id}`, payload)
        toast.success("GRN updated successfully")
      } else {
        await Request.post("/v1/api/grn", payload)
        toast.success("GRN created successfully")
      }

      setGrnModalOpen(false)
      setGrnPO(null)
      setGrnItems([])
      setExistingGRN(null)
      grnForm.resetFields()
    } catch (error) {
      console.log(error)
      toast.error(existingGRN?.id ? "Failed to update GRN" : "Failed to create GRN")
    } finally {
      setGrnLoading(false)
    }
  }

  const handleCreatePO = async (values: any) => {
    try {
      if (!selectedProject) {
        toast.error("Please select a project first")
        return
      }
      if (!validateItems(formItems)) return

      setCreateLoading(true)
      await Request.post("/v1/api/purchase-orders", {
        ...values,
        projectId: selectedProject.id,
        expectedDelivery: values.expectedDelivery?.toISOString(),
        items: formItems.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice || 0,
          remarks: item.remarks || "",
        })),
      })
      await getPurchaseOrdersByProject(selectedProject.id)
      handleCloseCreateModal()
      toast.success("Purchase order created successfully")
    } catch (error) {
      console.log(error)
      toast.error("Failed to create purchase order")
    } finally {
      setCreateLoading(false)
    }
  }

  const getProjects = async () => {
    setProjectsLoading(true)
    try {
      const response = await Request.get("/v1/api/projects/all")
      setProjects(response.data || [])
    } catch (error) {
      console.log(error)
      toast.error("Failed to load projects")
    } finally {
      setProjectsLoading(false)
    }
  }

  const getVendors = async () => {
    try {
      const response: any = await Request.get("/v1/api/vendors")
      console.log("Vendors API response:", response)
      const vendorList = response?.data || response || []
      console.log("Parsed vendor list:", vendorList)
      setVendors(Array.isArray(vendorList) ? vendorList : [])
    } catch (error) {
      console.log("Failed to load vendors:", error)
    }
  }

  const getMaterialRequests = async (projectId: string) => {
    try {
      const response = await Request.get(`/v1/api/material-requests?projectId=${projectId}`)
      setMaterialRequests(response.data || [])
    } catch (error) {
      console.log(error)
    }
  }

  const getPurchaseOrdersByProject = async (projectId: string) => {
    if (!projectId) return
    setLoading(true)
    try {
      const response = await Request.get(`/v1/api/purchase-orders?projectId=${projectId}`)
      setPurchaseOrders(response.data || [])
    } catch (error) {
      console.log(error)
      toast.error("Failed to load purchase orders")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setSelectedProject(project)
      await Promise.all([
        getPurchaseOrdersByProject(projectId),
        getMaterialRequests(projectId)
      ])
    }
  }

  const handleUpdateStatus = async (poId: string, status: string) => {
    try {
      await Request.put(`/v1/api/purchase-orders/${poId}`, { status })
      setPurchaseOrders((prev) => prev.map((po) => (po.id === poId ? { ...po, status } : po)))
      toast.success("Status updated")
    } catch (error) {
      console.log(error)
      toast.error("Failed to update status")
    }
  }

  const handleDeletePO = async (poId: string) => {
    try {
      await Request.delete(`/v1/api/purchase-orders/${poId}`)
      setPurchaseOrders((prev) => prev.filter((po) => po.id !== poId))
      toast.success("Purchase order deleted")
      setActionMenuPO(null)
    } catch (error) {
      console.log(error)
      toast.error("Failed to delete purchase order")
    }
  }

  const openEditModal = (po: PurchaseOrder) => {
    setEditingPO(po)
    editForm.setFieldsValue({
      vendorName: po.vendorName,
      notes: po.notes,
      status: po.status,
      expectedDelivery: po.expectedDelivery ? moment(po.expectedDelivery) : null,
    })
    setEditFormItems(po.items.map(item => ({
      id: item.id,
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalPrice: (item.quantity || 0) * (item.unitPrice || 0),
      remarks: item.remarks || "",
    })))
    setEditModalOpen(true)
    setActionMenuPO(null)
  }

  const openViewModal = (po: PurchaseOrder) => {
    setViewingPO(po)
    setViewModalOpen(true)
    setActionMenuPO(null)
  }

  const handleEditPO = async (values: any) => {
    if (!editingPO) return
    if (!validateItems(editFormItems)) return

    try {
      await Request.put(`/v1/api/purchase-orders/${editingPO.id}`, {
        ...values,
        expectedDelivery: values.expectedDelivery?.toISOString(),
        items: editFormItems.map(item => ({
          id: item.id,
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice || 0,
          remarks: item.remarks || "",
        })),
      })
      setPurchaseOrders((prev) =>
        prev.map((po) =>
          po.id === editingPO.id
            ? {
                ...po,
                ...values,
                expectedDelivery: values.expectedDelivery?.toISOString(),
                items: editFormItems,
                totalAmount: editFormItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
              }
            : po
        )
      )
      toast.success("Purchase order updated")
      setEditModalOpen(false)
      setEditingPO(null)
      editForm.resetFields()
      setEditFormItems([])
    } catch (error) {
      console.log(error)
      toast.error("Failed to update purchase order")
    }
  }

  const handlePrint = (po: PurchaseOrder) => {
    // Open print-friendly view
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const totalAmount = po.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0
      printWindow.document.write(`
        <html>
          <head>
            <title>Purchase Order - ${po.poNumber || po.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              .header { text-align: center; margin-bottom: 30px; }
              .po-number { font-size: 24px; font-weight: bold; }
              .vendor-info { margin-bottom: 20px; }
              .vendor-info h3 { margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f5f5f5; }
              .total-row { font-weight: bold; background-color: #f9f9f9; }
              .notes { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
              @media print { body { padding: 20px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="po-number">PURCHASE ORDER</div>
              <div>${po.poNumber || `PO-${po.id.slice(0, 8)}`}</div>
              <div>Date: ${moment(po.createdAt).format('MMM DD, YYYY')}</div>
            </div>
            <div class="vendor-info">
              <h3>Vendor Details</h3>
              <p><strong>${po.vendorName}</strong></p>
              ${po.vendorAddress ? `<p>${po.vendorAddress}</p>` : ''}
              ${po.vendorContact ? `<p>Phone: ${po.vendorContact}</p>` : ''}
              ${po.vendorEmail ? `<p>Email: ${po.vendorEmail}</p>` : ''}
            </div>
            ${po.expectedDelivery ? `<p><strong>Expected Delivery:</strong> ${moment(po.expectedDelivery).format('MMM DD, YYYY')}</p>` : ''}
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${po.items?.map((item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item.itemName}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td>₹${item.unitPrice.toLocaleString()}</td>
                    <td>₹${(item.quantity * item.unitPrice).toLocaleString()}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="5" style="text-align: right;">Grand Total</td>
                  <td>₹${totalAmount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            ${po.notes ? `<div class="notes"><strong>Notes:</strong><br/>${po.notes}</div>` : ''}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
    setActionMenuPO(null)
  }

  useEffect(() => {
    getProjects()
    getVendors()
  }, [])

  // Filter POs
  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      !searchTerm ||
      po.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.items?.some(item => item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = !statusFilter || po.status?.toUpperCase() === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatDate = (date?: string) => (date ? moment(date).format("MMM DD, YYYY") : "—")
  const formatCurrency = (value?: number) =>
    value !== undefined ? Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value) : "—"

  // Stats
  const totalPOs = purchaseOrders.length
  const draftPOs = purchaseOrders.filter((po) => po.status?.toUpperCase() === "DRAFT").length
  const confirmedPOs = purchaseOrders.filter((po) => po.status?.toUpperCase() === "CONFIRMED").length
  const totalValue = purchaseOrders.reduce((sum, po) => {
    const poTotal = po.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0) || 0
    return sum + poTotal
  }, 0)

  const canCreatePOs = permissions.find((p: any) => p.name === "create_purchase_orders") || permissions.find((p: any) => p.name === "create_tasks") || permissions.find((p: any) => p.name === "view_projects")
  const canEditPOs = permissions.find((p: any) => p.name === "edit_purchase_orders") || permissions.find((p: any) => p.name === "edit_tasks") || permissions.find((p: any) => p.name === "view_projects")
  const canDeletePOs = permissions.find((p: any) => p.name === "delete_purchase_orders") || permissions.find((p: any) => p.name === "delete_tasks")

  const renderItemsForm = (
    items: POItem[],
    onChange: (index: number, field: keyof POItem, value: any) => void,
    onAdd: () => void,
    onRemove: (index: number) => void
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Items</label>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          <FiPlus size={16} />
          Add Item
        </button>
      </div>
      
      {/* Items Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name *</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Qty *</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">Unit</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">Unit Price</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">Total</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Remarks</th>
              <th className="px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto">
            {items.map((item, index) => (
              <tr key={index} className="bg-white">
                <td className="px-2 py-2">
                  <Input
                    placeholder="Item Name"
                    value={item.itemName}
                    onChange={(e) => onChange(index, "itemName", e.target.value)}
                    size="small"
                  />
                </td>
                <td className="px-2 py-2">
                  <InputNumber
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(val) => onChange(index, "quantity", val || 1)}
                    min={1}
                    className="w-full"
                    size="small"
                  />
                </td>
                <td className="px-2 py-2">
                  <Select
                    placeholder="Unit"
                    value={item.unit}
                    onChange={(val) => onChange(index, "unit", val)}
                    options={UNIT_OPTIONS}
                    className="w-full"
                    size="small"
                  />
                </td>
                <td className="px-2 py-2">
                  <InputNumber
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(val) => onChange(index, "unitPrice", val || 0)}
                    min={0}
                    className="w-full"
                    size="small"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value?.replace(/,/g, '') as unknown as number}
                  />
                </td>
                <td className="px-2 py-2 text-right text-sm font-medium text-gray-700">
                  {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                </td>
                <td className="px-2 py-2">
                  <Input
                    placeholder="Remarks"
                    value={item.remarks}
                    onChange={(e) => onChange(index, "remarks", e.target.value)}
                    size="small"
                  />
                </td>
                <td className="px-2 py-2">
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={4} className="px-3 py-2 text-right text-sm font-medium text-gray-700">Grand Total:</td>
              <td className="px-2 py-2 text-right text-base font-bold text-indigo-600">
                {formatCurrency(items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0))}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )

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

            {/* Project Selector */}
            <div className="flex items-center gap-3">
              <Select
                placeholder="Select a project..."
                value={selectedProject?.id}
                onChange={handleSelectProject}
                loading={projectsLoading}
                className="w-64"
                size="large"
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={projects.map((p) => ({ label: p.name, value: p.id }))}
                suffixIcon={<FiChevronDown className="text-gray-400" />}
              />
              {selectedProject && canCreatePOs && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  <FiPlus size={18} />
                  New PO
                </button>
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <span className="h-3 w-3 rounded-full bg-gray-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600">{draftPOs}</p>
                    <p className="text-xs text-gray-500">Drafts</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{confirmedPOs}</p>
                    <p className="text-xs text-gray-500">Confirmed</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                    <BiRupee className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">{formatCurrency(totalValue)}</p>
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
                  placeholder="Search by vendor, PO number, or items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 pl-10 rounded-lg border-gray-200"
                  allowClear
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={statusFilter || undefined}
                  onChange={setStatusFilter}
                  placeholder="Status"
                  className="w-36"
                  allowClear
                  options={STATUS_OPTIONS.map((s) => ({
                    label: renderStatusOption(s.label, s.color),
                    value: s.value,
                  }))}
                />
                {(searchTerm || statusFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("")
                    }}
                    className="text-sm font-medium text-violet-600 hover:text-violet-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* PO List */}
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <Skeleton active paragraph={{ rows: 5 }} />
              </div>
            ) : filteredPOs.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={searchTerm || statusFilter ? "No purchase orders match your filters" : "No purchase orders yet"}
                >
                  {canCreatePOs && !searchTerm && !statusFilter && (
                    <button
                      onClick={() => setCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    >
                      <FiPlus size={16} />
                      Create first PO
                    </button>
                  )}
                </Empty>
              </div>
            ) : (
              <div className="space-y-3">
                {/* PO Count Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    {filteredPOs.length} purchase order{filteredPOs.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* PO Cards */}
                {filteredPOs.map((po) => {
                  const statusConfig = STATUS_CONFIG[po.status?.toUpperCase() || "DRAFT"] || STATUS_CONFIG.DRAFT
                  const totalAmount = po.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0

                  return (
                    <div
                      key={po.id}
                      className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
                    >
                      {/* PO Header */}
                      <div className="flex items-start gap-4 p-4">
                        {/* Icon */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                          <LuClipboardList className="text-indigo-600" size={20} />
                        </div>

                        {/* PO Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-gray-900">
                                  {po.poNumber || `PO-${po.id.slice(0, 8)}`}
                                </h3>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusConfig.dotColor, display: 'inline-block' }} />
                                  {statusConfig.label}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">{po.vendorName}</span>
                                {po.vendorContact && <span className="text-gray-400 ml-2">• {po.vendorContact}</span>}
                              </p>
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
                                  <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                                    <button
                                      onClick={() => openViewModal(po)}
                                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <FiEye size={16} className="text-gray-400" />
                                      View Details
                                    </button>
                                    <button
                                      onClick={() => handlePrint(po)}
                                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <FiPrinter size={16} className="text-gray-400" />
                                      Print PO
                                    </button>
                                    <button
                                      onClick={() => openGRNModal(po)}
                                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <FiPackage size={16} className="text-gray-400" />
                                      Record GRN
                                    </button>
                                    {canEditPOs && (
                                      <button
                                        onClick={() => openEditModal(po)}
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                      >
                                        <FiEdit2 size={16} className="text-gray-400" />
                                        Edit PO
                                      </button>
                                    )}
                                    {canDeletePOs && (
                                      <>
                                        <div className="my-1 border-t border-gray-100" />
                                        <button
                                          onClick={() => handleDeletePO(po.id)}
                                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                                        >
                                          <FiTrash2 size={16} />
                                          Delete PO
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Items Preview */}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">{po.items?.length || 0} items:</span>
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

                          {/* PO Meta Info */}
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            {/* Total Amount */}
                            <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5">
                              <BiRupee className="text-indigo-600" size={16} />
                              <span className="text-sm font-semibold text-indigo-700">{formatCurrency(totalAmount)}</span>
                            </div>

                            {/* Expected Delivery */}
                            {po.expectedDelivery && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <FiCalendar size={14} />
                                Expected: {formatDate(po.expectedDelivery)}
                              </div>
                            )}

                            {/* Created Date */}
                            <div className="text-xs text-gray-500">
                              Created {formatDate(po.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PO Footer - Status Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Status Dropdown */}
                          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-1 py-1">
                            {/* <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: statusConfig.dotColor, display: 'inline-block', marginLeft: 8 }} /> */}
                            <Select
                              value={po.status || "DRAFT"}
                              onChange={(value) => handleUpdateStatus(po.id, value)}
                              size="small"
                              variant="borderless"
                              style={{ minWidth: 126 }}
                              options={STATUS_OPTIONS.map((s) => ({
                                label: (
                                  <span className="flex items-center gap-2">
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, display: 'inline-block' }} />
                                    {s.label}
                                  </span>
                                ),
                                value: s.value,
                              }))}
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePrint(po)}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <FiPrinter size={14} />
                            Print
                          </button>
                          <button
                            onClick={() => openViewModal(po)}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <FiEye size={14} />
                            View
                          </button>
                          <button
                            onClick={() => openGRNModal(po)}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <FiPackage size={14} />
                            GRN
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
        title="Create Purchase Order"
        open={createModalOpen}
        onCancel={handleCloseCreateModal}
        footer={null}
        width={1000}
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePO} className="mt-4">
          {/* Link to Material Request */}
          <Form.Item label="Link to Material Request (Optional)" name="materialRequestId">
            <Select
              placeholder="Select a material request to auto-fill items"
              options={materialRequests.map((mr) => ({ label: mr.title, value: mr.id }))}
              onChange={handleMaterialRequestChange}
              allowClear
            />
          </Form.Item>

          {/* Vendor Information */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FiUser size={16} />
              Vendor Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Vendor Name" name="vendorName" rules={[{ required: true, message: "Please select vendor name" }]}>
                <Select
                  placeholder="Select a Vendor Name"
                  options={vendors.map((vendor) => ({ label: vendor.name, value: vendor.name }))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  allowClear
                />
              </Form.Item>
              <Form.Item label="Expected Delivery" name="expectedDelivery">
                <DatePicker className="w-full" placeholder="Select expected delivery date" />
              </Form.Item>
            </div>
          </div>

          {renderItemsForm(formItems, handleItemChange, handleAddItem, handleRemoveItem)}

          <Form.Item label="Notes" name="notes" className="mt-4">
            <Input.TextArea rows={2} placeholder="Additional notes or terms" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseCreateModal}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "Create Purchase Order"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Edit PO Modal */}
      <Modal
        title="Edit Purchase Order"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false)
          setEditingPO(null)
          editForm.resetFields()
          setEditFormItems([])
        }}
        footer={null}
        width={1000}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditPO} className="mt-4">
          {/* Vendor Information */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FiUser size={16} />
              Vendor Information
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <Form.Item label="Vendor Name" name="vendorName" rules={[{ required: true, message: "Please select vendor name" }]}>
                <Select
                  placeholder="Select a Vendor Name"
                  options={vendors.map((vendor) => ({ label: vendor.name, value: vendor.name }))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  allowClear
                />
              </Form.Item>
              <Form.Item label="Expected Delivery" name="expectedDelivery">
                <DatePicker className="w-full" placeholder="Select expected delivery date" />
              </Form.Item>
              <Form.Item label="Status" name="status">
                <Select
                  options={STATUS_OPTIONS.map((s) => ({
                    label: renderStatusOption(s.label, s.color),
                    value: s.value,
                  }))}
                />
              </Form.Item>
            </div>
          </div>

          {renderItemsForm(editFormItems, handleEditItemChange, handleEditAddItem, handleEditRemoveItem)}

          <Form.Item label="Notes" name="notes" className="mt-4">
            <Input.TextArea rows={2} placeholder="Additional notes or terms" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false)
                setEditingPO(null)
                editForm.resetFields()
                setEditFormItems([])
              }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Save Changes
            </button>
          </div>
        </Form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        title="Purchase Order Details"
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false)
          setViewingPO(null)
        }}
        footer={null}
        width={800}
      >
        {viewingPO && (
          <div className="mt-4 space-y-6">
            {/* Header Info */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewingPO.poNumber || `PO-${viewingPO.id.slice(0, 8)}`}</h3>
                <p className="text-sm text-gray-500">Created {formatDate(viewingPO.createdAt)}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${STATUS_CONFIG[viewingPO.status?.toUpperCase() || "DRAFT"]?.bgColor} ${STATUS_CONFIG[viewingPO.status?.toUpperCase() || "DRAFT"]?.color}`}>
                <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[viewingPO.status?.toUpperCase() || "DRAFT"]?.dotColor}`} />
                {STATUS_CONFIG[viewingPO.status?.toUpperCase() || "DRAFT"]?.label}
              </span>
            </div>

            {/* Vendor Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Vendor Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FiUser className="text-gray-400" size={16} />
                  <span className="font-medium">{viewingPO.vendorName}</span>
                </div>
                {viewingPO.vendorContact && (
                  <div className="flex items-center gap-2">
                    <FiPhone className="text-gray-400" size={16} />
                    <span>{viewingPO.vendorContact}</span>
                  </div>
                )}
                {viewingPO.vendorEmail && (
                  <div className="flex items-center gap-2">
                    <FiMail className="text-gray-400" size={16} />
                    <span>{viewingPO.vendorEmail}</span>
                  </div>
                )}
                {viewingPO.expectedDelivery && (
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-gray-400" size={16} />
                    <span>Expected: {formatDate(viewingPO.expectedDelivery)}</span>
                  </div>
                )}
                {viewingPO.vendorAddress && (
                  <div className="col-span-2 flex items-start gap-2">
                    <FiMapPin className="text-gray-400 mt-0.5" size={16} />
                    <span>{viewingPO.vendorAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">Items ({viewingPO.items?.length || 0})</h4>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Item</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Qty</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Unit</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {viewingPO.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{item.itemName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-700">{item.quantity}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-500">{UNIT_OPTIONS.find(u => u.value === item.unit)?.label || item.unit}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{formatCurrency(item.unitPrice)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Grand Total</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-indigo-600">
                        {formatCurrency(viewingPO.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes */}
            {viewingPO.notes && (
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{viewingPO.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setViewModalOpen(false)
                  setViewingPO(null)
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => handlePrint(viewingPO)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <FiPrinter size={16} />
                Print
              </button>
              <button
                onClick={() => {
                  setViewModalOpen(false)
                  openGRNModal(viewingPO)
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <FiPackage size={16} />
                Record GRN
              </button>
              {canEditPOs && (
                <button
                  onClick={() => {
                    setViewModalOpen(false)
                    openEditModal(viewingPO)
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  <FiEdit2 size={16} />
                  Edit PO
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* GRN Modal */}
      <Modal
        title="Goods Receiving Note (GRN)"
        open={grnModalOpen}
        onCancel={() => {
          setGrnModalOpen(false)
          setGrnPO(null)
          setGrnItems([])
          setExistingGRN(null)
          grnForm.resetFields()
        }}
        footer={null}
        width={1000}
      >
        {grnPO && (
          <Form form={grnForm} layout="vertical" onFinish={handleCreateOrUpdateGRN} className="mt-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Form.Item label="PO Number">
                <Input value={grnPO.poNumber || `PO-${grnPO.id.slice(0, 8)}`} disabled />
              </Form.Item>
              <Form.Item label="Vendor">
                <Input value={grnPO.vendorName} disabled />
              </Form.Item>
              <Form.Item
                label="GRN Date"
                name="receivedDate"
                rules={[{ required: true, message: "Please select GRN date" }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item
                label="Received By"
                name="receivedBy"
                rules={[{ required: true, message: "Please enter who received the goods" }]}
              >
                <Input placeholder="Enter receiver name" />
              </Form.Item>
            </div>
            <Form.Item label="Remarks" name="remarks" className="mb-4">
              <Input.TextArea rows={2} placeholder="Overall remarks for this GRN" />
            </Form.Item>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FiPackage size={16} className="text-gray-400" />
                  GRN Items
                </label>
                <span className="text-xs text-gray-500">
                  Enter received and damaged quantities for each ordered item
                </span>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Item
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">
                        Ordered
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">
                        Received
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">
                        Damaged
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">
                        Net Received
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-40">
                        Item Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {grnItems.map((item, index) => {
                      const netReceived =
                        (item.receivedQuantity || 0) - (item.damagedQuantity || 0)

                      return (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-800">
                            {item.itemName}
                          </td>
                          <td className="px-3 py-2 text-center text-sm text-gray-600">
                            {item.orderedQuantity}
                          </td>
                          <td className="px-3 py-2">
                            <InputNumber
                              min={0}
                              value={item.receivedQuantity}
                              onChange={(val) =>
                                handleGRNItemChange(index, "receivedQuantity", val || 0)
                              }
                              className="w-full"
                              size="small"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <InputNumber
                              min={0}
                              value={item.damagedQuantity}
                              onChange={(val) =>
                                handleGRNItemChange(index, "damagedQuantity", val || 0)
                              }
                              className="w-full"
                              size="small"
                            />
                          </td>
                          <td className="px-3 py-2 text-center text-sm font-medium text-gray-800">
                            {netReceived}
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              placeholder="Item remarks"
                              value={item.remarks}
                              onChange={(e) =>
                                handleGRNItemChange(index, "remarks", e.target.value)
                              }
                              size="small"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setGrnModalOpen(false)
                  setGrnPO(null)
                  setGrnItems([])
                  grnForm.resetFields()
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={grnLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                {grnLoading ? "Saving GRN..." : existingGRN?.id ? "Update GRN" : "Save GRN"}
              </button>
            </div>
          </Form>
        )}
      </Modal>
    </ParentLayout>
  )
}

export { PurchaseOrders }

