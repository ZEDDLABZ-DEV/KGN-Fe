/* eslint-disable @typescript-eslint/no-explicit-any */
import { Avatar, Button, Dropdown, Tag, Typography } from "antd"
import { ExclamationCircleOutlined, UserSwitchOutlined, UserDeleteOutlined } from "@ant-design/icons"

const { Text, Title } = Typography

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "green" },
  INPROGRESS: { label: "In Progress", color: "blue" },
  NOTSTARTED: { label: "Not Started", color: "default" },
  PAUSED: { label: "Paused", color: "orange" },
  COMPLETED: { label: "Completed", color: "blue" },
  ACTIONREQUIRED: { label: "Action Required", color: "red" },
  ONHOLD: { label: "On Hold", color: "orange" },
  CANCELLED: { label: "Cancelled", color: "red" },
}

const STATUS_OPTIONS = [
  "NOTSTARTED",
  "INPROGRESS",
  "PAUSED",
  "COMPLETED",
  "ACTIONREQUIRED",
  "ONHOLD",
  "CANCELLED",
] as const

const statusLabels: Record<string, string> = {
  NOTSTARTED: "Not Started",
  INPROGRESS: "In Progress",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  ACTIONREQUIRED: "Action Required",
  ONHOLD: "On Hold",
  CANCELLED: "Cancelled",
}

interface ProjectCardHeaderProps {
  project: any
  onChangeStatus?: (status: string) => void
  statusLoading?: boolean
  onAssignTeam?: () => void
  onUnassignTeam?: () => void
  assignDisabled?: boolean
  unassignDisabled?: boolean
  assignLoading?: boolean
  unassignLoading?: boolean
}

export const ProjectCardHeader = ({
  project,
  onChangeStatus,
  statusLoading = false,
  onAssignTeam,
  onUnassignTeam,
  assignDisabled,
  unassignDisabled,
  assignLoading = false,
  unassignLoading = false,
}: ProjectCardHeaderProps) => {
  const statusKey = project?.status?.toUpperCase?.() ?? "ACTIVE"
  const status = STATUS_META[statusKey] ?? STATUS_META.ACTIVE

  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <Avatar size={48} className="bg-blue-500 uppercase">
          {project?.manager?.name?.slice(0, 2)}
        </Avatar>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <Title level={5} className="mb-0! font-semibold">
              {project?.name}
            </Title>
            <Tag color={status.color} className="rounded-full px-3 py-0.5 text-xs font-semibold">
              {status.label}
            </Tag>
          </div>
          {project?.description && (
            <Text className="mt-1 max-w-xl text-xs text-gray-600 md:text-sm">
              {project.description}
            </Text>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        {(onChangeStatus || onAssignTeam || onUnassignTeam) && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {onChangeStatus && (
              <Dropdown
                menu={{
                  onClick: ({ key }) => onChangeStatus(key),
                  items: STATUS_OPTIONS.map((value) => ({
                    key: value,
                    label: statusLabels[value],
                    disabled: value === project?.status,
                  })),
                }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button loading={statusLoading} type="default">
                  Change Status
                </Button>
              </Dropdown>
            )}
            {onAssignTeam && (
              <Button
                icon={<UserSwitchOutlined />}
                onClick={onAssignTeam}
                disabled={assignDisabled}
                loading={assignLoading}
              >
                Assign Team
              </Button>
            )}
            {onUnassignTeam && (
              <Button
                danger
                icon={<UserDeleteOutlined />}
                onClick={onUnassignTeam}
                disabled={unassignDisabled}
                loading={unassignLoading}
              >
                Unassign
              </Button>
            )}
          </div>
        )}
        {project?.hasUnapproved && (
          <div className="flex items-center gap-2 text-orange-500">
            <ExclamationCircleOutlined />
            <Text className="font-medium text-orange-500">
              {project?.unapprovedCount} Unapproved tasks
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}
