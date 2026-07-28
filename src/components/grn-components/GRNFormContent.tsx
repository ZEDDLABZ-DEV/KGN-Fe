/* eslint-disable @typescript-eslint/no-explicit-any */
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { DatePicker, Form, Input, InputNumber } from "antd"
import dayjs from "dayjs"
import { toast } from "react-hot-toast"
import {
  getSubmittableGRNLines,
  isReceivedDateValid,
  validateGRNLines,
  type GRN,
  type GRNSummaryItem,
} from "../../hooks/useGRN"
import { getApiErrorMessage } from "../../utils/apiError"

export interface GRNFormPOContext {
  id: string
  poNumber?: string
  vendorName?: string
  items?: Array<{ id?: string; itemName: string; unit: string; quantity: number }>
}

interface GRNFormItem {
  purchaseOrderItemId: string
  itemName: string
  unit: string
  orderedQuantity: number
  receivedQuantity: number
  damagedQuantity: number
  remarks?: string
}

export interface GRNFormContentHandle {
  submit: () => void
}

interface GRNFormContentProps {
  mode: "create" | "edit"
  po: GRNFormPOContext | null
  summary: GRNSummaryItem[] | null
  grn?: GRN | null
  createGRN: (payload: any) => Promise<any>
  updateGRN: (id: string, payload: any) => Promise<any>
  onSaved: () => void | Promise<void>
  onSavingChange?: (saving: boolean) => void
}

const buildCreateRows = (summary: GRNSummaryItem[] | null): GRNFormItem[] =>
  (summary || []).map((s) => ({
    purchaseOrderItemId: s.itemId,
    itemName: s.itemName,
    unit: s.unit,
    orderedQuantity: s.orderedQuantity,
    receivedQuantity: s.pendingQuantity,
    damagedQuantity: 0,
    remarks: "",
  }))

const buildEditRows = (grn: GRN, summary: GRNSummaryItem[] | null, po: GRNFormPOContext | null): GRNFormItem[] =>
  (grn.items || []).map((item) => {
    const summaryItem = summary?.find((s) => s.itemId === item.purchaseOrderItemId)
    const poItem = po?.items?.find((p) => p.id === item.purchaseOrderItemId)
    return {
      purchaseOrderItemId: item.purchaseOrderItemId,
      itemName: item.itemName || summaryItem?.itemName || poItem?.itemName || "—",
      unit: item.unit || summaryItem?.unit || poItem?.unit || "—",
      orderedQuantity: item.orderedQuantity ?? summaryItem?.orderedQuantity ?? poItem?.quantity ?? 0,
      receivedQuantity: item.receivedQuantity || 0,
      damagedQuantity: item.damagedQuantity || 0,
      remarks: item.remarks || "",
    }
  })

/**
 * Shared Create/Edit GRN form body (no Modal wrapper). Used both by the
 * standalone `GRNFormModal` and the "Record GRN" section embedded on the
 * Purchase Orders page, so both entry points share one implementation.
 */
