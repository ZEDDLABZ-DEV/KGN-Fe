import moment from "moment"
import type { GRN } from "../hooks/useGRN"
import { GRN_STATUS_CONFIG } from "./grnStatus"

export interface PrintableGRNPO {
  poNumber?: string
  vendorName?: string
}

const formatDate = (date?: string) => (date ? moment(date).format("MMM DD, YYYY") : "—")

/** Opens a new window, writes a standalone GRN document, and triggers the print dialog. */
export function printGRN(grn: GRN, po?: PrintableGRNPO | null): boolean {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return false

  const grnNumber = grn.grnNumber || `GRN-${grn.id.slice(0, 8)}`
  const poNumber = po?.poNumber || `PO-${grn.purchaseOrderId.slice(0, 8)}`
  const vendorName = po?.vendorName || "—"
  const statusLabel = GRN_STATUS_CONFIG[grn.status?.toUpperCase() || ""]?.label || grn.status || "—"

  const itemsRows = (grn.items || [])
    .map((item, idx) => {
      const net = (item.receivedQuantity || 0) - (item.damagedQuantity || 0)
      return `
        <tr>
          <td class="center">${idx + 1}</td>
          <td>${item.itemName || "—"}</td>
          <td class="center">${item.unit || "—"}</td>
          <td class="center">${item.orderedQuantity ?? "—"}</td>
          <td class="center">${item.receivedQuantity ?? 0}</td>
          <td class="center">${item.damagedQuantity ?? 0}</td>
          <td class="center"><strong>${net}</strong></td>
          <td>${item.remarks || "—"}</td>
        </tr>
      `
    })
    .join("")

  printWindow.document.write(`
    <html>
      <head>
        <title>GRN - ${grnNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 16px; }
          h1 { margin: 0 0 6px 0; font-size: 22px; }
          .meta { color: #555; font-size: 13px; line-height: 1.8; }
          .info-section { margin: 20px 0; padding: 12px; background-color: #f9f9f9; border-radius: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
          th { background-color: #f5f5f5; font-weight: 600; }
          .right { text-align: right; }
          .center { text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>GOODS RECEIVING NOTE (GRN)</h1>
            <div class="meta">
              <div><strong>GRN Number:</strong> ${grnNumber}</div>
              <div><strong>PO Number:</strong> ${poNumber}</div>
              <div><strong>Status:</strong> ${statusLabel}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="meta">
              <div><strong>Received Date:</strong> ${formatDate(grn.receivedDate)}</div>
              <div><strong>Received By:</strong> ${grn.receivedBy || "—"}</div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="meta">
            <div><strong>Vendor:</strong> ${vendorName}</div>
            ${grn.remarks ? `<div style="margin-top: 8px;"><strong>Remarks:</strong> ${grn.remarks}</div>` : ""}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 34px;">#</th>
              <th>Item</th>
              <th class="center" style="width: 80px;">Unit</th>
              <th class="center" style="width: 90px;">Ordered</th>
              <th class="center" style="width: 90px;">Received</th>
              <th class="center" style="width: 90px;">Damaged</th>
              <th class="center" style="width: 90px;">Net</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="margin-top: 40px; font-size: 12px; color: #666;">
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  return true
}
