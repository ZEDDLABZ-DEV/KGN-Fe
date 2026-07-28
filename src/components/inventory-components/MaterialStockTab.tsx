import { useEffect, useState } from "react"
import { Empty, Select, Skeleton, Table } from "antd"
import { FiRefreshCw } from "react-icons/fi"
import { useInventory, type InventoryItem } from "../../hooks/useInventory"
import { getApiErrorMessage } from "../../utils/apiError"
import { ErrorState } from "./ErrorState"

interface MaterialStockTabProps {
  items: InventoryItem[]
  itemsLoading: boolean
  refreshToken: number
}

const columns = [
  { title: "Project", dataIndex: "projectName", key: "projectName" },
  { title: "Current Stock", dataIndex: "currentStock", key: "currentStock", width: 160, align: "right" as const },
]

/** Material-scoped stock view: pick a material, see current stock across every project. */
export const MaterialStockTab = ({ items, itemsLoading, refreshToken }: MaterialStockTabProps) => {
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const { materialStock, materialStockLoading, loadMaterialStock, clearMaterialStock } = useInventory()

  const fetchStock = async (inventoryItemId: string) => {
    setError(null)
    try {
      await loadMaterialStock(inventoryItemId)
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load material stock"))
    }
  }

  useEffect(() => {
    if (selectedItemId) {
      fetchStock(selectedItemId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemId, refreshToken])

  const handleItemChange = (value: string | undefined) => {
    setSelectedItemId(value)
    if (!value) {
      clearMaterialStock()
      setError(null)
    }
  }

  if (!itemsLoading && items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Materials appear here automatically once a GRN is received."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Select
        placeholder="Select a material..."
        value={selectedItemId}
        onChange={handleItemChange}
        allowClear
        showSearch
        loading={itemsLoading}
        size="large"
        className="w-full sm:w-80"
        filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
        options={items.map((item) => ({ label: `${item.name} (${item.unit})`, value: item.id }))}
      />

      {!selectedItemId ? (
        <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a material to view its stock." />
        </div>
      ) : materialStockLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <ErrorState message={error} onRetry={() => fetchStock(selectedItemId)} />
        </div>
      ) : !materialStock || materialStock.stock.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No inventory recorded." />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900">{materialStock.inventoryItem.name} stock by project</h4>
            <button
              onClick={() => fetchStock(selectedItemId)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              <FiRefreshCw size={14} />
              Refresh
            </button>
          </div>
          <Table dataSource={materialStock.stock} columns={columns} rowKey="projectId" pagination={{ pageSize: 10 }} />
        </div>
      )}
    </div>
  )
}
