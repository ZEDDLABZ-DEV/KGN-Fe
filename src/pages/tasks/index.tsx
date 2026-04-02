
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useContext, useEffect, useState } from "react"
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Skeleton,
  Empty
} from "antd"
import { toast } from "react-hot-toast"
import { ParentLayout } from "../../layout/ParentLayout"
import { Request } from "../../utils/Request"
import { AuthContext } from "../../context/AuthContext"
import moment from "moment"
import {
  FiPlus,
  FiSearch,
  FiCalendar,
  FiUser,
  FiFolder,
  FiCheckCircle,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiUserPlus,
  FiMapPin,
  FiUsers,
} from "react-icons/fi"
import { GoTasklist } from "react-icons/go"
import { BiRupee } from "react-icons/bi"

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  NOTSTARTED: { label: "Not Started", color: "text-gray-600", bgColor: "bg-gray-100", dotColor: "bg-gray-400" },
  INPROGRESS: { label: "In Progress", color: "text-blue-700", bgColor: "bg-blue-50", dotColor: "bg-blue-500" },
  COMPLETED: { label: "Completed", color: "text-emerald-700", bgColor: "bg-emerald-50", dotColor: "bg-emerald-500" },
  ACTIONREQUIRED: { label: "Action Required", color: "text-red-700", bgColor: "bg-red-50", dotColor: "bg-red-500" },
  ONHOLD: { label: "On Hold", color: "text-amber-700", bgColor: "bg-amber-50", dotColor: "bg-amber-500" },
  PENDING: { label: "Pending", color: "text-amber-700", bgColor: "bg-amber-50", dotColor: "bg-amber-500" },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  HIGH: { label: "High", color: "text-red-700", bgColor: "bg-red-50", dotColor: "bg-red-500" },
  MEDIUM: { label: "Medium", color: "text-amber-700", bgColor: "bg-amber-50", dotColor: "bg-amber-500" },
  LOW: { label: "Low", color: "text-emerald-700", bgColor: "bg-emerald-50", dotColor: "bg-emerald-500" },
}

const STATUS_OPTIONS = [
  { label: "Not Started", value: "NOTSTARTED", dot: "bg-gray-400" },
  { label: "In Progress", value: "INPROGRESS", dot: "bg-blue-500" },
  { label: "Completed", value: "COMPLETED", dot: "bg-emerald-500" },
  { label: "Action Required", value: "ACTIONREQUIRED", dot: "bg-red-500" },
  { label: "On Hold", value: "ONHOLD", dot: "bg-amber-500" },
]

const PRIORITY_OPTIONS = [
  { label: "High", value: "HIGH", dot: "bg-red-500" },
  { label: "Medium", value: "MEDIUM", dot: "bg-amber-500" },
  { label: "Low", value: "LOW", dot: "bg-emerald-500" },
]

interface Task {
  id: string
  name: string
  description?: string
  status: string
  priority?: string
  dueDate?: string
  createdAt?: string
  project?: { id: string; name: string }
  /** Team members (labours) assigned to this task */
  assignedTo?: { id: string; name: string; email?: string }[]
}

interface Project {
  id: string
  name: string
  description?: string
  status?: string
  budget?: number
  location?: string
  startDate?: string
  endDate?: string
  totalTasks?: number
  completedTasks?: number
  progress?: number
  team?: { id: string; name: string; TeamPeoples?: any[] }
  manager?: { id: string; name: string }
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const { permissions = [] } = useContext(AuthContext) as any
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [form] = Form.useForm()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [teamMembersLoading, setTeamMembersLoading] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")

