export interface StatusTransition {
  status: string
  label: string
  primary?: boolean
  danger?: boolean
  special?: string
  adminOnly?: boolean
}

/**
 * Returns the predefined transitions available from `currentStatus`.
 * The UI should only ever render these — never a free "pick any status" dropdown.
 */
export const getTransitions = (
  map: Record<string, StatusTransition[]>,
  currentStatus?: string | null
): StatusTransition[] => (currentStatus ? map[currentStatus] ?? [] : [])

export const PO_TRANSITIONS: Record<string, StatusTransition[]> = {
  APPROVED: [
    { status: "SENT", label: "Send to Vendor", primary: true, special: "whatsapp" },
    { status: "CANCELLED", label: "Cancel", danger: true },
  ],
  SENT: [
    { status: "PARTIALLY_RECEIVED", label: "Mark Partially Received" },
    { status: "RECEIVED", label: "Mark as Received", primary: true },
    { status: "CANCELLED", label: "Cancel", danger: true },
  ],
  PARTIALLY_RECEIVED: [
    { status: "RECEIVED", label: "Mark as Received", primary: true },
    { status: "CANCELLED", label: "Cancel", danger: true },
  ],
  RECEIVED: [],
  CANCELLED: [],
}

export const GRN_TRANSITIONS: Record<string, StatusTransition[]> = {
  PENDING: [
    { status: "PARTIALLY_RECEIVED", label: "Mark Partially Received" },
    { status: "COMPLETED", label: "Mark Completed", primary: true },
    { status: "REJECTED", label: "Reject", danger: true },
  ],
  PARTIALLY_RECEIVED: [
    { status: "COMPLETED", label: "Mark Completed", primary: true },
    { status: "REJECTED", label: "Reject", danger: true },
  ],
  COMPLETED: [],
  REJECTED: [],
}
