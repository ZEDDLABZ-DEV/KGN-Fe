import type { ReactNode } from "react"
import { Popconfirm, Tooltip } from "antd"
import type { StatusTransition } from "../../utils/workflow"

export interface StatusActionOption extends StatusTransition {
  disabled?: boolean
  disabledReason?: string
}

interface StatusActionButtonsProps {
  options: StatusActionOption[]
  updatingStatus?: string | null
  onTransition: (status: string) => void
  renderCustom?: (option: StatusActionOption) => ReactNode | undefined
  variant?: "button" | "link"
  emptyText?: ReactNode
}

const getButtonClasses = (option: StatusActionOption, variant: "button" | "link") => {
  if (variant === "link") {
    if (option.danger) return "text-red-600 hover:text-red-700"
    if (option.primary) return "text-slate-900 hover:text-slate-700 font-medium"
    return "text-gray-600 hover:text-gray-800"
  }

  if (option.danger) {
    return "border border-red-200 text-red-600 bg-white hover:bg-red-50"
  }
  if (option.primary) {
    return "border border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
  }
  return "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
}

export const StatusActionButtons = ({
  options,
  updatingStatus,
  onTransition,
  renderCustom,
  variant = "button",
  emptyText = null,
}: StatusActionButtonsProps) => {
  if (!options || options.length === 0) {
    return emptyText ? <>{emptyText}</> : null
  }

  return (
    <div className={variant === "link" ? "flex items-center gap-3" : "flex flex-wrap items-center gap-2"}>
      {options.map((option) => {
        const custom = renderCustom?.(option)
        if (custom !== undefined) {
          return <span key={option.status}>{custom}</span>
        }

        const isUpdating = updatingStatus === option.status
        const isDisabled = !!option.disabled || (!!updatingStatus && !isUpdating)
        const baseClasses =
          variant === "link"
            ? "text-sm disabled:cursor-not-allowed disabled:opacity-50"
            : "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"

        const button = (
          <button
            type="button"
            disabled={isDisabled}
            className={`${baseClasses} ${getButtonClasses(option, variant)}`}
          >
            {isUpdating ? "..." : option.label}
          </button>
        )

        if (isDisabled) {
          return (
            <Tooltip key={option.status} title={option.disabledReason || (isUpdating ? undefined : "Please wait...")}>
              <span>{button}</span>
            </Tooltip>
          )
        }

        return (
          <Popconfirm
            key={option.status}
            title={option.label}
            description="Are you sure you want to proceed with this action?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => onTransition(option.status)}
          >
            {button}
          </Popconfirm>
        )
      })}
    </div>
  )
}