  // Task actions
  const [actionMenuTask, setActionMenuTask] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editForm] = Form.useForm()

  // Assign modal
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assigningTask, setAssigningTask] = useState<Task | null>(null)
  const [assignLoading, setAssignLoading] = useState(false)

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false)
    form.resetFields()
  }

  const normalizeAssignedToIds = (raw: unknown): string[] => {
    if (Array.isArray(raw)) return [...new Set(raw.map(String).filter(Boolean))]
    if (raw != null && raw !== "") return [String(raw)]
    return []
  }

  const handleCreateTask = async (values: any) => {
    try {
      if (!permissions.find((p: any) => p.name === "create_tasks")) return
      if (!selectedProject) {
        toast.error("Please select a project first")
        return
      }
      const assignedToIds = normalizeAssignedToIds(values.assignedToIds)
      if (assignedToIds.length === 0) {
        toast.error("Select at least one team member")
        return
      }
      setCreateLoading(true)
      await Request.post("/v1/api/tasks", {
        name: values.name,
        description: values.description ?? "",
        projectId: selectedProject.id,
        dueDate: values.dueDate?.toISOString(),
        priority: values.priority,
        assignedToIds,
      })
      await getTasksByProject(selectedProject.id)
      handleCloseCreateModal()
      toast.success("Task created successfully")
    } catch (error) {
      console.log(error)
      toast.error("Failed to create task")
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

  const getTeamMembers = async (teamId: string) => {
    if (!teamId) {
      setTeamMembers([])
      return
    }
    setTeamMembersLoading(true)
    try {
      const response = await Request.get(`/v1/api/teams/members/${teamId}`)
      setTeamMembers(response.data || [])
    } catch (error) {
      console.log(error)
      setTeamMembers([])
    } finally {
      setTeamMembersLoading(false)
    }
  }

  const getTasksByProject = async (projectId: string) => {
    if (!projectId) return
    setLoading(true)
    try {
      const response = await Request.get(`/v1/api/tasks/project/${projectId}`)
      setTasks(response.data || [])
    } catch (error) {
      console.log(error)
      toast.error("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setSelectedProject(project)
      await getTasksByProject(projectId)
      if (project.team?.id) {
        await getTeamMembers(project.team.id)
      } else {
        setTeamMembers([])
      }
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      await Request.put(`/v1/api/tasks/${taskId}`, { status })
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))
      toast.success("Status updated")
    } catch (error) {
      console.log(error)
      toast.error("Failed to update status")
    }
  }

  const handleUpdateTaskPriority = async (taskId: string, priority: string) => {
    try {
      await Request.put(`/v1/api/tasks/${taskId}`, { priority })
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, priority } : t)))
      toast.success("Priority updated")
    } catch (error) {
      console.log(error)
      toast.error("Failed to update priority")
    }
  }

  const handleAssignTask = async (userId: string) => {
    if (!assigningTask) return
    setAssignLoading(true)
    try {
      await Request.put(`/v1/api/tasks/${assigningTask.id}`, { assignedToIds: [userId] })
      const assignedUser = teamMembers.find((u) => u.id === userId)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === assigningTask.id
            ? { ...t, assignedTo: assignedUser ? [{ id: userId, name: assignedUser.name }] : [] }
            : t
        )
      )
      toast.success("Task assigned successfully")
      setAssignModalOpen(false)
      setAssigningTask(null)
    } catch (error) {
      console.log(error)
      toast.error("Failed to assign task")
    } finally {
      setAssignLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await Request.delete(`/v1/api/tasks/${taskId}`)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      toast.success("Task deleted")
      setActionMenuTask(null)
    } catch (error) {
      console.log(error)
      toast.error("Failed to delete task")
    }
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    editForm.setFieldsValue({
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? moment(task.dueDate) : null,
      assignedToIds: (task.assignedTo ?? []).map((a) => a.id),
    })
    setEditModalOpen(true)
    setActionMenuTask(null)
  }

  const openAssignModal = (task: Task) => {
    setAssigningTask(task)
    setAssignModalOpen(true)
    setActionMenuTask(null)
  }

  const handleEditTask = async (values: any) => {
    if (!editingTask) return
    try {
      const ids = normalizeAssignedToIds(values.assignedToIds)
      await Request.put(`/v1/api/tasks/${editingTask.id}`, {
        name: values.name,
        description: values.description,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate?.toISOString(),
        assignedToIds: ids,
      })
      const nextAssigned = ids
        .map((id) => {
          const u = teamMembers.find((m) => m.id === id)
          return u ? { id: u.id, name: u.name } : null
        })
        .filter(Boolean) as { id: string; name: string }[]
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                ...values,
                dueDate: values.dueDate?.toISOString(),
                assignedTo: nextAssigned,
              }
            : t
        )
      )
      toast.success("Task updated")
      setEditModalOpen(false)
      setEditingTask(null)
      editForm.resetFields()
    } catch (error) {
      console.log(error)
      toast.error("Failed to update task")
    }
  }

  useEffect(() => {
    getProjects()
  }, [])

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const assigneeMatch = (task.assignedTo ?? []).some((a) =>
      a.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const matchesSearch =
      !searchTerm ||
      task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assigneeMatch

    const matchesStatus = !statusFilter || task.status?.toUpperCase() === statusFilter
    const matchesPriority = !priorityFilter || task.priority?.toUpperCase() === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const formatDate = (date?: string) => (date ? moment(date).format("MMM DD, YYYY") : "No date")
  const formatCurrency = (value?: number) =>
    value ? Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value) : "—"

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return moment(dueDate).isBefore(moment(), "day")
  }

  // Stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status?.toUpperCase() === "COMPLETED").length
  const inProgressTasks = tasks.filter((t) => t.status?.toUpperCase() === "INPROGRESS").length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const canCreateTasks = permissions.find((p: any) => p.name === "create_tasks")
  const canEditTasks = permissions.find((p: any) => p.name === "edit_tasks")
  const canDeleteTasks = permissions.find((p: any) => p.name === "delete_tasks")

  return (
    <ParentLayout title="Tasks">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50">
                <GoTasklist className="text-violet-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
                <p className="text-sm text-gray-500">Select a project to view and manage tasks</p>
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
              {selectedProject && canCreateTasks && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  <FiPlus size={18} />
                  New Task
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Project Info Card */}
        {selectedProject && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Compact Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600">
                  <FiFolder className="text-white" size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedProject.name}</h2>
                  {selectedProject.description && (
                    <p className="text-sm text-gray-500 line-clamp-1 max-w-md">{selectedProject.description}</p>
                  )}
                </div>
              </div>

              {/* Progress Ring */}
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-2 text-gray-500">
                    <FiUser size={14} />
                    {selectedProject.manager?.name || "No manager"}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-2 text-gray-500">
                    <FiUsers size={14} />
                    {selectedProject.team?.name || "No team"}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-2 text-gray-500">
                    <FiCalendar size={14} />
                    {formatDate(selectedProject.endDate)}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="relative h-14 w-14">
                    <svg className="h-14 w-14 -rotate-90 transform">
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="#e5e7eb"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke={progress >= 70 ? "#22c55e" : progress >= 30 ? "#f59e0b" : "#6b7280"}
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(progress / 100) * 150.8} 150.8`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
                      {progress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-gray-50">
              <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-sm">
                <span className="font-semibold text-gray-900">{totalTasks}</span>
                <span className="text-gray-500">total</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-700">{completedTasks}</span>
                <span className="text-emerald-600">completed</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-sm">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="font-semibold text-blue-700">{inProgressTasks}</span>
                <span className="text-blue-600">in progress</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-gray-100 border border-gray-200 px-3 py-1.5 text-sm">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                <span className="font-semibold text-gray-700">{totalTasks - completedTasks - inProgressTasks}</span>
                <span className="text-gray-500">pending</span>
              </span>

              {/* Additional Info - Mobile visible */}
              <div className="flex sm:hidden flex-wrap items-center gap-3 w-full mt-2 pt-3 border-t border-gray-200">
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <FiUser size={14} className="text-gray-400" />
                  {selectedProject.manager?.name || "No manager"}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <BiRupee size={14} className="text-gray-400" />
                  {formatCurrency(selectedProject.budget)}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <FiMapPin size={14} className="text-gray-400" />
                  {selectedProject.location || "No location"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {!selectedProject ? (
          <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-center">
                  <p className="text-gray-500">Select a project to view tasks</p>
                  <p className="text-sm text-gray-400 mt-1">Choose a project from the dropdown above</p>
                </div>
              }
            />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search tasks..."
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
                    label: (
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    ),
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
                    label: (
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                        {p.label}
                      </span>
                    ),
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

            {/* Task List */}
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <Skeleton active paragraph={{ rows: 5 }} />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={searchTerm || statusFilter || priorityFilter ? "No tasks match your filters" : "No tasks yet"}
                >
                  {canCreateTasks && !searchTerm && !statusFilter && !priorityFilter && (
                    <button
                      onClick={() => setCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    >
                      <FiPlus size={16} />
                      Create first task
                    </button>
                  )}
                </Empty>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Task Count Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Task Cards */}
                {filteredTasks.map((task) => {
                  const statusConfig = STATUS_CONFIG[task.status?.toUpperCase()] || STATUS_CONFIG.NOTSTARTED
                  const priorityConfig = task.priority ? PRIORITY_CONFIG[task.priority?.toUpperCase()] : null
                  const taskOverdue = task.status?.toUpperCase() !== "COMPLETED" && isOverdue(task.dueDate)
                  const isCompleted = task.status?.toUpperCase() === "COMPLETED"

                  return (
                    <div
                      key={task.id}
                      className={`rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${
                        isCompleted ? "border-emerald-200 bg-emerald-50/30" : taskOverdue ? "border-red-200" : "border-gray-200"
                      }`}
                    >
                      {/* Task Header */}
                      <div className="flex items-start gap-4 p-4">
                        {/* Status Checkbox */}
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, isCompleted ? "NOTSTARTED" : "COMPLETED")}
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            isCompleted
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
                          }`}
                        >
                          {isCompleted && <FiCheckCircle size={14} />}
                        </button>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-base font-semibold ${isCompleted ? "text-gray-500 line-through" : "text-gray-900"}`}>
                                {task.name}
                              </h3>
                              {task.description && (
                                <p className={`mt-1 text-sm leading-relaxed ${isCompleted ? "text-gray-400" : "text-gray-600"}`}>
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {/* Actions Menu */}
                            <div className="relative shrink-0">
                              <button
                                onClick={() => setActionMenuTask(actionMenuTask === task.id ? null : task.id)}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              >
                                <FiMoreVertical size={18} />
                              </button>
                              {actionMenuTask === task.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setActionMenuTask(null)} />
                                  <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                                    <button
                                      onClick={() => openAssignModal(task)}
                                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <FiUserPlus size={16} className="text-gray-400" />
                                      Assign Task
                                    </button>
                                    {canEditTasks && (
                                      <button
                                        onClick={() => openEditModal(task)}
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                      >
                                        <FiEdit2 size={16} className="text-gray-400" />
                                        Edit Task
                                      </button>
                                    )}
                                    {canDeleteTasks && (
                                      <>
                                        <div className="my-1 border-t border-gray-100" />
                                        <button
                                          onClick={() => handleDeleteTask(task.id)}
                                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                                        >
                                          <FiTrash2 size={16} />
                                          Delete Task
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Task Meta Info */}
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            {/* Assignees */}
                            {(task.assignedTo?.length ?? 0) > 0 ? (
                              <div className="flex flex-wrap items-center gap-2">
                                {(task.assignedTo ?? []).map((a) => (
                                  <div
                                    key={a.id}
                                    className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5"
                                  >
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-xs font-semibold text-white">
                                      {a.name?.slice(0, 1)?.toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{a.name}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() => openAssignModal(task)}
                                className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600"
                              >
                                <FiUserPlus size={14} />
                                Assign
                              </button>
                            )}

                            {/* Due Date */}
                            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                              taskOverdue ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                            }`}>
                              <FiCalendar size={14} />
                              <span className="text-sm font-medium">{formatDate(task.dueDate)}</span>
                              {taskOverdue && <span className="text-xs font-semibold">OVERDUE</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Task Footer - Status & Priority Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Status Dropdown */}
                          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-1 py-1">
                            <span className={`ml-2 h-2.5 w-2.5 rounded-full ${statusConfig.dotColor}`} />
                            <Select
                              value={task.status}
                              onChange={(value) => handleUpdateTaskStatus(task.id, value)}
                              size="small"
                              variant="borderless"
                              className="task-status-select"
                              style={{ minWidth: 110 }}
                              options={STATUS_OPTIONS.map((s) => ({
                                label: (
                                  <span className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                                    {s.label}
                                  </span>
                                ),
                                value: s.value,
                              }))}
                            />
                          </div>

                          {/* Priority Dropdown */}
                          <div className={`flex items-center gap-2 rounded-lg border bg-white px-1 py-1 ${
                            priorityConfig ? "border-gray-200" : "border-dashed border-gray-300"
                          }`}>
                            {priorityConfig && <span className={`ml-2 h-2.5 w-2.5 rounded-full ${priorityConfig.dotColor}`} />}
                            <Select
                              value={task.priority || undefined}
                              onChange={(value) => handleUpdateTaskPriority(task.id, value)}
                              size="small"
                              variant="borderless"
                              placeholder="Set priority"
                              className="task-priority-select"
                              style={{ minWidth: 100 }}
                              allowClear
                              options={PRIORITY_OPTIONS.map((p) => ({
                                label: (
                                  <span className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                                    {p.label}
                                  </span>
                                ),
                                value: p.value,
                              }))}
                            />
                          </div>
                        </div>

                        {/* Quick Complete Button */}
                        {!isCompleted && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, "COMPLETED")}
                            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                          >
                            <FiCheckCircle size={14} />
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal title="Create New Task" open={createModalOpen} onCancel={handleCloseCreateModal} footer={null} width={520}>
        <Form form={form} layout="vertical" onFinish={handleCreateTask} className="mt-4">
          <Form.Item label="Task Name" name="name" rules={[{ required: true, message: "Please enter task name" }]}>
            <Input placeholder="Enter task name" />
          </Form.Item>

          <Form.Item
            label="Assigned To"
            name="assignedToIds"
            rules={[
              { required: true, message: "Select at least one team member" },
              { type: "array", min: 1, message: "Select at least one team member" },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select team members"
              options={teamMembers.map((u) => ({ label: u.name, value: u.id }))}
              loading={teamMembersLoading}
              disabled={teamMembersLoading || teamMembers.length === 0}
              showSearch
              optionFilterProp="label"
              maxTagCount="responsive"
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Priority" name="priority">
              <Select placeholder="Select priority" options={PRIORITY_OPTIONS} allowClear />
            </Form.Item>
            <Form.Item label="Due Date" name="dueDate">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Please enter a description" }]}
          >
            <Input.TextArea rows={3} placeholder="Enter task description" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleCloseCreateModal} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={createLoading} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50">
              {createLoading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        title="Edit Task"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false)
          setEditingTask(null)
          editForm.resetFields()
        }}
        footer={null}
        width={520}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditTask} className="mt-4">
          <Form.Item label="Task Name" name="name" rules={[{ required: true, message: "Please enter task name" }]}>
            <Input placeholder="Enter task name" />
          </Form.Item>

          <Form.Item label="Assigned To" name="assignedToIds">
            <Select
              mode="multiple"
              placeholder="Select team members"
              options={teamMembers.map((u) => ({ label: u.name, value: u.id }))}
              loading={teamMembersLoading}
              showSearch
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              allowClear
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Status" name="status">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item label="Priority" name="priority">
              <Select placeholder="Select priority" options={PRIORITY_OPTIONS} allowClear />
            </Form.Item>
          </div>

          <Form.Item label="Due Date" name="dueDate">
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Enter task description" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false)
                setEditingTask(null)
                editForm.resetFields()
              }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800">
              Save Changes
            </button>
          </div>
        </Form>
      </Modal>

      {/* Assign Task Modal */}
      <Modal
        title="Assign Task"
        open={assignModalOpen}
        onCancel={() => {
          setAssignModalOpen(false)
          setAssigningTask(null)
        }}
        footer={null}
        width={400}
      >
        <div className="mt-4">
          {assigningTask && (
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-900">{assigningTask.name}</p>
              {assigningTask.description && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{assigningTask.description}</p>}
            </div>
          )}

          <p className="mb-3 text-sm text-gray-600">Select a team member to assign this task:</p>

          {teamMembers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center">
              <FiUsers className="mx-auto mb-2 text-gray-400" size={24} />
              <p className="text-sm text-gray-500">No team members available</p>
              <p className="text-xs text-gray-400">Assign a team to this project first</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleAssignTask(member.id)}
                  disabled={assignLoading}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-violet-300 hover:bg-violet-50 disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-600">
                    {member.name?.slice(0, 2)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    {member.email && <p className="text-xs text-gray-500">{member.email}</p>}
                  </div>
                  {assigningTask?.assignedTo?.some((a) => a.id === member.id) && (
                    <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">Current</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </ParentLayout>
  )
}

export { Tasks }
