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
  Table,
  Tabs,
  Badge,
  Popconfirm,
  Tag,
  Tooltip,
} from "antd"
import { toast } from "react-hot-toast"
import { ParentLayout } from "../../layout/ParentLayout"
import { Request } from "../../utils/Request"
import { AuthContext } from "../../context/AuthContext"
import moment from "moment"
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiPackage,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiBox,
  FiLayers,
  FiActivity,
  FiEye,
  FiMapPin,
} from "react-icons/fi"
import { TbPackages } from "react-icons/tb"

// Transaction Types
const TRANSACTION_TYPES = [
  { label: "Manual Add", value: "MANUAL_ADD", icon: FiTrendingUp, color: "#10b981" },
  { label: "Manual Subtract", value: "MANUAL_SUBTRACT", icon: FiTrendingDown, color: "#f59e0b" },
  { label: "Manual Adjust", value: "MANUAL_ADJUST", icon: FiActivity, color: "#3b82f6" },
  { label: "Damage", value: "DAMAGE", icon: FiAlertTriangle, color: "#ef4444" },
  { label: "Usage", value: "USAGE", icon: FiBox, color: "#8b5cf6" },
  { label: "Return", value: "RETURN", icon: FiTrendingUp, color: "#06b6d4" },
  { label: "Transfer", value: "TRANSFER", icon: FiLayers, color: "#f97316" },
]

const TRANSACTION_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  GRN_RECEIPT: { label: "GRN Receipt", color: "text-emerald-700", bgColor: "bg-emerald-50", icon: FiPackage },
  MANUAL_ADD: { label: "Manual Add", color: "text-green-700", bgColor: "bg-green-50", icon: FiTrendingUp },
  MANUAL_SUBTRACT: { label: "Manual Subtract", color: "text-amber-700", bgColor: "bg-amber-50", icon: FiTrendingDown },
  MANUAL_ADJUST: { label: "Manual Adjust", color: "text-blue-700", bgColor: "bg-blue-50", icon: FiActivity },
  DAMAGE: { label: "Damage", color: "text-red-700", bgColor: "bg-red-50", icon: FiAlertTriangle },
  USAGE: { label: "Usage", color: "text-purple-700", bgColor: "bg-purple-50", icon: FiBox },
  RETURN: { label: "Return", color: "text-cyan-700", bgColor: "bg-cyan-50", icon: FiTrendingUp },
  TRANSFER: { label: "Transfer", color: "text-orange-700", bgColor: "bg-orange-50", icon: FiLayers },
}

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

// Helper to safely extract data from API response (interceptor already unwraps once)
const extractData = (response: any, fallback: any = []) => {
  if (Array.isArray(response)) return response
  if (response?.data && Array.isArray(response.data)) return response.data
  if (response?.data) return response.data
  return fallback
}

interface InventoryItem {
  id: string
  itemName: string
  description?: string
  category?: string
  unit: string
  quantity: number
  minimumQuantity?: number
  location?: string
  projectId?: string
  project?: { id: string; name: string }
  remarks?: string
  createdAt?: string
  updatedAt?: string
  transactions?: InventoryTransaction[]
}

interface InventoryTransaction {
  id: string
  transactionType: string
  quantity: number
  remarks?: string
  createdAt: string
  createdBy?: { id: string; name: string }
}

interface InventorySummary {
  totalItems: number
  totalQuantity: number
  lowStockCount: number
  categoryBreakdown: Array<{ category: string; count: number }>
  recentTransactions: InventoryTransaction[]
}

