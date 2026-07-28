import { GRN_STATUS_CONFIG } from "../../utils/grnStatus"

export const GRNStatusBadge = ({ status }: { status?: string }) => {
  const config = GRN_STATUS_CONFIG[status?.toUpperCase() || ""] || GRN_STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bgColor} ${config.color}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.dotColor }} />
      {config.label}
    </span>
  )
}
