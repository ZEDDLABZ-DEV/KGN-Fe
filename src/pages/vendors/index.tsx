/* eslint-disable @typescript-eslint/no-explicit-any */

import { useContext, useEffect, useState } from "react"
import {
  Modal,
  Form,
  Input,
  Skeleton,
  Empty,
} from "antd"
import { toast } from "react-hot-toast"
import { ParentLayout } from "../../layout/ParentLayout"
import { Request } from "../../utils/Request"
import { AuthContext } from "../../context/AuthContext"
import {
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiFileText,
  FiEye,
} from "react-icons/fi"
import { HiOutlineOfficeBuilding } from "react-icons/hi"

interface Vendor {
  id: string
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  gstNumber?: string
  panNumber?: string
  notes?: string
  createdAt?: string
}

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(false)
  const { permissions = [] } = useContext(AuthContext) as any
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [form] = Form.useForm()

  // Filters
  const [searchTerm, setSearchTerm] = useState("")

  // Actions
  const [actionMenuVendor, setActionMenuVendor] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [editForm] = Form.useForm()

  // View details
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null)

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false)
    form.resetFields()
  }

  const handleCreateVendor = async (values: any) => {
    try {
      setCreateLoading(true)
      await Request.post("/v1/api/vendors", {
        name: values.name,
        contactPerson: values.contactPerson || "",
        phone: values.phone || "",
        email: values.email || "",
        address: values.address || "",
        city: values.city || "",
        state: values.state || "",
        country: values.country || "",
        zipCode: values.zipCode || "",
        gstNumber: values.gstNumber || "",
        panNumber: values.panNumber || "",
        notes: values.notes || "",
      })
      await getVendors()
      handleCloseCreateModal()
      toast.success("Vendor created successfully")
    } catch (error) {
      console.log(error)
      toast.error("Failed to create vendor")
    } finally {
      setCreateLoading(false)
    }
  }

  const getVendors = async () => {
    setLoading(true)
    try {
      const response = await Request.get("/v1/api/vendors")
      setVendors(response.data || [])
    } catch (error) {
      console.log(error)
      toast.error("Failed to load vendors")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVendor = async (vendorId: string) => {
    try {
      await Request.delete(`/v1/api/vendors/${vendorId}`)
      setVendors((prev) => prev.filter((v) => v.id !== vendorId))
      toast.success("Vendor deleted")
      setActionMenuVendor(null)
    } catch (error) {
      console.log(error)
      toast.error("Failed to delete vendor")
    }
  }

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor)
    editForm.setFieldsValue({
      name: vendor.name,
      contactPerson: vendor.contactPerson,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      country: vendor.country,
      zipCode: vendor.zipCode,
      gstNumber: vendor.gstNumber,
      panNumber: vendor.panNumber,
      notes: vendor.notes,
    })
    setEditModalOpen(true)
    setActionMenuVendor(null)
  }

  const openViewModal = (vendor: Vendor) => {
    setViewingVendor(vendor)
    setViewModalOpen(true)
    setActionMenuVendor(null)
  }

  const handleEditVendor = async (values: any) => {
    if (!editingVendor) return

    try {
      await Request.put(`/v1/api/vendors/${editingVendor.id}`, {
        name: values.name,
        contactPerson: values.contactPerson || "",
        phone: values.phone || "",
        email: values.email || "",
        address: values.address || "",
        city: values.city || "",
        state: values.state || "",
        country: values.country || "",
        zipCode: values.zipCode || "",
        gstNumber: values.gstNumber || "",
        panNumber: values.panNumber || "",
        notes: values.notes || "",
      })
      setVendors((prev) =>
        prev.map((v) =>
          v.id === editingVendor.id
            ? { ...v, ...values }
            : v
        )
      )
      toast.success("Vendor updated")
      setEditModalOpen(false)
      setEditingVendor(null)
      editForm.resetFields()
    } catch (error) {
      console.log(error)
      toast.error("Failed to update vendor")
    }
  }

  useEffect(() => {
    getVendors()
  }, [])

  // Filter vendors
  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      !searchTerm ||
      vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.phone?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const canCreateVendors = permissions.find((p: any) => p.name === "create_vendors") || permissions.find((p: any) => p.name === "view_users")
  const canEditVendors = permissions.find((p: any) => p.name === "edit_vendors") || permissions.find((p: any) => p.name === "view_users")
  const canDeleteVendors = permissions.find((p: any) => p.name === "delete_vendors") || permissions.find((p: any) => p.name === "view_users")

  return (
    <ParentLayout title="Vendors">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                <HiOutlineOfficeBuilding className="text-purple-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Vendors</h1>
                <p className="text-sm text-gray-500">Manage your vendor database</p>
              </div>
            </div>

            {canCreateVendors && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                <FiPlus size={18} />
                Add Vendor
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <HiOutlineOfficeBuilding className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
                <p className="text-xs text-gray-500">Total Vendors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search vendors by name, contact person, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-10 rounded-lg border-gray-200"
              allowClear
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Vendor List */}
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={searchTerm ? "No vendors match your search" : "No vendors yet"}
            >
              {canCreateVendors && !searchTerm && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  <FiPlus size={16} />
                  Add first vendor
                </button>
              )}
            </Empty>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Vendor Count Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                {filteredVendors.length} vendor{filteredVendors.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Vendor Cards */}
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                {/* Vendor Header */}
                <div className="flex items-start gap-4 p-4">
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                    <HiOutlineOfficeBuilding className="text-purple-600" size={20} />
                  </div>

                  {/* Vendor Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900">
                          {vendor.name}
                        </h3>
                        {vendor.contactPerson && (
                          <p className="mt-1 text-sm text-gray-600">
                            <span className="font-medium">Contact:</span> {vendor.contactPerson}
                          </p>
                        )}
                      </div>

                      {/* Actions Menu */}
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setActionMenuVendor(actionMenuVendor === vendor.id ? null : vendor.id)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                          <FiMoreVertical size={18} />
                        </button>
                        {actionMenuVendor === vendor.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActionMenuVendor(null)} />
                            <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                              <button
                                onClick={() => openViewModal(vendor)}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <FiEye size={16} className="text-gray-400" />
                                View Details
                              </button>
                              {canEditVendors && (
                                <button
                                  onClick={() => openEditModal(vendor)}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <FiEdit2 size={16} className="text-gray-400" />
                                  Edit Vendor
                                </button>
                              )}
                              {canDeleteVendors && (
                                <>
                                  <div className="my-1 border-t border-gray-100" />
                                  <button
                                    onClick={() => handleDeleteVendor(vendor.id)}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <FiTrash2 size={16} />
                                    Delete Vendor
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Vendor Meta Info */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                      {vendor.phone && (
                        <div className="flex items-center gap-1.5">
                          <FiPhone size={14} className="text-gray-400" />
                          {vendor.phone}
                        </div>
                      )}
                      {vendor.email && (
                        <div className="flex items-center gap-1.5">
                          <FiMail size={14} className="text-gray-400" />
                          {vendor.email}
                        </div>
                      )}
                      {vendor.city && (
                        <div className="flex items-center gap-1.5">
                          <FiMapPin size={14} className="text-gray-400" />
                          {vendor.city}{vendor.state && `, ${vendor.state}`}
                        </div>
                      )}
                    </div>

                    {vendor.gstNumber && (
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="font-medium">GST:</span> {vendor.gstNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor Footer */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                  <button
                    onClick={() => openViewModal(vendor)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <FiEye size={14} />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Vendor Modal */}
      <Modal
        title="Add Vendor"
        open={createModalOpen}
        onCancel={handleCloseCreateModal}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateVendor} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Vendor Name"
              name="name"
              rules={[{ required: true, message: "Please enter vendor name" }]}
              className="col-span-2"
            >
              <Input placeholder="Enter vendor/company name" />
            </Form.Item>

            <Form.Item label="Contact Person" name="contactPerson">
              <Input placeholder="Enter contact person name" prefix={<FiUser className="text-gray-400" size={14} />} />
            </Form.Item>

            <Form.Item label="Phone" name="phone">
              <Input placeholder="Enter phone number" prefix={<FiPhone className="text-gray-400" size={14} />} />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[{ type: "email", message: "Please enter a valid email" }]}
              className="col-span-2"
            >
              <Input placeholder="Enter email address" prefix={<FiMail className="text-gray-400" size={14} />} />
            </Form.Item>

            <Form.Item label="Address" name="address" className="col-span-2">
              <Input.TextArea rows={2} placeholder="Enter street address" />
            </Form.Item>

            <Form.Item label="City" name="city">
              <Input placeholder="Enter city" />
            </Form.Item>

            <Form.Item label="State" name="state">
              <Input placeholder="Enter state" />
            </Form.Item>

            <Form.Item label="Country" name="country">
              <Input placeholder="Enter country" />
            </Form.Item>

            <Form.Item label="ZIP Code" name="zipCode">
              <Input placeholder="Enter ZIP code" />
            </Form.Item>

            <Form.Item label="GST Number" name="gstNumber">
              <Input placeholder="Enter GST number" />
            </Form.Item>

            <Form.Item label="PAN Number" name="panNumber">
              <Input placeholder="Enter PAN number" />
            </Form.Item>

            <Form.Item label="Notes" name="notes" className="col-span-2">
              <Input.TextArea rows={2} placeholder="Additional notes or remarks" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseCreateModal}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "Create Vendor"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal
        title="Edit Vendor"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false)
          setEditingVendor(null)
          editForm.resetFields()
        }}
        footer={null}
        width={800}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditVendor} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Vendor Name"
              name="name"
              rules={[{ required: true, message: "Please enter vendor name" }]}
              className="col-span-2"
            >
              <Input placeholder="Enter vendor/company name" />
            </Form.Item>

            <Form.Item label="Contact Person" name="contactPerson">
              <Input placeholder="Enter contact person name" prefix={<FiUser className="text-gray-400" size={14} />} />
            </Form.Item>

            <Form.Item label="Phone" name="phone">
              <Input placeholder="Enter phone number" prefix={<FiPhone className="text-gray-400" size={14} />} />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[{ type: "email", message: "Please enter a valid email" }]}
              className="col-span-2"
            >
              <Input placeholder="Enter email address" prefix={<FiMail className="text-gray-400" size={14} />} />
            </Form.Item>

            <Form.Item label="Address" name="address" className="col-span-2">
              <Input.TextArea rows={2} placeholder="Enter street address" />
            </Form.Item>

            <Form.Item label="City" name="city">
              <Input placeholder="Enter city" />
            </Form.Item>

            <Form.Item label="State" name="state">
              <Input placeholder="Enter state" />
            </Form.Item>

            <Form.Item label="Country" name="country">
              <Input placeholder="Enter country" />
            </Form.Item>

            <Form.Item label="ZIP Code" name="zipCode">
              <Input placeholder="Enter ZIP code" />
            </Form.Item>

            <Form.Item label="GST Number" name="gstNumber">
              <Input placeholder="Enter GST number" />
            </Form.Item>

            <Form.Item label="PAN Number" name="panNumber">
              <Input placeholder="Enter PAN number" />
            </Form.Item>

            <Form.Item label="Notes" name="notes" className="col-span-2">
              <Input.TextArea rows={2} placeholder="Additional notes or remarks" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false)
                setEditingVendor(null)
                editForm.resetFields()
              }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Save Changes
            </button>
          </div>
        </Form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        title="Vendor Details"
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false)
          setViewingVendor(null)
        }}
        footer={null}
        width={700}
      >
        {viewingVendor && (
          <div className="mt-4 space-y-6">
            {/* Header Info */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewingVendor.name}</h3>
                {viewingVendor.contactPerson && (
                  <p className="text-sm text-gray-500 mt-1">Contact: {viewingVendor.contactPerson}</p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {viewingVendor.phone && (
                  <div className="flex items-center gap-2">
                    <FiPhone className="text-gray-400" size={16} />
                    <span>{viewingVendor.phone}</span>
                  </div>
                )}
                {viewingVendor.email && (
                  <div className="flex items-center gap-2">
                    <FiMail className="text-gray-400" size={16} />
                    <span>{viewingVendor.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Address Info */}
            {(viewingVendor.address || viewingVendor.city) && (
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Address</h4>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <FiMapPin className="text-gray-400 mt-0.5" size={16} />
                  <div>
                    {viewingVendor.address && <div>{viewingVendor.address}</div>}
                    <div>
                      {viewingVendor.city && <span>{viewingVendor.city}</span>}
                      {viewingVendor.state && <span>, {viewingVendor.state}</span>}
                      {viewingVendor.zipCode && <span> - {viewingVendor.zipCode}</span>}
                    </div>
                    {viewingVendor.country && <div>{viewingVendor.country}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Tax Info */}
            {(viewingVendor.gstNumber || viewingVendor.panNumber) && (
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Tax Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {viewingVendor.gstNumber && (
                    <div>
                      <div className="text-xs text-gray-500">GST Number</div>
                      <div className="font-medium text-gray-900">{viewingVendor.gstNumber}</div>
                    </div>
                  )}
                  {viewingVendor.panNumber && (
                    <div>
                      <div className="text-xs text-gray-500">PAN Number</div>
                      <div className="font-medium text-gray-900">{viewingVendor.panNumber}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {viewingVendor.notes && (
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FiFileText size={16} />
                  Notes
                </h4>
                <p className="text-sm text-gray-600">{viewingVendor.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setViewModalOpen(false)
                  setViewingVendor(null)
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Close
              </button>
              {canEditVendors && (
                <button
                  onClick={() => {
                    setViewModalOpen(false)
                    openEditModal(viewingVendor)
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  <FiEdit2 size={16} />
                  Edit Vendor
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </ParentLayout>
  )
}

export { Vendors }
