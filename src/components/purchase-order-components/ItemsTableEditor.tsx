import { Input, InputNumber } from "antd"
import { FiPlus, FiTrash2 } from "react-icons/fi"
import { UnitSelect } from "../unit-components/UnitSelect"
import { createEmptyItem, type EditableItem } from "../../utils/purchaseOrderItems"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0)

interface ItemsTableEditorProps {
  items: EditableItem[]
  onChange: (items: EditableItem[]) => void
  disabled?: boolean
}

export const ItemsTableEditor = ({ items, onChange, disabled = false }: ItemsTableEditorProps) => {
  const updateItem = <K extends keyof EditableItem>(index: number, field: K, value: EditableItem[K]) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const addItem = () => onChange([...items, createEmptyItem()])
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index))

  const grandTotal = items.reduce((sum, item) => sum + item.quantity * (item.unitPrice || 0), 0)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Items</span>
        {!disabled && (
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <FiPlus size={14} />
            Add Item
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Item Name*</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Description</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 w-24">Qty*</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 w-40">Unit</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 w-32">Unit Price</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500 w-32">Total</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Remarks</th>
              {!disabled && <th className="w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.length === 0 ? (
              <tr>
                <td colSpan={disabled ? 7 : 8} className="px-3 py-6 text-center text-gray-400">
                  No items added yet
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index}>
                  <td className="px-2 py-1.5">
                    <Input
                      value={item.itemName}
                      onChange={(e) => updateItem(index, "itemName", e.target.value)}
                      placeholder="Item name"
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder="Description"
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <InputNumber
                      min={0}
                      className="w-full"
                      value={item.quantity}
                      onChange={(value) => updateItem(index, "quantity", value || 0)}
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <UnitSelect
                      value={item.unit}
                      onChange={(value) => updateItem(index, "unit", value)}
                      className="w-full"
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <InputNumber
                      min={0}
                      className="w-full"
                      value={item.unitPrice}
                      onChange={(value) => updateItem(index, "unitPrice", value || 0)}
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium text-gray-700">
                    {formatCurrency(item.quantity * (item.unitPrice || 0))}
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      value={item.remarks}
                      onChange={(e) => updateItem(index, "remarks", e.target.value)}
                      placeholder="Remarks"
                      disabled={disabled}
                    />
                  </td>
                  {!disabled && (
                    <td className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={5} className="px-3 py-2 text-right font-semibold text-gray-700">
                Grand Total
              </td>
              <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatCurrency(grandTotal)}</td>
              <td colSpan={disabled ? 1 : 2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
