/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal, Form, Select, Button, Progress, Tooltip } from "antd"
import type { Project } from "../../pages/projects/types"
import { ProjectTaskTable } from "./ProjectTaskTable"
import { useEffect, useMemo, useState, useContext } from "react"
import { Request } from "../../utils/Request"
import { toast } from "react-hot-toast"
import { AuthContext } from "../../context/AuthContext"
import { isAdminRole } from "../../utils/projects"
import {
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiMoreVertical,
  FiClock,
  FiUserPlus,
  FiUserMinus,
} from "react-icons/fi"
import { BiRupee } from "react-icons/bi"
import moment from "moment"

interface ProjectCardProps {
  project: Project
  getProjects: () => void
  viewMode?: "grid" | "list"
}

const STATUS_META: Record<string, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: "Active", color: "text-emerald-700", bgColor: "bg-emerald-50" },
  INPROGRESS: { label: "In Progress", color: "text-blue-700", bgColor: "bg-blue-50" },
  NOTSTARTED: { label: "Not Started", color: "text-gray-600", bgColor: "bg-gray-100" },
  PAUSED: { label: "Paused", color: "text-amber-700", bgColor: "bg-amber-50" },
  COMPLETED: { label: "Completed", color: "text-blue-700", bgColor: "bg-blue-50" },
  ACTIONREQUIRED: { label: "Action Required", color: "text-red-700", bgColor: "bg-red-50" },
  ONHOLD: { label: "On Hold", color: "text-amber-700", bgColor: "bg-amber-50" },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bgColor: "bg-red-50" },
}

const STATUS_OPTIONS = [
  { label: "Not Started", value: "NOTSTARTED", color: "text-gray-600", dot: "bg-gray-400" },
  { label: "In Progress", value: "INPROGRESS", color: "text-blue-600", dot: "bg-blue-500" },
  { label: "Paused", value: "PAUSED", color: "text-amber-600", dot: "bg-amber-500" },
  { label: "Completed", value: "COMPLETED", color: "text-emerald-600", dot: "bg-emerald-500" },
  { label: "Action Required", value: "ACTIONREQUIRED", color: "text-red-600", dot: "bg-red-500" },
  { label: "On Hold", value: "ONHOLD", color: "text-amber-600", dot: "bg-amber-500" },
  { label: "Cancelled", value: "CANCELLED", color: "text-red-600", dot: "bg-red-500" },
]

const formatDate = (date?: string | null) =>
  date ? moment(date).format("MMM DD, YYYY") : "Not set"

const formatCurrency = (value?: number) =>
  value
    ? Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
    : "—"

