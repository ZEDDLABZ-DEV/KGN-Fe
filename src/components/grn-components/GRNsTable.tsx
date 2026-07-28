import type { ReactNode } from "react"
import { Empty, Popconfirm, Popover, Skeleton, Table, Tooltip } from "antd"
import moment from "moment"
import { FiEdit2, FiEye, FiPrinter, FiTrash2 } from "react-icons/fi"
import type { GRN } from "../../hooks/useGRN"
import { GRNStatusBadge } from "./GRNStatusBadge"
import { getTransitions, GRN_TRANSITIONS } from "../../utils/workflow"
import { StatusActionButtons } from "../status-actions/StatusActionButtons"

const formatDate = (date?: string) => (date ? moment(date).format("MMM DD, YYYY") : "—")

export interface GRNTableExtraColumn {
  title: string
  key: string
  render: (grn: GRN) => ReactNode
  width?: number
}

interface GRNsTableProps {
  grns: GRN[]
  loading?: boolean
  canManage: boolean
  updatingStatus?: { id: string; status: string } | null
  onTransition: (grn: GRN, status: string) => void
  onView: (grn: GRN) => void
  onEdit: (grn: GRN) => void
  onPrint: (grn: GRN) => void
  onDelete: (grn: GRN) => void
  extraColumns?: GRNTableExtraColumn[]
  pagination?: false | { pageSize: number }
  emptyDescription?: string
}

export const GRNsTable = ({
  grns,
  loading,
  canManage,
  updatingStatus,
  onTransition,
  onView,
  onEdit,
  onPrint,
  onDelete,
  extraColumns,
  pagination = false,
  emptyDescription = "No GRNs recorded yet",
}: GRNsTableProps) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    )
  }

  const columns = [
    {
      title: "GRN Number",
      dataIndex: "grnNumber",
      key: "grnNumber",
      render: (v: string, grn: GRN) => v || `GRN-${grn.id.slice(0, 8)}`,
    },
    ...(extraColumns || []).map((col) => ({
      title: col.title,
      key: col.key,
      width: col.width,
      render: (_: unknown, grn: GRN) => col.render(grn),
    })),
    {
      title: "Received Date",
      dataIndex: "receivedDate",
      key: "receivedDate",
      render: (v: string) => formatDate(v),
    },
    {
      title: "Received By",
      dataIndex: "receivedBy",
      key: "receivedBy",
      render: (v: string) => v || "—",
    },
    {
      title: "Status",
      key: "status",
      render: (_: unknown, grn: GRN) => {
        const transitions = canManage ? getTransitions(GRN_TRANSITIONS, grn.status?.toUpperCase()) : []
        if (transitions.length === 0) return <GRNStatusBadge status={grn.status} />
        return (
          <Popover
            trigger="click"
            placement="bottomLeft"
            content={
              <StatusActionButtons
                options={transitions}
                updatingStatus={updatingStatus?.id === grn.id ? updatingStatus.status : null}
                onTransition={(status) => onTransition(grn, status)}
                variant="link"
              />
            }
          >
            <button type="button" className="cursor-pointer">
              <GRNStatusBadge status={grn.status} />
            </button>
          </Popover>
        )
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: unknown, grn: GRN) => {
        const canEdit = grn.status === "PENDING"
        const canDelete = grn.status === "PENDING" || grn.status === "REJECTED"

        return (
          <div className="flex items-center gap-1">
            <Tooltip title="View">
              <button
                onClick={() => onView(grn)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <FiEye size={15} />
              </button>
            </Tooltip>
            <Tooltip title={canEdit ? "Edit" : "Only GRNs in Pending status can be edited"}>
              <button
                onClick={() => canEdit && onEdit(grn)}
                disabled={!canEdit}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <FiEdit2 size={15} />
              </button>
            </Tooltip>
            <Tooltip title="Print">
              <button
                onClick={() => onPrint(grn)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <FiPrinter size={15} />
              </button>
            </Tooltip>
            {canDelete ? (
              <Popconfirm
                title="Delete this GRN?"
                description="This action cannot be undone."
                okText="Delete"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
                onConfirm={() => onDelete(grn)}
              >
                <button className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
                  <FiTrash2 size={15} />
                </button>
              </Popconfirm>
            ) : (
              <Tooltip title="Only GRNs in Pending or Rejected status can be deleted">
                <button disabled className="rounded-lg p-1.5 text-gray-300 cursor-not-allowed">
                  <FiTrash2 size={15} />
                </button>
              </Tooltip>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <Table
      dataSource={grns}
      columns={columns}
      rowKey="id"
      pagination={pagination === false ? false : { pageSize: pagination.pageSize, showSizeChanger: false }}
      locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} /> }}
    />
  )
}