export const GRNFormContent = forwardRef<GRNFormContentHandle, GRNFormContentProps>(
  ({ mode, po, summary, grn, createGRN, updateGRN, onSaved, onSavingChange }, ref) => {
    const [form] = Form.useForm()
    const [items, setItems] = useState<GRNFormItem[]>([])

    useEffect(() => {
      if (mode === "edit" && grn) {
        form.setFieldsValue({
          receivedDate: grn.receivedDate ? dayjs(grn.receivedDate) : dayjs(),
          receivedBy: grn.receivedBy,
          remarks: grn.remarks || "",
        })
        setItems(buildEditRows(grn, summary, po))
      } else {
        form.setFieldsValue({
          receivedDate: dayjs(),
          receivedBy: "",
          remarks: "",
        })
        setItems(buildCreateRows(summary))
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, grn, summary, po])

    const updateItem = <K extends keyof GRNFormItem>(index: number, field: K, value: GRNFormItem[K]) => {
      setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
    }

    const handleSave = async () => {
      if (!po) return

      let values
      try {
        values = await form.validateFields()
      } catch {
        return
      }

      if (!isReceivedDateValid(values.receivedDate?.toDate?.() || values.receivedDate)) {
        toast.error("Received date must be within the last 365 days and no more than 1 day in the future")
        return
      }

      const submittable = getSubmittableGRNLines(items)

      const extraAllowanceByItemId =
        mode === "edit" && grn
          ? new Map(grn.items.map((item) => [item.purchaseOrderItemId, item.receivedQuantity || 0]))
          : undefined

      const validationError = validateGRNLines(submittable, summary, extraAllowanceByItemId)
      if (validationError) {
        toast.error(validationError)
        return
      }

      onSavingChange?.(true)
      try {
        const payload = {
          purchaseOrderId: po.id,
          receivedBy: values.receivedBy,
          receivedDate: values.receivedDate.format("YYYY-MM-DD"),
          remarks: values.remarks || "",
          items: submittable.map((item) => ({
            purchaseOrderItemId: item.purchaseOrderItemId,
            receivedQuantity: item.receivedQuantity || 0,
            damagedQuantity: item.damagedQuantity || 0,
            remarks: item.remarks || "",
          })),
        }

        if (mode === "edit" && grn) {
          await updateGRN(grn.id, payload)
          toast.success("GRN updated")
        } else {
          await createGRN(payload)
          toast.success("GRN created")
        }

        await onSaved()
      } catch (err) {
        toast.error(getApiErrorMessage(err, `Failed to ${mode === "edit" ? "update" : "create"} GRN`))
      } finally {
        onSavingChange?.(false)
      }
    }

    useImperativeHandle(ref, () => ({ submit: handleSave }))

    return (
      <Form form={form} layout="vertical" className="mt-4">
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="PO Number">
            <Input value={po?.poNumber || `PO-${po?.id?.slice(0, 8) || ""}`} disabled />
          </Form.Item>
          <Form.Item label="Vendor">
            <Input value={po?.vendorName || "—"} disabled />
          </Form.Item>
          <Form.Item
            label="Received Date"
            name="receivedDate"
            rules={[{ required: true, message: "Please select the received date" }]}
          >
            <DatePicker
              className="w-full"
              format="MMM DD, YYYY"
              disabledDate={(date) => !isReceivedDateValid(date.toDate())}
            />
          </Form.Item>
          <Form.Item
            label="Received By"
            name="receivedBy"
            rules={[{ required: true, message: "Please enter who received the goods" }]}
          >
            <Input placeholder="Receiver name" />
          </Form.Item>
        </div>

        <Form.Item label="Remarks" name="remarks">
          <Input.TextArea rows={2} placeholder="Overall remarks for this GRN" />
        </Form.Item>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">GRN Items</span>
            <span className="text-xs text-gray-400">Rows left at 0 received / 0 damaged are ignored on save</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Item</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500 w-24">Ordered</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500 w-28">Received</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500 w-28">Damaged</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500 w-28">Net Received</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Item Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                      No items to receive
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const netReceived = (item.receivedQuantity || 0) - (item.damagedQuantity || 0)
                    return (
                      <tr key={item.purchaseOrderItemId}>
                        <td className="px-3 py-1.5 text-gray-800">
                          {item.itemName}
                          <div className="text-xs text-gray-500">{item.unit}</div>
                        </td>
                        <td className="px-3 py-1.5 text-center text-gray-600">{item.orderedQuantity}</td>
                        <td className="px-2 py-1.5">
                          <InputNumber
                            min={0}
                            className="w-full"
                            value={item.receivedQuantity}
                            onChange={(val) => updateItem(index, "receivedQuantity", val || 0)}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <InputNumber
                            min={0}
                            className="w-full"
                            value={item.damagedQuantity}
                            onChange={(val) => updateItem(index, "damagedQuantity", val || 0)}
                          />
                        </td>
                        <td className="px-3 py-1.5 text-center font-semibold text-gray-800">{netReceived}</td>
                        <td className="px-2 py-1.5">
                          <Input
                            placeholder="Remarks"
                            value={item.remarks}
                            onChange={(e) => updateItem(index, "remarks", e.target.value)}
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Form>
    )
  }
)

GRNFormContent.displayName = "GRNFormContent"
