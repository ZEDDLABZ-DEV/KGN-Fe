export const GRN_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  PENDING: { label: "Pending", color: "text-gray-700", bgColor: "bg-gray-100", dotColor: "#6b7280" },
  PARTIALLY_RECEIVED: { label: "Partially Received", color: "text-orange-700", bgColor: "bg-orange-50", dotColor: "#f97316" },
  COMPLETED: { label: "Completed", color: "text-emerald-700", bgColor: "bg-emerald-50", dotColor: "#10b981" },
  REJECTED: { label: "Rejected", color: "text-red-700", bgColor: "bg-red-50", dotColor: "#ef4444" },
}
