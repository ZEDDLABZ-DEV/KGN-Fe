/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useState } from "react"
import { Button, Tabs } from "antd"
import { toast } from "react-hot-toast"
import { LuClipboardList, LuLock } from "react-icons/lu"
import { FiPlus } from "react-icons/fi"
import { ParentLayout } from "../../layout/ParentLayout"
import { Request } from "../../utils/Request"
import { AuthContext } from "../../context/AuthContext"
import { canViewInventory, canIssueInventory } from "../../utils/roles"
import { getApiErrorMessage } from "../../utils/apiError"
import { useInventory } from "../../hooks/useInventory"
import { ProjectStockTab } from "../../components/inventory-components/ProjectStockTab"
import { MaterialStockTab } from "../../components/inventory-components/MaterialStockTab"
import { StockLedgerTab } from "../../components/inventory-components/StockLedgerTab"
import { IssueMaterialModal } from "../../components/inventory-components/IssueMaterialModal"

interface Project {
  id: string
  name: string
  projectId?: string
}

/**
 * Read-only stock reporting: Inventory has no create/edit/delete/approval
 * workflow of its own. Stock moves IN automatically when a GRN is received,
 * and OUT only via the single "Issue Material" mutation below.
 */
const Inventory = () => {
  const { user } = useContext(AuthContext) as any
  const hasToken = !!localStorage.getItem("token")
  const canView = canViewInventory(user)
  const canIssue = canIssueInventory(user)

  const [projects, setProjects] = useState<Project[]>([])
  const [issueModalOpen, setIssueModalOpen] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)

  const { items, itemsLoading, loadItems } = useInventory()

  const fetchProjects = async () => {
    try {
      const res: any = await Request.get("/v1/api/projects/all")
      setProjects(res.data || [])
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load projects"))
    }
  }

  useEffect(() => {
    if (hasToken && canView) {
      fetchProjects()
      loadItems()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!hasToken) {
    return (
      <ParentLayout title="Inventory">
        <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
          <p className="text-gray-500">Please login to continue.</p>
        </div>
      </ParentLayout>
    )
  }

  if (!canView) {
    return (
      <ParentLayout title="Inventory">
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <LuLock className="text-gray-400" size={32} />
          <h3 className="text-base font-medium text-gray-900">Access denied</h3>
          <p className="text-sm text-gray-500">You don't have permission to view Inventory.</p>
        </div>
      </ParentLayout>
    )
  }

  const handleIssueSuccess = () => {
    setIssueModalOpen(false)
    setRefreshToken((t) => t + 1)
  }

  const tabItems = [
    {
      key: "project-stock",
      label: "Project Stock",
      children: <ProjectStockTab projects={projects} refreshToken={refreshToken} />,
    },
    {
      key: "by-material",
      label: "By Material",
      children: <MaterialStockTab items={items} itemsLoading={itemsLoading} refreshToken={refreshToken} />,
    },
    {
      key: "stock-ledger",
      label: "Stock Ledger",
      children: <StockLedgerTab projects={projects} items={items} refreshToken={refreshToken} />,
    },
  ]

  return (
    <ParentLayout title="Inventory">
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                <LuClipboardList className="text-indigo-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
                <p className="text-sm text-gray-500">
                  Stock updates automatically from received GRNs and issued material
                </p>
              </div>
            </div>

            {canIssue && (
              <Button type="primary" size="large" icon={<FiPlus size={16} />} onClick={() => setIssueModalOpen(true)}>
                Issue Material
              </Button>
            )}
          </div>
        </div>

        <Tabs items={tabItems} />
      </div>

      {canIssue && (
        <IssueMaterialModal
          open={issueModalOpen}
          projects={projects}
          items={items}
          onClose={() => setIssueModalOpen(false)}
          onSuccess={handleIssueSuccess}
        />
      )}
    </ParentLayout>
  )
}

export { Inventory }
