export interface WhatsAppPOItem {
  itemName: string
  quantity: number
  unit: string
  unitPrice?: number
}

export interface WhatsAppPOInput {
  id: string
  poNumber?: string
  projectName?: string
  expectedDelivery?: string
  items: WhatsAppPOItem[]
}

const COMPANY_NAME = "KGN"

export function buildSendToVendorMessage(po: WhatsAppPOInput): string {
  const lines: string[] = []

  lines.push(`*${COMPANY_NAME}*`)
  lines.push(`Purchase Order: ${po.poNumber || `PO-${po.id.slice(0, 8)}`}`)

  if (po.projectName) {
    lines.push(`Project: ${po.projectName}`)
  }

  lines.push("")
  lines.push("Items:")

  po.items.forEach((item, index) => {
    const hasRate = typeof item.unitPrice === "number" && item.unitPrice > 0
    const lineTotal = hasRate ? (item.unitPrice as number) * item.quantity : undefined
    const suffix = hasRate ? ` @ ${item.unitPrice}/${item.unit} = ${lineTotal}` : ""
    lines.push(`${index + 1}. ${item.itemName} — ${item.quantity} ${item.unit}${suffix}`)
  })

  if (po.expectedDelivery) {
    lines.push("")
    lines.push(`Expected Delivery: ${po.expectedDelivery}`)
  }

  lines.push("")
  lines.push("Please confirm receipt of this order.")

  return lines.join("\n")
}

export function extractPhoneDigits(phone?: string | null): string {
  return (phone || "").replace(/\D/g, "")
}

export function openSendToVendorWhatsApp(po: WhatsAppPOInput, phone?: string | null): boolean {
  const digits = extractPhoneDigits(phone)
  if (!digits) return false

  const url = `https://wa.me/${digits}?text=${encodeURIComponent(buildSendToVendorMessage(po))}`
  return !!window.open(url, "_blank")
}
