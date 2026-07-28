import { useEffect, useState } from "react"
import { Empty, Select, Skeleton, Table } from "antd"
import { FiRefreshCw } from "react-icons/fi"
import { useInventory } from "../../hooks/useInventory"
import { getApiErrorMessage } from "../../utils/apiError"
import { ErrorState } from "./ErrorState"

interface Project {
  id: string
  name: string
  projectId?: string
}

interface ProjectStockTabProps {
  projects: Project[]
  refreshToken: number
}

const columns = [
  { title: "Material", dataIndex: "name", key: "name" },
  { title: "Unit", dataIndex: "unit", key: "unit", width: 120 },
  { title: "Current Stock", dataIndex: "currentStock", key: "currentStock", width: 160, align: "right" as const },
]

/** Project-scoped stock view: pick a project, see current stock for every material at that project. */
export const ProjectStockTab = ({ projects, refreshToken }: ProjectStockTabProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const { projectStock, projectStockLoading, loadProjectStock, clearProjectStock } = useInventory()

  const fetchStock = async (projectId: string) => {
    setError(null)
    try {
      await loadProjectStock(projectId)
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load project stock"))
    }
  }

  useEffect(() => {
    if (selectedProjectId) {
      fetchStock(selectedProjectId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, refreshToken])

  const handleProjectChange = (value: string | undefined) => {
    setSelectedProjectId(value)
    if (!value) {
      clearProjectStock()
      setError(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Select
        placeholder="Select a project..."
        value={selectedProjectId}
        onChange={handleProjectChange}
        allowClear
        showSearch
        size="large"
        className="w-full sm:w-80"
        filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
        options={projects.map((p) => ({ label: p.name, value: p.id }))}
      />

      {!selectedProjectId ? (
        <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a project to view its stock." />
        </div>
      ) : projectStockLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <ErrorState message={error} onRetry={() => fetchStock(selectedProjectId)} />
        </div>
      ) : !projectStock || projectStock.stock.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No inventory recorded." />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900">Stock at {projectStock.project.name}</h4>
            <button
              onClick={() => fetchStock(selectedProjectId)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              <FiRefreshCw size={14} />
              Refresh
            </button>
          </div>
          <Table dataSource={projectStock.stock} columns={columns} rowKey="inventoryItemId" pagination={{ pageSize: 10 }} />
        </div>
      )}
    </div>
  )
}
