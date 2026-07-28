/* eslint-disable @typescript-eslint/no-explicit-any */

import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Modal,
  Form,
  Input,
  Select,
  Skeleton,
  Empty,
  InputNumber,
} from "antd"
import { toast } from "react-hot-toast"
import { ParentLayout } from "../../layout/ParentLayout"
import { Request } from "../../utils/Request"
import { AuthContext } from "../../context/AuthContext"
import { UnitSelect } from "../../components/unit-components/UnitSelect"
import moment from "moment"
import {
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiPackage,
  FiFileText,
  FiDollarSign,
  FiShoppingCart,
} from "react-icons/fi"
import { MdOutlineRequestPage } from "react-icons/md"
import { BiRupee } from "react-icons/bi"

// Priority configuration
const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  HIGH: { label: "High", color: "text-red-700", bgColor: "bg-red-50", dotColor: "#ef4444" },
  MEDIUM: { label: "Medium", color: "text-amber-700", bgColor: "bg-amber-50", dotColor: "#f59e0b" },
  LOW: { label: "Low", color: "text-emerald-700", bgColor: "bg-emerald-50", dotColor: "#10b981" },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  PENDING: { label: "Pending", color: "text-amber-700", bgColor: "bg-amber-50", dotColor: "#f59e0b" },
  APPROVED: { label: "Approved", color: "text-emerald-700", bgColor: "bg-emerald-50", dotColor: "#10b981" },
  REJECTED: { label: "Rejected", color: "text-red-700", bgColor: "bg-red-50", dotColor: "#ef4444" },
  FULFILLED: { label: "Fulfilled", color: "text-blue-700", bgColor: "bg-blue-50", dotColor: "#3b82f6" },
}

const PRIORITY_OPTIONS = [
  { label: "High", value: "HIGH", color: "#ef4444" },
  { label: "Medium", value: "MEDIUM", color: "#f59e0b" },
  { label: "Low", value: "LOW", color: "#10b981" },
]

const STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING", color: "#f59e0b" },
  { label: "Approved", value: "APPROVED", color: "#10b981" },
  { label: "Rejected", value: "REJECTED", color: "#ef4444" },
  { label: "Fulfilled", value: "FULFILLED", color: "#3b82f6" },
]