export const ProjectCard = ({
  project,
  getProjects,
  viewMode = "list",
}: ProjectCardProps) => {
  const { user } = useContext(AuthContext) as any
  const isAdmin = isAdminRole(user)
  const [projectState, setProjectState] = useState<any>(project)
  const [showTasks, setShowTasks] = useState<boolean>(false)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  const [unassignLoading, setUnassignLoading] = useState(false)
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamOptions, setTeamOptions] = useState<any[]>([])
  const [teamForm] = Form.useForm()
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [statusBulkLoading, setStatusBulkLoading] = useState(false)
  const [priorityBulkLoading, setPriorityBulkLoading] = useState(false)
  const [statusActionValue, setStatusActionValue] = useState<string | undefined>(undefined)
  const [priorityActionValue, setPriorityActionValue] = useState<string | undefined>(undefined)
  const [showActions, setShowActions] = useState(false)

  const statusKey = projectState?.status?.toUpperCase?.() ?? "ACTIVE"
  const status = STATUS_META[statusKey] ?? STATUS_META.ACTIVE

  // Calculate task stats from loaded tasks or fallback to project data
  const taskStats = useMemo(() => {
    if (tasks.length > 0) {
      const total = tasks.length
      const completed = tasks.filter((t) => t.status?.toUpperCase() === "COMPLETED").length
      const inProgress = tasks.filter((t) => t.status?.toUpperCase() === "INPROGRESS").length
      const notStarted = tasks.filter((t) => t.status?.toUpperCase() === "NOTSTARTED").length
      const onHold = tasks.filter((t) => t.status?.toUpperCase() === "ONHOLD" || t.status?.toUpperCase() === "PAUSED").length
      const actionRequired = tasks.filter((t) => t.status?.toUpperCase() === "ACTIONREQUIRED").length
      const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

      return {
        total,
        completed,
        inProgress,
        notStarted,
        onHold,
        actionRequired,
        progress: progressPercent,
      }
    }

    // Fallback to project state data
    return {
      total: projectState?.totalTasks ?? 0,
      completed: projectState?.completedTasks ?? 0,
      inProgress: 0,
      notStarted: 0,
      onHold: 0,
      actionRequired: 0,
      progress: Math.round(projectState?.completedTasks / projectState?.totalTasks * 100)
    }
  }, [tasks, projectState?.totalTasks, projectState?.completedTasks])

  useEffect(() => {
    setProjectState(project)
  }, [project])

  const getTasks = async (projectId: string) => {
    setLoading(true)
    try {
      const res = await Request.get(`/v1/api/tasks/project/${projectId}`)
      setTasks(res.data)
    } catch (error) {
      console.log(error)
      toast.error("Failed to get tasks", { duration: 2000 })
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    setTeamLoading(true)
    try {
      const res = await Request.get("/v1/api/teams/all")
      setTeamOptions(res.data ?? [])
    } catch (error) {
      console.log(error)
      toast.error("Failed to load teams")
    } finally {
      setTeamLoading(false)
    }
  }

  useEffect(() => {
    if (assignModalOpen && teamOptions.length === 0) {
      void fetchTeams()
    }
    if (assignModalOpen) {
      const defaultTeamId = projectState?.team?.id ?? projectState?.teamId
      if (defaultTeamId) {
        teamForm.setFieldsValue({ teamId: defaultTeamId })
      } else {
        teamForm.resetFields()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignModalOpen])

  const handleStatusChange = async (newStatus: string) => {
    if (!projectState?.id) return
    setStatusLoading(true)
    try {
      await Request.put(`/v1/api/projects/${projectState.id}`, { status: newStatus })
      setProjectState((prev: any) => ({ ...prev, status: newStatus }))
      toast.success(`Status changed to ${STATUS_META[newStatus]?.label || newStatus}`)
    } catch (error) {
      console.log(error)
      toast.error("Failed to update project status")
    } finally {
      setStatusLoading(false)
      setShowActions(false)
    }
  }

  const handleAssignTeam = async () => {
    try {
      const { teamId } = await teamForm.validateFields()
      setAssignLoading(true)
      await Request.put(`/v1/api/projects/${projectState.id}`, { teamId })
      const selectedTeam = teamOptions.find((team) => team.id === teamId)
      setProjectState((prev: any) => ({
        ...prev,
        team: selectedTeam ?? prev?.team ?? { id: teamId, name: "Assigned Team" },
        teamId,
      }))
      toast.success("Team assigned successfully")
      setAssignModalOpen(false)
    } catch (error) {
      if ((error as any)?.errorFields) return
      console.log(error)
      toast.error(
        (error as any)?.response?.data?.message || "Failed to assign team"
      )
    } finally {
      setAssignLoading(false)
    }
  }

  const handleUnassignTeam = async () => {
    if (!projectState?.team && !projectState?.teamId) return
    setUnassignLoading(true)
    try {
      await Request.put(`/v1/api/projects/${projectState.id}`, { teamId: null })
      setProjectState((prev: any) => ({
        ...prev,
        team: undefined,
        teamId: undefined,
      }))
      toast.success("Team unassigned successfully")
    } catch (error) {
      console.log(error)
      toast.error(
        (error as any)?.response?.data?.message || "Failed to unassign team"
      )
    } finally {
      setUnassignLoading(false)
    }
  }

  const hasTeamAssigned = useMemo(
    () => Boolean(projectState?.team?.id ?? projectState?.teamId),
    [projectState?.team?.id, projectState?.teamId]
  )

  const updateTaskState = (taskIds: string[], updater: (task: any) => any) => {
    setTasks((prev) =>
      prev.map((task) => {
        const currentId = String(task.id ?? task.taskId ?? task.key ?? "")
        if (taskIds.includes(currentId)) {
          return updater(task)
        }
        return task
      })
    )
  }

  const handleBulkTaskStatusChange = async (newStatus: string) => {
    if (selectedTaskIds.length === 0) {
      toast.error("Select at least one task to update status")
      return
    }
    setStatusBulkLoading(true)
    try {
      await Promise.all(
        selectedTaskIds.map((taskId) =>
          Request.put(`/v1/api/tasks/${taskId}`, { status: newStatus })
        )
      )
      updateTaskState(selectedTaskIds, (task) => ({ ...task, status: newStatus }))
      getProjects()
      toast.success("Task status updated")
      setSelectedTaskIds([])
    } catch (error) {
      console.log(error)
      toast.error("Failed to update task status")
    } finally {
      setStatusBulkLoading(false)
    }
  }

  const handleBulkTaskPriorityChange = async (priority: string) => {
    if (selectedTaskIds.length === 0) {
      toast.error("Select at least one task to update priority")
      return
    }
    setPriorityBulkLoading(true)
    try {
      await Promise.all(
        selectedTaskIds.map((taskId) =>
          Request.put(`/v1/api/tasks/${taskId}`, { priority })
        )
      )
      updateTaskState(selectedTaskIds, (task) => ({ ...task, priority }))
      toast.success("Task priority updated")
      getProjects()
      setSelectedTaskIds([])
    } catch (error) {
      console.log(error)
      toast.error("Failed to update task priority")
    } finally {
      setPriorityBulkLoading(false)
    }
  }

  const handleToggleTasks = async () => {
    if (!showTasks) {
      await getTasks(projectState.id)
    } else {
      setTasks([])
    }
    setShowTasks(!showTasks)
  }

  // Grid view card
  if (viewMode === "grid") {
    return (
      <>
        <article className="group flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold text-gray-900">
                  {projectState?.name}
                </h3>
              </div>
              <span
                className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bgColor} ${status.color}`}
              >
                {status.label}
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <FiMoreVertical size={16} />
              </button>
              {showActions && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActions(false)}
                  />
                  {/* Menu */}
                  <div className="absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                    {/* Header */}
                    <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Project Actions
                      </p>
                    </div>

                    {/* Team Actions */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setAssignModalOpen(true)
                          setShowActions(false)
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                          <FiUserPlus size={16} className="text-indigo-600" />
                        </div>
                        <div>
                          <span>{hasTeamAssigned ? "Change Team" : "Assign Team"}</span>
                          <p className="text-xs font-normal text-gray-400">Manage team assignment</p>
                        </div>
                      </button>

                      {hasTeamAssigned && (
                        <button
                          onClick={() => {
                            handleUnassignTeam()
                            setShowActions(false)
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-700"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                            <FiUserMinus size={16} className="text-red-600" />
                          </div>
                          <div>
                            <span>Unassign Team</span>
                            <p className="text-xs font-normal text-gray-400">Remove current team</p>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100" />

                    {/* Status Section */}
                    <div className="p-2">
                      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Update Status
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {STATUS_OPTIONS.map((opt) => {
                          const isActive = opt.value === statusKey
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleStatusChange(opt.value)}
                              disabled={statusLoading || isActive}
                              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-all ${isActive
                                  ? "bg-gray-100 text-gray-400 ring-1 ring-inset ring-gray-200"
                                  : `text-gray-600 hover:bg-gray-50 ${opt.color}`
                                }`}
                            >
                              <span className={`h-2 w-2 rounded-full ${isActive ? "bg-gray-300" : opt.dot}`} />
                              <span className="truncate">{opt.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-gray-500">Progress</span>
              <span className="font-semibold text-gray-700">{taskStats.progress}%</span>
            </div>
            <Progress
              percent={projectState?.progress}
              showInfo={false}
              strokeColor={taskStats.progress < 30 ? "#ef4444" : taskStats.progress < 70 ? "#f59e0b" : "#22c55e"}
              trailColor="#e5e7eb"
              size="small"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {taskStats.completed} done
              </span>
              {projectState?.totalTasks - projectState?.completedTasks > 0 && (
                <span className="flex items-center gap-1 text-blue-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {projectState?.totalTasks - projectState?.completedTasks} active
                </span>
              )}
              {projectState?.totalTasks - projectState?.completedTasks - (projectState?.totalTasks - projectState?.completedTasks) > 0 && (
                <span className="flex items-center gap-1 text-gray-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  {projectState?.totalTasks - projectState?.completedTasks - (projectState?.totalTasks - projectState?.completedTasks)} pending
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="mt-auto border-t border-gray-100 p-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-500">
                <FiUser size={12} />
                <span className="truncate">{projectState?.manager?.name ?? "Unassigned"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <FiUsers size={12} />
                <span className="truncate">{projectState?.team?.name ?? "No team"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <FiCalendar size={12} />
                <span>{formatDate(projectState?.endDate)}</span>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 text-gray-500">
                  <BiRupee size={12} />
                  <span>{formatCurrency(projectState?.budget)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 p-3">
            <button
              onClick={handleToggleTasks}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-50 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              {showTasks ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              {showTasks ? "Hide Tasks" : "View Tasks"}
            </button>
          </div>

          {showTasks && (
            <div className="border-t border-gray-100 p-4">
              <ProjectTaskTable tasks={tasks} loading={loading} />
            </div>
          )}
        </article>

        {/* Team Assignment Modal */}
        <Modal
          title="Assign Team"
          open={assignModalOpen}
          onCancel={() => setAssignModalOpen(false)}
          onOk={handleAssignTeam}
          okText="Assign"
          confirmLoading={assignLoading}
        >
          <Form form={teamForm} layout="vertical">
            <Form.Item
              name="teamId"
              label="Select team"
              rules={[{ required: true, message: "Please select a team" }]}
            >
              <Select
                loading={teamLoading}
                placeholder="Choose a team"
                options={teamOptions.map((team) => ({
                  label: team.name,
                  value: team.id,
                }))}
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string).toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Form>
          {hasTeamAssigned && (
            <Button
              danger
              type="link"
              onClick={handleUnassignTeam}
              loading={unassignLoading}
              className="px-0"
            >
              Unassign current team
            </Button>
          )}
        </Modal>
      </>
    )
  }

  // List view card (default)
  return (
    <article className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600">
            {projectState?.name?.slice(0, 2)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{projectState?.name}</h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bgColor} ${status.color}`}
              >
                {status.label}
              </span>
            </div>
            {projectState?.description && (
              <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-gray-500">
                {projectState.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 p-1.5">
            <span className={`ml-2 h-2 w-2 rounded-full ${STATUS_OPTIONS.find(s => s.value === statusKey)?.dot || 'bg-gray-400'}`} />
            <Select
              value={statusKey}
              onChange={handleStatusChange}
              loading={statusLoading}
              options={STATUS_OPTIONS.map(opt => ({
                label: (
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                    <span>{opt.label}</span>
                  </div>
                ),
                value: opt.value,
              }))}
              className="status-select"
              variant="borderless"
              size="small"
              // popupClassName="status-dropdown"
              classNames={{
                popup: {
                  root: 'status-dropdown'
                }
              }}
              // dropdownStyle={{ minWidth: 160 }}
              styles={{
                popup: {
                  root: {
                    minWidth: 160,
                  }
                }
              }}
            />
          </div>

          {/* Team Actions */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-white">
            <button
              onClick={() => setAssignModalOpen(true)}
              disabled={assignLoading || unassignLoading}
              className="inline-flex items-center gap-2 rounded-l-xl px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100">
                <FiUserPlus size={12} className="text-indigo-600" />
              </div>
              {hasTeamAssigned ? "Change Team" : "Assign Team"}
            </button>
            {hasTeamAssigned && (
              <>
                <div className="h-8 w-px bg-gray-200" />
                <button
                  onClick={handleUnassignTeam}
                  disabled={unassignLoading}
                  className="inline-flex items-center gap-2 rounded-r-xl px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-100">
                    <FiUserMinus size={12} className="text-red-500" />
                  </div>
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        {/* Custom styles for Select */}
        <style>{`
          .status-select .ant-select-selector {
            padding: 0 8px !important;
            height: 28px !important;
            background: transparent !important;
          }
          .status-select .ant-select-selection-item {
            font-size: 13px;
            font-weight: 500;
            line-height: 28px !important;
          }
          .status-dropdown .ant-select-item {
            padding: 8px 12px;
            border-radius: 8px;
            margin: 2px 4px;
          }
          .status-dropdown .ant-select-item-option-selected {
            background: #f1f5f9 !important;
          }
        `}</style>
      </div>

      {/* Data Grid */}
      <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <DataItem
            icon={<FiUser size={16} />}
            label="Manager"
            value={projectState?.manager?.name ?? "Unassigned"}
          />
          <DataItem
            icon={<FiUsers size={16} />}
            label="Team"
            value={
              projectState?.team?.name
                ? `${projectState.team.name}${projectState?.team?.TeamPeoples?.length
                  ? ` (${projectState.team.TeamPeoples.length})`
                  : ""
                }`
                : "Not assigned"
            }
          />
          <DataItem
            icon={<FiCalendar size={16} />}
            label="Start Date"
            value={formatDate(projectState?.startDate)}
          />
          <DataItem
            icon={<FiClock size={16} />}
            label="End Date"
            value={formatDate(projectState?.endDate)}
          />
          {isAdmin && (
            <DataItem
              icon={<BiRupee size={16} />}
              label="Budget"
              value={formatCurrency(projectState?.budget)}
            />
          )}
          <DataItem
            icon={<FiMapPin size={16} />}
            label="Location"
            value={
              <Tooltip title={projectState?.location}>
                <span className="block max-w-[150px] truncate">
                  {projectState?.location ?? "Not provided"}
                </span>
              </Tooltip>
            }
          />
        </div>
      </div>

      {/* Progress Section */}
      <div className="border-t border-gray-100 px-5 py-4">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className={`text-lg font-bold ${taskStats.progress >= 70 ? 'text-emerald-600' : taskStats.progress >= 30 ? 'text-amber-600' : 'text-red-500'
              }`}>
              {taskStats.progress}%
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {taskStats.completed} / {taskStats.total} tasks done
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 mb-4">
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${taskStats.progress >= 70 ? 'bg-emerald-500' : taskStats.progress >= 30 ? 'bg-amber-500' : 'bg-red-500'
              }`}
            style={{ width: `${Math.max(taskStats.progress, 1)}%` }}
          />
        </div>

        {/* Status Pills & View Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {taskStats.completed > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {taskStats.completed} Done
              </span>
            )}
            {taskStats.inProgress > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {taskStats.inProgress} Active
              </span>
            )}
            {taskStats.notStarted > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                {taskStats.notStarted} Pending
              </span>
            )}
            {taskStats.onHold > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {taskStats.onHold} Hold
              </span>
            )}
            {taskStats.actionRequired > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {taskStats.actionRequired} Urgent
              </span>
            )}
          </div>

          <button
            onClick={handleToggleTasks}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${showTasks
                ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800'
                : 'bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300'
              }`}
          >
            {showTasks ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            {showTasks ? 'Hide' : 'View'} Tasks
            {!showTasks && (
              <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${showTasks ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
                }`}>
                {taskStats.total}
              </span>
            )}
          </button>
        </div>

        {projectState?.hasUnapproved && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-medium text-amber-800">{projectState?.unapprovedCount} tasks need approval</span>
          </div>
        )}
      </div>

      {/* Tasks Section - Expandable */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${showTasks ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="border-t border-gray-200 p-6">
          <ProjectTaskTable
            tasks={tasks}
            loading={loading}
            actions={
              <div className="flex flex-wrap items-center gap-3">
                {/* Selection Info */}
                {selectedTaskIds.length > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">
                      {selectedTaskIds.length}
                    </span>
                    <span className="text-sm font-medium text-indigo-700">selected</span>
                  </div>
                )}

                {/* Bulk Actions */}
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                  <Select
                    placeholder={
                      <span className="flex items-center gap-2 text-gray-500">
                        <FiClock size={14} />
                        Status
                      </span>
                    }
                    size="small"
                    className="bulk-action-select"
                    style={{ minWidth: 130 }}
                    variant="borderless"
                    disabled={statusBulkLoading || priorityBulkLoading || selectedTaskIds.length === 0}
                    value={statusActionValue}
                    onChange={async (value: string) => {
                      setStatusActionValue(value)
                      await handleBulkTaskStatusChange(value)
                      setStatusActionValue(undefined)
                    }}
                    options={[
                      { label: <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gray-400" />Not Started</span>, value: "NOTSTARTED" },
                      { label: <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" />In Progress</span>, value: "INPROGRESS" },
                      { label: <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Completed</span>, value: "COMPLETED" },
                      { label: <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" />Action Required</span>, value: "ACTIONREQUIRED" },
                      { label: <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" />On Hold</span>, value: "ONHOLD" },
                    ]}
                    loading={statusBulkLoading}
                    allowClear
                    onClear={() => setStatusActionValue(undefined)}
                  />

                  <div className="h-6 w-px bg-gray-200" />

                  <Select
                    placeholder={
                      <span className="flex items-center gap-2 text-gray-500">
                        <FiChevronUp size={14} />
                        Priority
                      </span>
                    }
                    size="small"
                    className="bulk-action-select"
                    style={{ minWidth: 120 }}
                    variant="borderless"
                    disabled={statusBulkLoading || priorityBulkLoading || selectedTaskIds.length === 0}
                    value={priorityActionValue}
                    onChange={async (value: string) => {
                      setPriorityActionValue(value)
                      await handleBulkTaskPriorityChange(value)
                      setPriorityActionValue(undefined)
                    }}
                    options={[
                      { label: <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" />High</span>, value: "HIGH" },
                      { label: <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" />Medium</span>, value: "MEDIUM" },
                      { label: <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Low</span>, value: "LOW" },
                    ]}
                    loading={priorityBulkLoading}
                    allowClear
                    onClear={() => setPriorityActionValue(undefined)}
                  />
                </div>

                {/* Help text when nothing selected */}
                {selectedTaskIds.length === 0 && (
                  <span className="text-xs text-gray-400">Select tasks to apply bulk actions</span>
                )}
              </div>
            }
            selectedTaskIds={selectedTaskIds}
            onSelectionChange={(ids) => setSelectedTaskIds(ids.map((id) => String(id)))}
          />
        </div>
      </div>

      {/* Team Assignment Modal */}
      <Modal
        title="Assign Team"
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        onOk={handleAssignTeam}
        okText="Assign"
        confirmLoading={assignLoading}
      >
        <Form form={teamForm} layout="vertical">
          <Form.Item
            name="teamId"
            label="Select team"
            rules={[{ required: true, message: "Please select a team" }]}
          >
            <Select
              loading={teamLoading}
              placeholder="Choose a team"
              options={teamOptions.map((team) => ({
                label: team.name,
                value: team.id,
              }))}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
        {hasTeamAssigned && (
          <Button
            danger
            type="link"
            onClick={handleUnassignTeam}
            loading={unassignLoading}
            className="px-0"
          >
            Unassign current team
          </Button>
        )}
      </Modal>
    </article>
  )
}

// Helper component for data items
const DataItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) => (
  <div className="flex items-center gap-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-400">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="truncate text-sm font-medium text-gray-800">{value}</p>
    </div>
  </div>
)
