import { Button } from "antd"
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi"

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

/** Shared error block used by every Inventory tab whenever a fetch fails, instead of silently showing an empty state. */
export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <FiAlertCircle className="text-red-500" size={32} />
      <h3 className="text-base font-medium text-gray-900">{message}</h3>
      <Button icon={<FiRefreshCw size={14} />} onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}