const renderOptionWithDot = (label: string, color: string) => (
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

interface MaterialItem {
  id?: string
  itemName: string
  quantity: number
  unit: string
  estimatedCost: number
  remarks?: string
}

interface MaterialRequest {
  id: string
  title: string
  description?: string
  priority: string
  status?: string
  items: MaterialItem[]
  project?: { id: string; name: string }
  createdAt?: string
  createdBy?: { id: string; name: string }
  totalEstimatedCost?: number
}

interface Project {
  id: string
  name: string
  description?: string
}

const MaterialRequests = () => {
  const navigate = useNavigate()
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(false)
  const { permissions = [] } = useContext(AuthContext) as any
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [form] = Form.useForm()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Items for the form
  const [formItems, setFormItems] = useState<MaterialItem[]>([
    { itemName: "", quantity: 1, unit: "", estimatedCost: 0, remarks: "" }
  ])

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Actions
  const [actionMenuRequest, setActionMenuRequest] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<MaterialRequest | null>(null)
  const [editForm] = Form.useForm()
  const [editFormItems, setEditFormItems] = useState<MaterialItem[]>([])

  // View details
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingRequest, setViewingRequest] = useState<MaterialRequest | null>(null)

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false)
    form.resetFields()
    setFormItems([{ itemName: "", quantity: 1, unit: "", estimatedCost: 0, remarks: "" }])
  }

  const handleAddItem = () => {
    setFormItems([...formItems, { itemName: "", quantity: 1, unit: "", estimatedCost: 0, remarks: "" }])
  }

  const handleRemoveItem = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: keyof MaterialItem, value: any) => {
    const newItems = [...formItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormItems(newItems)
  }

  const handleEditAddItem = () => {
    setEditFormItems([...editFormItems, { itemName: "", quantity: 1, unit: "", estimatedCost: 0, remarks: "" }])
  }

  const handleEditRemoveItem = (index: number) => {
    if (editFormItems.length > 1) {
      setEditFormItems(editFormItems.filter((_, i) => i !== index))
    }
  }

  const handleEditItemChange = (index: number, field: keyof MaterialItem, value: any) => {
    const newItems = [...editFormItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setEditFormItems(newItems)
  }

  const validateItems = (items: MaterialItem[]): boolean => {
    for (const item of items) {
      if (!item.itemName || item.itemName.trim() === "") {
        toast.error("Please fill in all item names")
        return false
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error("Quantity must be greater than 0")
        return false
      }
      if (!item.unit) {
        toast.error("Please select a unit for all items")
        return false
      }
    }
    return true
  }

  const handleCreateRequest = async (values: any) => {
    try {
      if (!selectedProject) {
        toast.error("Please select a project first")
        return
      }
      if (!validateItems(formItems)) return

      setCreateLoading(true)
      await Request.post("/v1/api/material-requests", {
        ...values,
        projectId: selectedProject.id,
        items: formItems.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          estimatedCost: item.estimatedCost || 0,
          remarks: item.remarks || "",
        })),
      })
      await getMaterialRequestsByProject(selectedProject.id)
      handleCloseCreateModal()
      toast.success("Material request created successfully")
    } catch (error) {
      console.log(error)
      toast.error("Failed to create material request")
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

  const getMaterialRequestsByProject = async (projectId: string) => {
    if (!projectId) return
    setLoading(true)
    try {
      const response = await Request.get(`/v1/api/material-requests?projectId=${projectId}`)
      setMaterialRequests(response.data || [])
    } catch (error) {
      console.log(error)
      toast.error("Failed to load material requests")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setSelectedProject(project)
      await getMaterialRequestsByProject(projectId)
    }
  }

  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      await Request.put(`/v1/api/material-requests/${requestId}`, { status })
      setMaterialRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)))
      toast.success("Status updated")
    } catch (error) {
      console.log(error)
      toast.error("Failed to update status")
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await Request.delete(`/v1/api/material-requests/${requestId}`)
      setMaterialRequests((prev) => prev.filter((r) => r.id !== requestId))
      toast.success("Material request deleted")
      setActionMenuRequest(null)
    } catch (error) {
      console.log(error)
      toast.error("Failed to delete material request")
    }
  }

  const openEditModal = (request: MaterialRequest) => {
    setEditingRequest(request)
    editForm.setFieldsValue({
      title: request.title,
      description: request.description,
      priority: request.priority,
      status: request.status,
    })
    setEditFormItems(request.items.map(item => ({
      id: item.id,
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      estimatedCost: item.estimatedCost,
      remarks: item.remarks || "",
    })))
    setEditModalOpen(true)
    setActionMenuRequest(null)
  }

  const openViewModal = (request: MaterialRequest) => {
    setViewingRequest(request)
    setViewModalOpen(true)
    setActionMenuRequest(null)
  }

  const handleEditRequest = async (values: any) => {
    if (!editingRequest) return
    if (!validateItems(editFormItems)) return

    try {
      await Request.put(`/v1/api/material-requests/${editingRequest.id}`, {
        ...values,
        items: editFormItems.map(item => ({
          id: item.id,
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          estimatedCost: item.estimatedCost || 0,
          remarks: item.remarks || "",
        })),
      })
      setMaterialRequests((prev) =>
        prev.map((r) =>
          r.id === editingRequest.id
            ? {
                ...r,
                ...values,
                items: editFormItems,
                totalEstimatedCost: editFormItems.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0),
              }
            : r
        )
      )
      toast.success("Material request updated")
      setEditModalOpen(false)
      setEditingRequest(null)
      editForm.resetFields()
      setEditFormItems([])
    } catch (error) {
      console.log(error)
      toast.error("Failed to update material request")
    }
  }

  useEffect(() => {
    getProjects()
  }, [])

  // Filter requests
  const filteredRequests = materialRequests.filter((request) => {
    const matchesSearch =
      !searchTerm ||
      request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.items?.some(item => item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesPriority = !priorityFilter || request.priority?.toUpperCase() === priorityFilter
    const matchesStatus = !statusFilter || request.status?.toUpperCase() === statusFilter

    return matchesSearch && matchesPriority && matchesStatus
  })

  const formatDate = (date?: string) => (date ? moment(date).format("MMM DD, YYYY") : "—")
  const formatCurrency = (value?: number) =>
    value !== undefined ? Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value) : "—"

  // Stats
  const totalRequests = materialRequests.length
  const pendingRequests = materialRequests.filter((r) => r.status?.toUpperCase() === "PENDING").length
  const approvedRequests = materialRequests.filter((r) => r.status?.toUpperCase() === "APPROVED").length
  const totalEstimatedValue = materialRequests.reduce((sum, r) => {
    const requestTotal = r.items?.reduce((itemSum, item) => itemSum + (item.estimatedCost * item.quantity), 0) || 0
    return sum + requestTotal
  }, 0)

  const canCreateMaterialRequests = permissions.find((p: any) => p.name === "create_material_requests") || permissions.find((p: any) => p.name === "create_tasks")
  const canEditMaterialRequests = permissions.find((p: any) => p.name === "edit_material_requests") || permissions.find((p: any) => p.name === "edit_tasks")
  const canDeleteMaterialRequests = permissions.find((p: any) => p.name === "delete_material_requests") || permissions.find((p: any) => p.name === "delete_tasks")

  const renderItemsForm = (
    items: MaterialItem[],
    onChange: (index: number, field: keyof MaterialItem, value: any) => void,
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
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">Unit *</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">Est. Cost</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Remarks</th>
              <th className="px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
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
                  <UnitSelect
                    placeholder="Unit"
                    value={item.unit}
                    onChange={(val) => onChange(index, "unit", val)}
                    className="w-full"
                    size="small"
                  />
                </td>
                <td className="px-2 py-2">
                  <InputNumber
                    placeholder="Cost"
                    value={item.estimatedCost}
                    onChange={(val) => onChange(index, "estimatedCost", val || 0)}
                    min={0}
                    className="w-full"
                    size="small"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value?.replace(/,/g, '') as unknown as number}
                  />
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
              <td colSpan={3} className="px-3 py-2 text-right text-sm font-medium text-gray-700">Total Estimated Cost:</td>
              <td className="px-2 py-2 text-left text-base font-bold text-violet-600">
                {formatCurrency(items.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0))}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )

  return (
    <ParentLayout title="Material Requests">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
                <MdOutlineRequestPage className="text-orange-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Material Requests</h1>
                <p className="text-sm text-gray-500">Select a project to view and manage material requests</p>
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
              {selectedProject && canCreateMaterialRequests && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  <FiPlus size={18} />
                  New Request
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
                  <p className="text-gray-500">Select a project to view material requests</p>
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
                    <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
                    <p className="text-xs text-gray-500">Total Requests</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{pendingRequests}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{approvedRequests}</p>
                    <p className="text-xs text-gray-500">Approved</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                    <FiDollarSign className="text-violet-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-violet-600">{formatCurrency(totalEstimatedValue)}</p>
                    <p className="text-xs text-gray-500">Est. Value</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search requests or items..."
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
                  className="w-32"
                  allowClear
                  options={STATUS_OPTIONS.map((s) => ({
                    label: renderOptionWithDot(s.label, s.color),
                    value: s.value,
                  }))}
                />
                <Select
                  value={priorityFilter || undefined}
                  onChange={setPriorityFilter}
                  placeholder="Priority"
                  className="w-32"
                  allowClear
                  options={PRIORITY_OPTIONS.map((p) => ({
                    label: renderOptionWithDot(p.label, p.color),
                    value: p.value,
                  }))}
                />
                {(searchTerm || statusFilter || priorityFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("")
                      setPriorityFilter("")
                    }}
                    className="text-sm font-medium text-violet-600 hover:text-violet-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Request List */}
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <Skeleton active paragraph={{ rows: 5 }} />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={searchTerm || statusFilter || priorityFilter ? "No requests match your filters" : "No material requests yet"}
                >
                  {canCreateMaterialRequests && !searchTerm && !statusFilter && !priorityFilter && (
                    <button
                      onClick={() => setCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    >
                      <FiPlus size={16} />
                      Create first request
                    </button>
                  )}
                </Empty>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Request Count Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Request Cards */}
                {filteredRequests.map((request) => {
                  const statusConfig = STATUS_CONFIG[request.status?.toUpperCase() || "PENDING"] || STATUS_CONFIG.PENDING
                  const priorityConfig = request.priority ? PRIORITY_CONFIG[request.priority?.toUpperCase()] : null
                  const totalCost = request.items?.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0) || 0

                  return (
                    <div
                      key={request.id}
                      className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
                    >
                      {/* Request Header */}
                      <div className="flex items-start gap-4 p-4">
                        {/* Icon */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                          <FiPackage className="text-orange-600" size={20} />
                        </div>

                        {/* Request Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900">{request.title}</h3>
                              {request.description && (
                                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{request.description}</p>
                              )}
                            </div>

                            {/* Actions Menu */}
                            <div className="relative shrink-0">
                              <button
                                onClick={() => setActionMenuRequest(actionMenuRequest === request.id ? null : request.id)}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              >
                                <FiMoreVertical size={18} />
                              </button>
                              {actionMenuRequest === request.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setActionMenuRequest(null)} />
                                  <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                                    <button
                                      onClick={() => openViewModal(request)}
                                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <FiFileText size={16} className="text-gray-400" />
                                      View Details
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActionMenuRequest(null)
                                        navigate('/purchase-orders', { state: { materialRequest: request, projectId: selectedProject?.id } })
                                      }}
                                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <FiShoppingCart size={16} className="text-gray-400" />
                                      Generate PO
                                    </button>
                                    {canEditMaterialRequests && (
                                      <button
                                        onClick={() => openEditModal(request)}
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                      >
                                        <FiEdit2 size={16} className="text-gray-400" />
                                        Edit Request
                                      </button>
                                    )}
                                    {canDeleteMaterialRequests && (
                                      <>
                                        <div className="my-1 border-t border-gray-100" />
                                        <button
                                          onClick={() => handleDeleteRequest(request.id)}
                                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                                        >
                                          <FiTrash2 size={16} />
                                          Delete Request
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
                            <span className="text-xs font-medium text-gray-500">{request.items?.length || 0} items:</span>
                            {request.items?.slice(0, 3).map((item, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                {item.itemName}
                                <span className="text-gray-400">×{item.quantity}</span>
                              </span>
                            ))}
                            {(request.items?.length || 0) > 3 && (
                              <span className="text-xs text-gray-400">+{(request.items?.length || 0) - 3} more</span>
                            )}
                          </div>

                          {/* Request Meta Info */}
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            {/* Estimated Cost */}
                            <div className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-1.5">
                              <BiRupee className="text-violet-600" size={16} />
                              <span className="text-sm font-semibold text-violet-700">{formatCurrency(totalCost)}</span>
                            </div>

                            {/* Date */}
                            <div className="text-xs text-gray-500">
                              Created {formatDate(request.createdAt)}
                            </div>

                            {/* Created By */}
                            {request.createdBy && (
                              <div className="text-xs text-gray-500">
                                by {request.createdBy.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Request Footer - Status & Priority Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Status Dropdown */}
                          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-1 py-1">
                            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: statusConfig.dotColor, display: 'inline-block', marginLeft: 8 }} />
                            <Select
                              value={request.status || "PENDING"}
                              onChange={(value) => handleUpdateStatus(request.id, value)}
                              size="small"
                              variant="borderless"
                              style={{ minWidth: 110 }}
                              options={STATUS_OPTIONS.map((s) => ({
                                label: renderOptionWithDot(s.label, s.color),
                                value: s.value,
                              }))}
                            />
                          </div>

                          {/* Priority Badge */}
                          {priorityConfig && (
                            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${priorityConfig.bgColor}`}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: priorityConfig.dotColor, display: 'inline-block' }} />
                              <span className={`text-xs font-medium ${priorityConfig.color}`}>{priorityConfig.label}</span>
                            </div>
                          )}
                        </div>

                        {/* View Details Button */}
                        <button
                          onClick={() => openViewModal(request)}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <FiFileText size={14} />
                          View Details
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Material Request Modal */}
      <Modal
        title="Create Material Request"
        open={createModalOpen}
        onCancel={handleCloseCreateModal}
        footer={null}
        width={900}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRequest} className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Form.Item label="Title" name="title" rules={[{ required: true, message: "Please enter request title" }]}>
                <Input placeholder="Enter request title (e.g., Steel Bars for Foundation)" />
              </Form.Item>
            </div>
            <Form.Item label="Priority" name="priority" rules={[{ required: true, message: "Please select priority" }]}>
              <Select
                placeholder="Select priority"
                options={PRIORITY_OPTIONS.map((p) => ({
                  label: (
                    <span className="flex items-center gap-2">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color, display: 'inline-block' }} />
                      {p.label}
                    </span>
                  ),
                  value: p.value,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item label="Description" name="description" className="mb-4">
            <Input.TextArea rows={2} placeholder="Enter description or notes about this request" />
          </Form.Item>

          {renderItemsForm(formItems, handleItemChange, handleAddItem, handleRemoveItem)}

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
              {createLoading ? "Creating..." : "Create Request"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Edit Material Request Modal */}
      <Modal
        title="Edit Material Request"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false)
          setEditingRequest(null)
          editForm.resetFields()
          setEditFormItems([])
        }}
        footer={null}
        width={900}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditRequest} className="mt-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <Form.Item label="Title" name="title" rules={[{ required: true, message: "Please enter request title" }]}>
                <Input placeholder="Enter request title" />
              </Form.Item>
            </div>
            <Form.Item label="Priority" name="priority" rules={[{ required: true, message: "Please select priority" }]}>
              <Select
                placeholder="Select priority"
                options={PRIORITY_OPTIONS.map((p) => ({
                  label: (
                    <span className="flex items-center gap-2">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color, display: 'inline-block' }} />
                      {p.label}
                    </span>
                  ),
                  value: p.value,
                }))}
              />
            </Form.Item>
            <Form.Item label="Status" name="status">
              <Select
                placeholder="Select status"
                options={STATUS_OPTIONS.map((s:any) => ({
                  label: (
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  ),
                  value: s.value,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item label="Description" name="description" className="mb-4">
            <Input.TextArea rows={2} placeholder="Enter description" />
          </Form.Item>

          {renderItemsForm(editFormItems, handleEditItemChange, handleEditAddItem, handleEditRemoveItem)}

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false)
                setEditingRequest(null)
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
        title="Material Request Details"
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false)
          setViewingRequest(null)
        }}
        footer={null}
        width={700}
      >
        {viewingRequest && (
          <div className="mt-4 space-y-6">
            {/* Header Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{viewingRequest.title}</h3>
                  {viewingRequest.description && (
                    <p className="mt-1 text-sm text-gray-600">{viewingRequest.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {viewingRequest.priority && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_CONFIG[viewingRequest.priority.toUpperCase()]?.bgColor} ${PRIORITY_CONFIG[viewingRequest.priority.toUpperCase()]?.color}`}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: PRIORITY_CONFIG[viewingRequest.priority.toUpperCase()]?.dotColor, display: 'inline-block' }} />
                      {PRIORITY_CONFIG[viewingRequest.priority.toUpperCase()]?.label}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CONFIG[viewingRequest.status?.toUpperCase() || "PENDING"]?.bgColor} ${STATUS_CONFIG[viewingRequest.status?.toUpperCase() || "PENDING"]?.color}`}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: STATUS_CONFIG[viewingRequest.status?.toUpperCase() || "PENDING"]?.dotColor, display: 'inline-block' }} />
                    {STATUS_CONFIG[viewingRequest.status?.toUpperCase() || "PENDING"]?.label}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span>Created: {formatDate(viewingRequest.createdAt)}</span>
                {viewingRequest.createdBy && <span>By: {viewingRequest.createdBy.name}</span>}
                {viewingRequest.project && <span>Project: {viewingRequest.project.name}</span>}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">Items ({viewingRequest.items?.length || 0})</h4>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Item</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Qty</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Unit</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Est. Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {viewingRequest.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{item.itemName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-700">{item.quantity}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-500">{item.unit || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{formatCurrency(item.estimatedCost)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(item.estimatedCost * item.quantity)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.remarks || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Grand Total</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-violet-600">
                        {formatCurrency(viewingRequest.items?.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0) || 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setViewModalOpen(false)
                  setViewingRequest(null)
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Close
              </button>
              {canEditMaterialRequests && (
                <button
                  onClick={() => {
                    setViewModalOpen(false)
                    openEditModal(viewingRequest)
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  <FiEdit2 size={16} />
                  Edit Request
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </ParentLayout>
  )
}

export { MaterialRequests }

