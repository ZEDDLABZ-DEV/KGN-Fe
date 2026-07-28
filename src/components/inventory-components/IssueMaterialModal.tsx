import { useEffect, useState } from "react"
import { Form, Input, InputNumber, Modal, Select } from "antd"
import { toast } from "react-hot-toast"
import { useInventory, type InventoryItem } from "../../hooks/useInventory"
import { getApiErrorMessage } from "../../utils/apiError"

interface Project {
  id: string
  name: string
  projectId?: string
}

interface IssueMaterialModalProps {
  open: boolean
  projects: Project[]
  items: InventoryItem[]
  onClose: () => void
  onSuccess: () => void
}

interface FormValues {
  projectId: string
  inventoryItemId: string
  quantity: number
  notes?: string
}

/**
 * The single mutation in the Inventory module — records an "OUT" movement.
 * Mounted only when the parent's `canIssueInventory` check passes. The stock
 * banner here is purely informational; the backend remains the authority and
 * may still reject the submit (e.g. insufficient stock) even if the banner
 * looked fine, since stock can change between the banner render and submit.
 */
export const IssueMaterialModal = ({ open, projects, items, onClose, onSuccess }: IssueMaterialModalProps) => {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [stockCheckFailed, setStockCheckFailed] = useState(false)

  const projectId = Form.useWatch("projectId", form)
  const inventoryItemId = Form.useWatch("inventoryItemId", form)

  const { projectStock, projectStockLoading, loadProjectStock, clearProjectStock, issueMaterial } = useInventory()

  useEffect(() => {
    if (projectId && inventoryItemId) {
      setStockCheckFailed(false)
      loadProjectStock(projectId).catch(() => setStockCheckFailed(true))
    } else {
      clearProjectStock()
      setStockCheckFailed(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, inventoryItemId])

  const resetState = () => {
    form.resetFields()
    setSubmitError(null)
    setStockCheckFailed(false)
    clearProjectStock()
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await issueMaterial(values)
      toast.success("Material issued successfully")
      resetState()
      onSuccess()
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to issue material"))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedStockRow = projectStock?.stock.find((row) => row.inventoryItemId === inventoryItemId)

  const stockBannerText = projectStockLoading
    ? "Checking available stock..."
    : stockCheckFailed
      ? "Available stock could not be checked."
      : `Available stock: ${selectedStockRow?.currentStock ?? 0} ${selectedStockRow?.unit || ""}`

  return (
    <Modal
      title="Issue Material"
      open={open}
      onCancel={handleClose}
      onOk={() => form.submit()}
      okText="Issue Material"
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Project" name="projectId" rules={[{ required: true, message: "Please select a project" }]}>
          <Select
            placeholder="Select a project..."
            showSearch
            filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            options={projects.map((p) => ({ label: p.name, value: p.id }))}
          />
        </Form.Item>

        <Form.Item
          label="Material"
          name="inventoryItemId"
          rules={[{ required: true, message: "Please select a material" }]}
        >
          <Select
            placeholder="Select a material..."
            showSearch
            filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            options={items.map((item) => ({ label: `${item.name} (${item.unit})`, value: item.id }))}
          />
        </Form.Item>

        {projectId && inventoryItemId && (
          <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{stockBannerText}</div>
        )}

        <Form.Item
          label="Quantity"
          name="quantity"
          rules={[{ required: true, type: "number", min: 0.01, message: "Quantity must be greater than 0" }]}
        >
          <InputNumber className="w-full" min={0.01} step={0.01} placeholder="0.00" />
        </Form.Item>

        <Form.Item label="Notes" name="notes">
          <Input.TextArea rows={3} placeholder="Optional notes" />
        </Form.Item>

        {submitError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</div>}
      </Form>
    </Modal>
  )
}