interface Project {
  id: string
  name: string
  description?: string
}

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const { permissions = [] } = useContext(AuthContext) as any
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [summary, setSummary] = useState<InventorySummary | null>(null)

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm] = Form.useForm()

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editForm] = Form.useForm()

  // Adjust Quantity Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null)
  const [adjustForm] = Form.useForm()
  const [adjustLoading, setAdjustLoading] = useState(false)

  // View Details Modal
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null)
  const [itemTransactions, setItemTransactions] = useState<InventoryTransaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Permissions - flexible check
  const hasPermission = (names: string[]) =>
    names.some((n) => permissions.find((p: any) => p.name === n))

  const canCreate = hasPermission(["create_inventory", "manage_inventory", "view_projects"])
  const canEdit = hasPermission(["edit_inventory", "manage_inventory", "view_projects"])
  const canDelete = hasPermission(["delete_inventory", "manage_inventory", "view_projects"])

  // ---------- API calls ----------

  const getProjects = async () => {
    setProjectsLoading(true)
    try {
      const response: any = await Request.get("/v1/api/projects/all")
      setProjects(extractData(response))
    } catch (error) {
      console.log(error)
      toast.error("Failed to load projects")
    } finally {
      setProjectsLoading(false)
    }
  }

  const getInventorySummary = async (projectId?: string) => {
    try {
      const url = projectId
        ? `/v1/api/inventory/summary?projectId=${projectId}`
        : "/v1/api/inventory/summary"
      const response: any = await Request.get(url)
      const data = response?.data || response || null
      setSummary(data)
    } catch (error) {
      console.log("Summary API not available, computing locally")
      setSummary(null)
    }
  }

  const getInventoryItems = async (projectId?: string) => {
    setLoading(true)
    try {
      let url = "/v1/api/inventory"
      const params = new URLSearchParams()

      if (projectId) params.append("projectId", projectId)
      if (categoryFilter) params.append("category", categoryFilter)
      if (searchTerm) params.append("search", searchTerm)

      if (params.toString()) url += `?${params.toString()}`

      const response: any = await Request.get(url)
      const items = extractData(response)
      setInventoryItems(items)
    } catch (error) {
      console.log(error)
      toast.error("Failed to load inventory items")
    } finally {
      setLoading(false)
    }
  }

  const getLowStockItems = async (projectId?: string) => {
    setLoading(true)
    try {
      const url = projectId
        ? `/v1/api/inventory/low-stock?projectId=${projectId}`
        : "/v1/api/inventory/low-stock"
      const response: any = await Request.get(url)
      setInventoryItems(extractData(response))
    } catch (error) {
      console.log(error)
      toast.error("Failed to load low stock items")
    } finally {
      setLoading(false)
    }
  }

  // fetchItemTransactions is handled inside openViewModal

  // ---------- Handlers ----------

  const handleSelectProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setSelectedProject(project)
      setActiveTab("all")
      await Promise.all([
        getInventorySummary(projectId),
        getInventoryItems(projectId),
      ])
    }
  }

  const handleTabChange = async (key: string) => {
    setActiveTab(key)
    if (key === "all") {
      await getInventoryItems(selectedProject?.id)
    } else {
      await getLowStockItems(selectedProject?.id)
    }
  }

  // --- Create ---
  const handleCreateItem = async (values: any) => {
    if (!selectedProject) {
      toast.error("Please select a project first")
      return
    }
    try {
      setCreateLoading(true)
      await Request.post("/v1/api/inventory", {
        ...values,
        projectId: selectedProject.id,
      })
      await Promise.all([
        getInventoryItems(selectedProject.id),
        getInventorySummary(selectedProject.id),
      ])
      setCreateModalOpen(false)
      createForm.resetFields()
      toast.success("Inventory item created successfully")
    } catch (error: any) {
      console.log(error)
      toast.error(error?.response?.data?.message || "Failed to create inventory item")
    } finally {
      setCreateLoading(false)
    }
  }

  // --- Edit ---
  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item)
    editForm.setFieldsValue({
      itemName: item.itemName,
      description: item.description,
      category: item.category,
      unit: item.unit,
      minimumQuantity: item.minimumQuantity,
      location: item.location,
      remarks: item.remarks,
    })
    setEditModalOpen(true)
  }

  const handleEditItem = async (values: any) => {
    if (!editingItem) return
    try {
      await Request.put(`/v1/api/inventory/${editingItem.id}`, values)
      setInventoryItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...item, ...values } : item
        )
      )
      setEditModalOpen(false)
      setEditingItem(null)
      editForm.resetFields()
      toast.success("Inventory item updated successfully")
    } catch (error: any) {
      console.log(error)
      toast.error(error?.response?.data?.message || "Failed to update inventory item")
    }
  }

  // --- Adjust Qty ---
  const openAdjustModal = (item: InventoryItem) => {
    setAdjustingItem(item)
    adjustForm.resetFields()
    adjustForm.setFieldsValue({ transactionType: "MANUAL_ADD", quantity: 0 })
    setAdjustModalOpen(true)
  }

  const handleAdjustQuantity = async (values: any) => {
    if (!adjustingItem) return
    try {
      setAdjustLoading(true)
      await Request.post(`/v1/api/inventory/${adjustingItem.id}/adjust`, values)
      await Promise.all([
        getInventoryItems(selectedProject?.id),
        getInventorySummary(selectedProject?.id),
      ])
      setAdjustModalOpen(false)
      setAdjustingItem(null)
      adjustForm.resetFields()
      toast.success("Inventory quantity adjusted successfully")
    } catch (error: any) {
      console.log(error)
      toast.error(error?.response?.data?.message || "Failed to adjust inventory quantity")
    } finally {
      setAdjustLoading(false)
    }
  }

  // --- Delete ---
  const handleDeleteItem = async (itemId: string) => {
    try {
      await Request.delete(`/v1/api/inventory/${itemId}`)
      setInventoryItems((prev) => prev.filter((item) => item.id !== itemId))
      await getInventorySummary(selectedProject?.id)
      toast.success("Inventory item deleted successfully")
    } catch (error: any) {
      console.log(error)
      toast.error(error?.response?.data?.message || "Failed to delete inventory item")
    }
  }

  // --- View Details ---
  const openViewModal = (item: InventoryItem) => {
    console.log("Opening view modal for:", item?.itemName, item?.id)
    setViewingItem(item)
    setItemTransactions([])
    setViewModalOpen(true)

    // Fetch item detail + transactions (don't block modal opening)
    if (item?.id) {
      // Try the single-item endpoint first (returns item + transactions)
      Request.get(`/v1/api/inventory/${item.id}`)
        .then((res: any) => {
          const data = res?.data || res
          if (data?.transactions) {
            setItemTransactions(Array.isArray(data.transactions) ? data.transactions : [])
          }
          // Update viewingItem with fresh data from API
          if (data?.id) {
            setViewingItem(data)
          }
        })
        .catch((err: any) => {
          console.log("Item detail fetch error:", err)
          // Fallback: try the transactions-only endpoint
          Request.get(`/v1/api/inventory/${item.id}/transactions?limit=50`)
            .then((txnRes: any) => {
              const txns = extractData(txnRes)
              setItemTransactions(txns)
            })
            .catch((txnErr: any) => {
              console.log("Transactions fetch error:", txnErr)
              setItemTransactions([])
            })
        })
        .finally(() => {
          setTransactionsLoading(false)
        })
      setTransactionsLoading(true)
    }
  }

  // ---------- Effects ----------

  useEffect(() => {
    getProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      const timer = setTimeout(() => {
        if (activeTab === "all") {
          getInventoryItems(selectedProject.id)
        } else {
          getLowStockItems(selectedProject.id)
        }
      }, 300) // debounce search
      return () => clearTimeout(timer)
    }
  }, [searchTerm, categoryFilter])

  // ---------- Computed ----------

  const categories = Array.from(
    new Set(inventoryItems.map((item) => item.category).filter(Boolean))
  )

  // Local summary when API summary isn't available
  const computedSummary = summary || {
    totalItems: inventoryItems.length,
    totalQuantity: inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    lowStockCount: inventoryItems.filter(
      (item) => item.minimumQuantity && item.quantity <= item.minimumQuantity
    ).length,
    categoryBreakdown: categories.map((cat) => ({
      category: cat as string,
      count: inventoryItems.filter((i) => i.category === cat).length,
    })),
  }

  const getStockStatus = (item: InventoryItem) => {
    if (!item.minimumQuantity) return "normal"
    if (item.quantity <= 0) return "out"
    if (item.quantity <= item.minimumQuantity) return "low"
    return "normal"
  }

  // ---------- Columns ----------

  const columns: any[] = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
      render: (text: string, record: InventoryItem) => (
        <div
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); openViewModal(record); }}
        >
          <div className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
            {text}
          </div>
          {record.description && (
            <div className="text-xs text-gray-500 mt-0.5">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 160,
      render: (text: string) =>
        text ? (
          <Tag color="default" className="rounded-md">
            {text}
          </Tag>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 130,
      align: "center" as const,
      sorter: (a: InventoryItem, b: InventoryItem) => a.quantity - b.quantity,
      render: (qty: number, record: InventoryItem) => {
        const status = getStockStatus(record)
        return (
          <div className="flex flex-col items-center gap-1">
            <span
              className={`font-semibold ${
                status === "out"
                  ? "text-red-600"
                  : status === "low"
                  ? "text-amber-600"
                  : "text-gray-900"
              }`}
            >
              {qty} {record.unit}
            </span>
            {status === "out" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                <FiAlertTriangle size={10} />
                OUT
              </span>
            )}
            {status === "low" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                <FiAlertTriangle size={10} />
                LOW
              </span>
            )}
          </div>
        )
      },
    },
    {
      title: "Min. Qty",
      dataIndex: "minimumQuantity",
      key: "minimumQuantity",
      width: 100,
      align: "center" as const,
      render: (qty: number, record: InventoryItem) =>
        qty ? (
          <span className="text-gray-600">
            {qty} {record.unit}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      width: 150,
      render: (text: string) =>
        text ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
            <FiMapPin size={13} className="text-gray-400" />
            {text}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      align: "center" as const,
      render: (_: any, record: InventoryItem) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <span
            onClick={(e) => { e.stopPropagation(); openViewModal(record); }}
            title="View Details"
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 cursor-pointer transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          >
            <FiEye size={16} />
          </span>
          <span
            onClick={(e) => { e.stopPropagation(); openAdjustModal(record); }}
            title="Adjust Quantity"
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 cursor-pointer transition-colors hover:bg-emerald-50 hover:text-emerald-600"
          >
            <FiActivity size={16} />
          </span>
          {canEdit && (
            <span
              onClick={(e) => { e.stopPropagation(); openEditModal(record); }}
              title="Edit Item"
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 cursor-pointer transition-colors hover:bg-amber-50 hover:text-amber-600"
            >
              <FiEdit2 size={16} />
            </span>
          )}
          {canDelete && (
            <Popconfirm
              title="Delete this item?"
              description="This will also delete all transaction history."
              onConfirm={() => handleDeleteItem(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <span
                onClick={(e) => e.stopPropagation()}
                title="Delete Item"
                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 cursor-pointer transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <FiTrash2 size={16} />
              </span>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ]

  // ---------- Render ----------

  return (
    <ParentLayout title="Inventory Management">
      <div className="flex flex-col gap-4">
        {/* Page Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                <TbPackages className="text-indigo-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Inventory Management
                </h1>
                <p className="text-sm text-gray-500">
                  Track and manage inventory across projects
                </p>
              </div>
            </div>

            {/* Project Selector + Actions */}
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
                  (option?.label as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={projects.map((p) => ({
                  label: p.name,
                  value: p.id,
                }))}
                suffixIcon={<FiChevronDown className="text-gray-400" />}
              />
              {selectedProject && canCreate && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  <FiPlus size={18} />
                  Add Item
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
                  <p className="text-gray-500">
                    Select a project to view inventory
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Choose a project from the dropdown above
                  </p>
                </div>
              }
            />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                    <FiBox className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {computedSummary.totalItems}
                    </p>
                    <p className="text-xs text-gray-500">Total Items</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                    <FiLayers className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {computedSummary.totalQuantity}
                    </p>
                    <p className="text-xs text-gray-500">Total Quantity</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                    <FiAlertTriangle className="text-red-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {computedSummary.lowStockCount}
                    </p>
                    <p className="text-xs text-gray-500">Low Stock</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                    <FiPackage className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {computedSummary.categoryBreakdown?.length || 0}
                    </p>
                    <p className="text-xs text-gray-500">Categories</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs + Filters */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 px-4">
                <Tabs
                  activeKey={activeTab}
                  onChange={handleTabChange}
                  className="mb-0"
                  style={{ marginBottom: 0 }}
                  items={[
                    {
                      key: "all",
                      label: (
                        <span className="flex items-center gap-2">
                          <FiBox size={15} />
                          All Items
                        </span>
                      ),
                    },
                    {
                      key: "lowStock",
                      label: (
                        <span className="flex items-center gap-2">
                          <FiAlertTriangle size={15} />
                          Low Stock
                          {computedSummary.lowStockCount > 0 && (
                            <Badge
                              count={computedSummary.lowStockCount}
                              style={{ backgroundColor: "#ef4444" }}
                            />
                          )}
                        </span>
                      ),
                    },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <FiSearch
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 pl-10 rounded-lg border-gray-200"
                    allowClear
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {categories.length > 0 && (
                    <Select
                      value={categoryFilter || undefined}
                      onChange={setCategoryFilter}
                      placeholder="Category"
                      className="w-40"
                      allowClear
                      options={categories.map((cat) => ({
                        label: cat,
                        value: cat,
                      }))}
                    />
                  )}
                  {(searchTerm || categoryFilter) && (
                    <button
                      onClick={() => {
                        setSearchTerm("")
                        setCategoryFilter("")
                      }}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory Table */}
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <Skeleton active paragraph={{ rows: 5 }} />
              </div>
            ) : inventoryItems.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    activeTab === "lowStock"
                      ? "No low stock items — all good!"
                      : searchTerm || categoryFilter
                      ? "No items match your filters"
                      : "No inventory items yet"
                  }
                >
                  {canCreate &&
                    activeTab === "all" &&
                    !searchTerm &&
                    !categoryFilter && (
                      <button
                        onClick={() => setCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                      >
                        <FiPlus size={16} />
                        Add First Item
                      </button>
                    )}
                </Empty>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <Table
                  dataSource={inventoryItems}
                  columns={columns}
                  pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`,
                  }}
                  rowKey="id"
                  size="middle"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ───────── Create Item Modal ───────── */}
      <Modal
        title="Add Inventory Item"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false)
          createForm.resetFields()
        }}
        footer={null}
        width={700}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateItem}
          className="mt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Item Name"
              name="itemName"
              rules={[{ required: true, message: "Please enter item name" }]}
            >
              <Input placeholder="e.g., Cement" />
            </Form.Item>
            <Form.Item label="Category" name="category">
              <Input placeholder="e.g., Construction Material" />
            </Form.Item>
          </div>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Item description" />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              label="Quantity"
              name="quantity"
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber min={0} className="w-full" placeholder="100" />
            </Form.Item>
            <Form.Item
              label="Unit"
              name="unit"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select unit" options={UNIT_OPTIONS} />
            </Form.Item>
            <Form.Item label="Minimum Quantity" name="minimumQuantity">
              <InputNumber min={0} className="w-full" placeholder="50" />
            </Form.Item>
          </div>

          <Form.Item label="Location" name="location">
            <Input placeholder="e.g., Warehouse A" />
          </Form.Item>

          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={2} placeholder="Additional notes" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setCreateModalOpen(false)
                createForm.resetFields()
              }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {createLoading ? "Adding..." : "Add Item"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* ───────── Edit Item Modal ───────── */}
      <Modal
        title="Edit Inventory Item"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false)
          setEditingItem(null)
          editForm.resetFields()
        }}
        footer={null}
        width={700}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditItem}
          className="mt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Item Name"
              name="itemName"
              rules={[{ required: true, message: "Please enter item name" }]}
            >
              <Input placeholder="Item name" />
            </Form.Item>
            <Form.Item label="Category" name="category">
              <Input placeholder="Category" />
            </Form.Item>
          </div>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Item description" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Unit"
              name="unit"
              rules={[{ required: true, message: "Please select unit" }]}
            >
              <Select placeholder="Select unit" options={UNIT_OPTIONS} />
            </Form.Item>
            <Form.Item label="Minimum Quantity" name="minimumQuantity">
              <InputNumber min={0} className="w-full" placeholder="Min qty" />
            </Form.Item>
          </div>

          <Form.Item label="Location" name="location">
            <Input placeholder="Location" />
          </Form.Item>

          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={2} placeholder="Additional notes" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false)
                setEditingItem(null)
                editForm.resetFields()
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

      {/* ───────── Adjust Quantity Modal ───────── */}
      <Modal
        title={
          <span className="flex items-center gap-2">
            <FiActivity size={18} className="text-indigo-600" />
            Adjust Quantity — {adjustingItem?.itemName}
          </span>
        }
        open={adjustModalOpen}
        onCancel={() => {
          setAdjustModalOpen(false)
          setAdjustingItem(null)
          adjustForm.resetFields()
        }}
        footer={null}
        width={600}
      >
        {adjustingItem && (
          <div className="mt-4">
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Quantity:</span>
                <span className="text-lg font-bold text-gray-900">
                  {adjustingItem.quantity} {adjustingItem.unit}
                </span>
              </div>
            </div>

            <Form
              form={adjustForm}
              layout="vertical"
              onFinish={handleAdjustQuantity}
            >
              <Form.Item
                label="Transaction Type"
                name="transactionType"
                rules={[
                  { required: true, message: "Please select transaction type" },
                ]}
              >
                <Select placeholder="Select transaction type">
                  {TRANSACTION_TYPES.map((type) => (
                    <Select.Option key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon size={14} style={{ color: type.color }} />
                        {type.label}
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[{ required: true, message: "Please enter quantity" }]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  placeholder="Enter quantity"
                  addonAfter={adjustingItem.unit}
                />
              </Form.Item>

              <Form.Item label="Remarks" name="remarks">
                <Input.TextArea
                  rows={3}
                  placeholder="Reason for adjustment"
                />
              </Form.Item>

              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustModalOpen(false)
                    setAdjustingItem(null)
                    adjustForm.resetFields()
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  {adjustLoading ? "Adjusting..." : "Adjust Quantity"}
                </button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* ───────── View Details Modal ───────── */}
      <Modal
        title={null}
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false)
          setViewingItem(null)
          setItemTransactions([])
        }}
        footer={null}
        width={1100}
      >
        {viewingItem && (
          <div className="space-y-5">
            {/* Hero Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                  <FiPackage className="text-indigo-600" size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{viewingItem.itemName}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {viewingItem.category && (
                      <span className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        {viewingItem.category}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {viewingItem.project?.name || selectedProject?.name || ""}
                    </span>
                  </div>
                </div>
              </div>
              {/* Stock Status Badge */}
              {getStockStatus(viewingItem) === "low" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <FiAlertTriangle size={13} />
                  LOW STOCK
                </span>
              )}
              {getStockStatus(viewingItem) === "out" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                  <FiAlertTriangle size={13} />
                  OUT OF STOCK
                </span>
              )}
            </div>

            {/* Quantity Highlight Card */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border-2 border-indigo-100 bg-indigo-50/60 p-4 text-center">
                <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                  Current Stock
                </div>
                <div className={`text-2xl font-extrabold mt-1 ${
                  getStockStatus(viewingItem) === "out" ? "text-red-600" :
                  getStockStatus(viewingItem) === "low" ? "text-amber-600" :
                  "text-indigo-700"
                }`}>
                  {viewingItem.quantity}
                </div>
                <div className="text-xs font-medium text-indigo-400 mt-0.5">{viewingItem.unit}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Min. Required
                </div>
                <div className="text-2xl font-extrabold text-gray-800 mt-1">
                  {viewingItem.minimumQuantity || "—"}
                </div>
                <div className="text-xs font-medium text-gray-400 mt-0.5">
                  {viewingItem.minimumQuantity ? viewingItem.unit : "Not set"}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Location
                </div>
                <div className="text-lg font-bold text-gray-800 mt-1 truncate">
                  {viewingItem.location || "—"}
                </div>
                <div className="text-xs font-medium text-gray-400 mt-0.5">
                  {viewingItem.location ? "Storage" : "Not assigned"}
                </div>
              </div>
            </div>

            {/* Description & Remarks */}
            {(viewingItem.description || viewingItem.remarks) && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                {viewingItem.description && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</div>
                    <p className="text-sm text-gray-800 mt-1 leading-relaxed">{viewingItem.description}</p>
                  </div>
                )}
                {viewingItem.description && viewingItem.remarks && <div className="my-3 border-t border-gray-100" />}
                {viewingItem.remarks && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</div>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{viewingItem.remarks}</p>
                  </div>
                )}
              </div>
            )}

            {/* Transaction History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FiActivity size={16} className="text-indigo-500" />
                  Transaction History
                </h4>
                {itemTransactions.length > 0 && (
                  <span className="text-xs font-medium text-gray-400">
                    {itemTransactions.length} record{itemTransactions.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {transactionsLoading ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : itemTransactions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
                  <FiActivity className="mx-auto text-gray-300" size={28} />
                  <p className="mt-2 text-sm font-medium text-gray-400">
                    No transactions recorded yet
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600">
                          Type
                        </th>
                        <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-600">
                          Quantity
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600">
                          Remarks
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {itemTransactions.map((transaction, idx) => {
                        const config =
                          TRANSACTION_TYPE_CONFIG[transaction.transactionType] ||
                          TRANSACTION_TYPE_CONFIG.MANUAL_ADD
                        const Icon = config.icon
                        return (
                          <tr key={transaction.id || idx} className="hover:bg-gray-50 transition-colors">
                            <td className="whitespace-nowrap px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${config.bgColor} ${config.color}`}
                                style={{ borderColor: 'transparent' }}
                              >
                                <Icon size={13} />
                                {config.label}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-center">
                              <span className="text-sm font-bold text-gray-900">
                                {transaction.quantity}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">{viewingItem.unit}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px]">
                              {transaction.remarks ? (
                                <Tooltip title={transaction.remarks} placement="topLeft">
                                  <span className="line-clamp-1 cursor-default">{transaction.remarks}</span>
                                </Tooltip>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                              {moment(transaction.createdAt).format("MMM DD, YYYY HH:mm")}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setViewModalOpen(false)
                  setViewingItem(null)
                  setItemTransactions([])
                }}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Close
              </button>
              {canEdit && (
                <button
                  onClick={() => {
                    setViewModalOpen(false)
                    openEditModal(viewingItem)
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FiEdit2 size={15} />
                  Edit Item
                </button>
              )}
              <button
                onClick={() => {
                  setViewModalOpen(false)
                  openAdjustModal(viewingItem)
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                <FiActivity size={15} />
                Adjust Quantity
              </button>
            </div>
          </div>
        )}
      </Modal>
    </ParentLayout>
  )
}

export { Inventory }
