/* eslint-disable @typescript-eslint/no-explicit-any */
import { Skeleton, Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import type { ProjectTask } from "../../pages/projects/types"
import moment from "moment"
import { FiUser, FiCalendar, FiFlag } from "react-icons/fi"

interface ProjectTaskTableProps {
  tasks: ProjectTask[]
  loading?: boolean
  actions?: React.ReactNode
  selectedTaskIds?: string[]
  onSelectionChange?: (taskIds: string[]) => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  INPROGRESS: { label: "In Progress", color: "blue", bgColor: "bg-blue-50" },
  COMPLETED: { label: "Completed", color: "green", bgColor: "bg-emerald-50" },
  ACTIONREQUIRED: { label: "Action Required", color: "red", bgColor: "bg-red-50" },
  ONHOLD: { label: "On Hold", color: "orange", bgColor: "bg-amber-50" },
  NOTSTARTED: { label: "Not Started", color: "default", bgColor: "bg-gray-100" },
  PENDING: { label: "Pending", color: "orange", bgColor: "bg-amber-50" },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  HIGH: { label: "High", color: "red" },
  MEDIUM: { label: "Medium", color: "orange" },
  LOW: { label: "Low", color: "green" },
}

const getTaskId = (record: ProjectTask | any): string =>
  (record as any)?.id ??
  (record as any)?.taskId ??
  (record as any)?.key ??
  (record as any)?.name ??
  (record as any)?.task ??
  ""

export const ProjectTaskTable = ({
  tasks,
  loading,
  actions,
  selectedTaskIds,
  onSelectionChange,
}: ProjectTaskTableProps) => {
  const columns: ColumnsType<ProjectTask> = [
    {
      title: "Task Name",
      dataIndex: "name",
      key: "task",
      width: "30%",
      render: (name: string, record: any) => (
        <div className="py-1">
          <p className="font-medium text-gray-900">{name}</p>
          {record?.description && (
            <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{record.description}</p>
          )}
        </div>
      ),
    },
    {
      title: "Assigned To",
      key: "assignedTo",
      width: "18%",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
            <FiUser size={14} className="text-gray-500" />
          </div>
          <span className="text-sm text-gray-700">
            {item?.assignedTo?.name || "Unassigned"}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "15%",
      render: (status: string) => {
        const config = STATUS_CONFIG[status?.toUpperCase()] || STATUS_CONFIG.NOTSTARTED
        return (
          <Tag
            color={config.color}
            className="rounded-full px-3 py-0.5 text-xs font-medium"
          >
            {config.label}
          </Tag>
        )
      },
    },
    {
      title: "Due Date",
      key: "dueDate",
      width: "15%",
      render: (item: any) => {
        const dueDate = item?.dueDate
        const isOverdue = dueDate && moment(dueDate).isBefore(moment(), "day") && item?.status !== "COMPLETED"
        return (
          <div className={`flex items-center gap-2 ${isOverdue ? "text-red-600" : "text-gray-700"}`}>
            <FiCalendar size={14} className={isOverdue ? "text-red-500" : "text-gray-400"} />
            <span className="text-sm">
              {dueDate ? moment(dueDate).format("MMM D, YYYY") : "No date"}
            </span>
          </div>
        )
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: "12%",
      render: (priority: string) => {
        if (!priority) return <span className="text-sm text-gray-400">—</span>
        const config = PRIORITY_CONFIG[priority?.toUpperCase()] || { label: priority, color: "default" }
        return (
          <Tag
            color={config.color}
            className="rounded-full px-3 py-0.5 text-xs font-medium"
          >
            {config.label}
          </Tag>
        )
      },
    },
  ]

  const rowSelection = onSelectionChange
    ? {
        selectedRowKeys: (selectedTaskIds ?? []).map((id) => String(id)),
        onChange: (keys: React.Key[]) => onSelectionChange(keys.map((key) => String(key))),
      }
    : undefined

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-800">Task List</h2>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>
        {actions}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
              <Skeleton.Avatar active size={32} />
              <div className="flex-1">
                <Skeleton.Input active className="h-5! w-48! mb-2" />
                <Skeleton.Input active className="h-4! w-32!" size="small" />
              </div>
              <Skeleton.Button active className="h-6! w-20!" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
          <FiFlag className="mx-auto mb-3 text-gray-300" size={32} />
          <p className="text-sm font-medium text-gray-500">No tasks yet</p>
          <p className="mt-1 text-xs text-gray-400">Tasks will appear here once created</p>
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={tasks}
          pagination={tasks.length > 10 ? { pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} tasks` } : false}
          size="middle"
          className="project-task-table"
          rowKey={(record) => getTaskId(record)}
          rowSelection={rowSelection}
          rowClassName="hover:bg-gray-50/80"
          scroll={{ x: 700 }}
        />
      )}

      <style>{`
        .project-task-table .ant-table-thead > tr > th {
          background: #f9fafb;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .project-task-table .ant-table-tbody > tr > td {
          padding: 14px 16px;
          border-bottom: 1px solid #f3f4f6;
        }
        .project-task-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none;
        }
        .project-task-table .ant-table-selection-column {
          padding-left: 16px !important;
        }
      `}</style>
    </div>
  )
}
