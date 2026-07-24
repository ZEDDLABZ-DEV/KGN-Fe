/* eslint-disable @typescript-eslint/no-explicit-any */
import { Progress, Tag, Tooltip } from "antd"
import { useContext } from "react"
import { BiRupee } from "react-icons/bi"
import { FiCalendar, FiEye, FiEyeOff, FiMapPin, FiUser, FiUsers } from "react-icons/fi"
import { MdOutlinePlaylistAddCheck } from "react-icons/md"
import { TbChartArrows } from "react-icons/tb"
import { HiOutlineBadgeCheck } from "react-icons/hi"
import moment from "moment"
import { AuthContext } from "../../context/AuthContext"
import { isAdminRole } from "../../utils/projects"

interface ProjectSummaryProps {
  project: any
  onToggleTasks?: () => void
  showTasks: boolean
}

const formatDate = (date?: string | null) =>
  date ? moment(date).format("MMM DD, YYYY") : "Not set"

const formatCurrency = (value?: number) =>
   value ? Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(value)
    : "—"

const statusMap: Record<string, { text: string; tag: string }> = {
  ACTIVE: { text: "Active", tag: "green" },
  ACTIONREQUIRED: { text: "Pending Approvals", tag: "red" },
  COMPLETED: { text: "Completed", tag: "blue" },
  ONHOLD: { text: "On Hold", tag: "orange" },
  INPROGRESS: { text: "In Progress", tag: "blue" },
  PAUSED: { text: "Paused", tag: "orange" },
  NOTSTARTED: { text: "Not Started", tag: "default" },
  CANCELLED: { text: "Cancelled", tag: "red" },
}

const getStatusMeta = (status?: string) =>
  statusMap[status ?? ""] ?? {
    text: status ?? "Unknown",
    tag: "default",
  }

export const ProjectSummary = ({
  project,
  onToggleTasks,
  showTasks = false,
}: ProjectSummaryProps) => {
  const { user } = useContext(AuthContext) as any
  const isAdmin = isAdminRole(user)
  const status = getStatusMeta(project?.status)
  const totalTasks = project?.totalTasks ?? 0
  const completedTasks = project?.completedTasks ?? 0

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
      <div className="grid gap-y-8 text-sm text-gray-600 lg:grid-cols-3 lg:gap-10">
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Project details
          </div>
          <dl className="space-y-3">
            <div className="flex items-center gap-3">
              <FiUser className="mt-0.5 text-gray-400 text-xl" />
              <div>
                <dt className="text-xs uppercase text-gray-400">Manager</dt>
                <dd className="text-sm font-medium text-gray-800">
                  {project?.manager?.name ?? "Unassigned"}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiCalendar className="mt-0.5 text-gray-400 text-xl" />
              <div>
                <dt className="text-xs uppercase text-gray-400">Start Date</dt>
                <dd className="text-sm font-medium text-gray-800">
                  {formatDate(project?.startDate)}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiCalendar className="mt-0.5 rotate-180 text-gray-400 text-xl" />
              <div>
                <dt className="text-xs uppercase text-gray-400">End Date</dt>
                <dd className="text-sm font-medium text-gray-800">
                  {formatDate(project?.endDate)}
                </dd>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-3">
                <BiRupee className="mt-0.5 text-gray-400 text-xl" />
                <div>
                  <dt className="text-xs uppercase text-gray-400">Budget</dt>
                  <dd className="text-sm font-medium text-gray-800">
                    {formatCurrency(project?.budget)}
                  </dd>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div>
              <FiMapPin className="mt-0.5 text-gray-400 text-xl" />
                </div>
              <div>
                <dt className="text-xs uppercase text-gray-400">Location</dt>
                <dd className="text-sm font-medium text-gray-800">
                  <Tooltip title={project?.location}>
                    <span className="block max-w-xs truncate">
                      {project?.location ?? "Not provided"}
                    </span>
                  </Tooltip>
                </dd>
              </div>
            </div>
          </dl>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Task progress
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-gray-800">
                <MdOutlinePlaylistAddCheck className="text-xl text-gray-400" />
                Completed: {completedTasks} / {totalTasks} tasks
              </div>
              <button
                onClick={onToggleTasks}
                className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-blue-600 transition-colors hover:border-blue-200 hover:bg-blue-50"
              >
                {showTasks ? (
                  <>
                    <FiEyeOff /> Hide
                  </>
                ) : (
                  <>
                    <FiEye /> View
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <TbChartArrows className="text-gray-400 text-xl" />
              Progress: <span className="text-gray-700">{Math.round(project?.progress ?? 0)}%</span>
            </div>
            <Progress
              percent={Math.round(project?.progress ?? 0)}
              strokeColor={
                (project?.progress ?? 0) < 30
                  ? "#ef4444"
                  : (project?.progress ?? 0) < 70
                  ? "#f59e0b"
                  : "#22c55e"
              }
              trailColor="#e5e7eb"
              showInfo={false}
            />
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Team & Status
          </div>
          <dl className="space-y-3">
            <div className="flex items-center gap-3">
              <FiUsers className="mt-0.5 text-gray-400 text-xl" />
              <div>
                <dt className="text-xs uppercase text-gray-400">Team</dt>
                <dd className="text-sm font-medium text-gray-800">
                  {project?.team?.name ?? "Not assigned"}
                  {project?.team?.TeamPeoples?.length
                    ? ` (${project?.team?.TeamPeoples?.length} members)`
                    : ""}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HiOutlineBadgeCheck className="mt-px text-emerald-500 text-xl" />
              <div>
                <dt className="text-xs uppercase text-gray-400">Status</dt>
                <dd className="text-sm font-medium text-gray-800">
                  <Tag color={status.tag} className="rounded-full px-3 py-0.5 text-xs font-semibold">
                    {status.text}
                  </Tag>
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

