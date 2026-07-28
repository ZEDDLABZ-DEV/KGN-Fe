/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useContext, useEffect, useMemo, useState } from "react"
import { Table, Modal, Form, Input, Select, Button, Switch, Tag, Popconfirm, Tooltip } from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons"
import { toast } from "react-hot-toast"
import moment from "moment"
import { ParentLayout } from "../../layout/ParentLayout"
import { AuthContext } from "../../context/AuthContext"
import { isAdmin } from "../../utils/roles"
import { getApiErrorMessage } from "../../utils/apiError"
import {
  useUnits,
  invalidateActiveUnitsCache,
  type Unit,
  type UnitStatus,
  type UnitStatusFilter,
} from "../../hooks/useUnits"

const STATUS_FILTER_OPTIONS: { label: string; value: UnitStatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
]

const Units = () => {
  const { user } = useContext(AuthContext) as any
  const admin = isAdmin(user)

  const { units, loading, loadUnits, createUnit, renameUnit, changeUnitStatus, deleteUnit } = useUnits()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<UnitStatusFilter>("ALL")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadUnits("ALL")
  }, [])

  const filteredUnits = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return units.filter((unit) => {
      const matchesSearch = !term || unit.name.toLowerCase().includes(term)
      const matchesStatus = statusFilter === "ALL" || unit.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [units, searchTerm, statusFilter])

  const closeModal = () => {
    setModalOpen(false)
    setEditingUnit(null)
    form.resetFields()
  }

  const openCreateModal = () => {
    setEditingUnit(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit)
    form.setFieldsValue({ name: unit.name })
    setModalOpen(true)
  }

  const handleSubmit = async (values: { name: string }) => {
    const name = values.name.trim()
    setSaving(true)
    try {
      if (editingUnit) {
        await renameUnit(editingUnit.id, name)
        toast.success("Unit renamed successfully")
      } else {
        await createUnit(name)
        toast.success("Unit created successfully")
      }
      invalidateActiveUnitsCache()
      closeModal()
      loadUnits("ALL")
    } catch (err: any) {
      if (err?.response?.status === 400) {
        form.setFields([
          { name: "name", errors: [getApiErrorMessage(err, "Invalid unit name")] },
        ])
      } else {
        toast.error(getApiErrorMessage(err, editingUnit ? "Failed to rename unit" : "Failed to create unit"))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (unit: Unit, checked: boolean) => {
    const nextStatus: UnitStatus = checked ? "ACTIVE" : "INACTIVE"
    setStatusUpdatingId(unit.id)
    try {
      await changeUnitStatus(unit.id, nextStatus)
      invalidateActiveUnitsCache()
      toast.success(`Unit ${nextStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`)
      await loadUnits("ALL")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update unit status"))
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const handleDelete = async (unit: Unit) => {
    setDeletingId(unit.id)
    try {
      await deleteUnit(unit.id)
      invalidateActiveUnitsCache()
      toast.success("Unit deleted successfully")
      await loadUnits("ALL")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete unit"))
    } finally {
      setDeletingId(null)
    }
  }

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, unit: Unit) =>
        admin ? (
          <Switch
            checked={unit.status === "ACTIVE"}
            loading={statusUpdatingId === unit.id}
            disabled={deletingId === unit.id}
            onChange={(checked) => handleToggleStatus(unit, checked)}
          />
        ) : (
          <Tag color={unit.status === "ACTIVE" ? "green" : "red"}>{unit.status}</Tag>
        ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) => moment(createdAt).format("DD MMM YYYY, hh:mm A"),
    },
    ...(admin
      ? [
          {
            title: "Actions",
            key: "actions",
            width: 120,
            render: (_: any, unit: Unit) => {
              const rowBusy = statusUpdatingId === unit.id || deletingId === unit.id
              return (
                <div className="flex items-center">
                  <Button type="link" disabled={rowBusy} onClick={() => openEditModal(unit)}>
                    <Tooltip title="Edit Unit">
                      <EditOutlined className="text-lg" />
                    </Tooltip>
                  </Button>
                  <Popconfirm
                    title="Delete this unit?"
                    description="This permanently removes the unit. Consider deactivating instead if it's already in use."
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    cancelText="Cancel"
                    onConfirm={() => handleDelete(unit)}
                  >
                    <Button type="link" danger disabled={rowBusy} loading={deletingId === unit.id}>
                      <Tooltip title="Delete Unit">
                        <DeleteOutlined className="text-lg" />
                      </Tooltip>
                    </Button>
                  </Popconfirm>
                </div>
              )
            },
          },
        ]
      : []),
  ]

  return (
    <ParentLayout title="Units of Measurement">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search units..."
            allowClear
            size="large"
            className="min-w-[220px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select<UnitStatusFilter>
            size="large"
            className="min-w-[150px]"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTER_OPTIONS}
          />
        </div>

        {admin && (
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreateModal}>
            Add Unit
          </Button>
        )}
      </div>

      <Table loading={loading} dataSource={filteredUnits} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />

      <Modal
        title={editingUnit ? "Rename Unit" : "Add Unit"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingUnit ? "Save" : "Create"}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Please enter a unit name" },
              { whitespace: true, message: "Name cannot be only whitespace" },
            ]}
          >
            <Input placeholder="e.g. Kilograms" autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </ParentLayout>
  )
}

export { Units }
