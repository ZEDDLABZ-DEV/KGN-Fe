import { useEffect, useState } from "react";
import { ParentLayout } from "../../layout/ParentLayout"
import { DatePicker, Empty, Form, Input, InputNumber, Modal, Select, Table } from "antd";
import { LuClipboardList } from "react-icons/lu";
import { BiPrinter } from "react-icons/bi";
import { FiChevronDown, FiEdit2, FiEye, FiPackage } from "react-icons/fi";
import { Request } from "../../utils/Request";
import toast from "react-hot-toast";
import moment from "moment";

const GRN_STATUS_CONFIG: Record<string, { label: string, color: string; bgColor: string; dotColor: string }> = {
    COMPLETED: { label: "Completed", color: "text-emerald-700", bgColor: "bg-emerald-50", dotColor: "#10b981" },
    PARTIAL: { label: "Partial", color: "text-amber-700", bgColor: "bg-amber-50", dotColor: "#f59e0b" },
    PENDING: { label: "Pending", color: "text-gray-700", bgColor: "bg-gray-50", dotColor: "#6b7280" },
}

interface GRNData {
    id: string
    grnNumber?: string
    purchaseOrderId: string
    purchaseOrder?: any
    receivedBy: string
    receivedDate: string
    remarks?: string
    items: Array<{
        id: string
        purchaseOrderItemId: string
        itemName?: string
        unit?: string
        orderedQuantity?: number
        receivedQuantity: number
        damagedQuantity: number
        remarks?: string
    }>
    createdAt?: string
}

const GRN = () => {
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<any>(null);
    const [grnData, setGrnData] = useState<GRNData | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [viewingGRN, setViewingGRN] = useState<GRNData | null>(null)

    const [loading, setLoading] = useState(false);
    const [grnLoading, setGrnLoading] = useState(false);

    // Edit GRN
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editLoading, setEditLoading] = useState(false)
    const [editingGRN, setEditingGRN] = useState<GRNData | null>(null)
    const [editGRNItems, setEditGRNItems] = useState<any[]>([])
    const [editForm] = Form.useForm()

    const getPurchaseOrders = async () => {
        setLoading(true);
        try {
            const response = await Request.get('/v1/api/purchase-orders');
            setPurchaseOrders(response.data || []);
        } catch (error) {
            console.log(error);
            toast.error('Failed to load purchase orders')
        } finally {
            setLoading(false);
        }
    }

    const getGRNByPO = async (purchaseOrderId: string) => {
        setGrnLoading(true);
        try {
            const response: any = await Request.get(`/v1/api/grn?purchaseOrderId=${purchaseOrderId}`);
            const grns: any[] = response?.data || response || []
            const latestGRN = Array.isArray(grns) && grns.length > 0 ? grns[0] : null
            
            if (latestGRN) {
                // Map the items to extract itemName and unit from nested purchaseOrderItem
                const mappedGRN: GRNData = {
                    ...latestGRN,
                    items: (latestGRN.items || []).map((item: any) => ({
                        ...item,
                        itemName: item.purchaseOrderItem?.itemName || item.itemName,
                        unit: item.purchaseOrderItem?.unit || item.unit,
                        orderedQuantity: item.purchaseOrderItem?.quantity || item.orderedQuantity,
                    }))
                }
                setGrnData(mappedGRN)
            } else {
                setGrnData(null)
                toast("No GRN found for this purchase order")
            }
        } catch (error) {
            console.log(error);
            toast.error('Failed to load GRN data')
            setGrnData(null)
        } finally {
            setGrnLoading(false);
        }
    }

    const handlePOChange = async (poId: string) => {
        const po = purchaseOrders.find((p) => p.id === poId)
        setSelectedPurchaseOrder(po || null)
        setGrnData(null)
        
        if (po?.id) {
            await getGRNByPO(po.id)
        }
    }

    const handlePrintGRN = (grn?: GRNData) => {
        const grnToPrint = grn || grnData
        
        if (!grnToPrint) {
            toast.error("No GRN data available to print")
            return
        }

        const poNumber = grnToPrint.purchaseOrder?.poNumber || selectedPurchaseOrder?.poNumber || `PO-${grnToPrint.purchaseOrderId.slice(0, 8)}`
        const vendorName = grnToPrint.purchaseOrder?.vendorName || selectedPurchaseOrder?.vendorName || "—"
        const grnNumber = grnToPrint.grnNumber || `GRN-${grnToPrint.id.slice(0, 8)}`
        const items = grnToPrint.items || []

        const printWindow = window.open("", "_blank")
        if (!printWindow) return

        printWindow.document.write(`
      <html>
        <head>
          <title>GRN - ${grnNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 16px; }
            h1 { margin: 0 0 6px 0; font-size: 24px; }
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
              </div>
            </div>
            <div style="text-align: right;">
              <div class="meta">
                <div><strong>Received Date:</strong> ${moment(grnToPrint.receivedDate).format('MMM DD, YYYY')}</div>
                <div><strong>Received By:</strong> ${grnToPrint.receivedBy || "—"}</div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <div class="meta">
              <div><strong>Vendor:</strong> ${vendorName}</div>
              ${grnToPrint.remarks ? `<div style="margin-top: 8px;"><strong>Remarks:</strong> ${grnToPrint.remarks}</div>` : ''}
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
              ${items.map((it: any, idx: number) => {
            const net = (it.receivedQuantity || 0) - (it.damagedQuantity || 0)
            const itemName = it.itemName || it.purchaseOrderItem?.itemName || "—"
            const unit = it.unit || it.purchaseOrderItem?.unit || "—"
            const orderedQty = it.orderedQuantity ?? it.purchaseOrderItem?.quantity ?? "—"
            return `
                  <tr>
                    <td class="center">${idx + 1}</td>
                    <td>${itemName}</td>
                    <td class="center">${unit}</td>
                    <td class="center">${orderedQty}</td>
                    <td class="center">${it.receivedQuantity ?? 0}</td>
                    <td class="center">${it.damagedQuantity ?? 0}</td>
                    <td class="center"><strong>${net}</strong></td>
                    <td>${it.remarks || "—"}</td>
                  </tr>
                `
        }).join("")}
            </tbody>
          </table>

          <div style="margin-top: 40px; font-size: 12px; color: #666;">
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `)

        printWindow.document.close()
        printWindow.print()
    }

    const handleViewGRN = () => {
        if (grnData) {
            setViewingGRN(grnData)
            setViewModalOpen(true)
        }
    }

    const openEditGRNModal = () => {
        if (!grnData) return
        
        setEditingGRN(grnData)
        editForm.setFieldsValue({
            receivedBy: grnData.receivedBy,
            receivedDate: grnData.receivedDate ? moment(grnData.receivedDate) : moment(),
            remarks: grnData.remarks || "",
        })
        
        setEditGRNItems(grnData.items.map(item => ({
            ...item,
            itemName: item.itemName || "",
            unit: item.unit || "",
            orderedQuantity: item.orderedQuantity || 0,
        })))
        
        setEditModalOpen(true)
    }

    const handleEditGRNItemChange = (index: number, field: string, value: any) => {
        const newItems = [...editGRNItems]
        newItems[index] = { ...newItems[index], [field]: value }
        setEditGRNItems(newItems)
    }

    const handleUpdateGRN = async (values: any) => {
        if (!editingGRN) return

        try {
            setEditLoading(true)
            const payload = {
                purchaseOrderId: editingGRN.purchaseOrderId,
                receivedBy: values.receivedBy,
                receivedDate: values.receivedDate?.toISOString(),
                remarks: values.remarks || "",
                items: editGRNItems.map((item) => ({
                    purchaseOrderItemId: item.purchaseOrderItemId,
                    receivedQuantity: item.receivedQuantity || 0,
                    damagedQuantity: item.damagedQuantity || 0,
                    remarks: item.remarks || "",
                })),
            }

            await Request.put(`/v1/api/grn/${editingGRN.id}`, payload)
            toast.success("GRN updated successfully")
            
            // Refresh GRN data
            if (selectedPurchaseOrder?.id) {
                await getGRNByPO(selectedPurchaseOrder.id)
            }
            
            setEditModalOpen(false)
            setEditingGRN(null)
            setEditGRNItems([])
            editForm.resetFields()
        } catch (error) {
            console.log(error)
            toast.error("Failed to update GRN")
        } finally {
            setEditLoading(false)
        }
    }

    const columns = [
        {
            title: '#',
            key: 'index',
            width: 50,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Item Name',
            dataIndex: 'itemName',
            key: 'itemName',
            render: (text: string) => text || "—",
        },
        {
            title: 'Unit',
            dataIndex: 'unit',
            width: 100,
            render: (text: string) => text || "—",
        },
        {
            title: 'Ordered',
            dataIndex: 'orderedQuantity',
            key: 'orderedQuantity',
            width: 100,
            align: 'center' as const,
            render: (val: number) => val ?? "—",
        },
        {
            title: 'Received',
            dataIndex: 'receivedQuantity',
            key: 'receivedQuantity',
            width: 100,
            align: 'center' as const,
            render: (val: number) => val ?? 0,
        },
        {
            title: 'Damaged',
            dataIndex: 'damagedQuantity',
            key: 'damagedQuantity',
            width: 100,
            align: 'center' as const,
            render: (val: number) => val ?? 0,
        },
        {
            title: 'Net Received',
            key: 'netReceived',
            width: 120,
            align: 'center' as const,
            render: (record: any) => {
                const net = (record.receivedQuantity || 0) - (record.damagedQuantity || 0)
                return <span className="font-semibold">{net}</span>
            },
        },
        {
            title: 'Remarks',
            dataIndex: 'remarks',
            key: 'remarks',
            render: (text: string) => text || "—",
        },
    ]

    useEffect(() => {
        getPurchaseOrders();
    }, []);

    // Calculate status based on items
    const calculateGRNStatus = (grn: GRNData | null): string => {
        if (!grn || !grn.items || grn.items.length === 0) return 'PENDING'
        
        const allItemsFullyReceived = grn.items.every((item) => {
            const net = (item.receivedQuantity || 0) - (item.damagedQuantity || 0)
            return net >= (item.orderedQuantity || 0)
        })
        
        const anyItemReceived = grn.items.some((item) => 
            (item.receivedQuantity || 0) > 0
        )
        
        if (allItemsFullyReceived) return 'COMPLETED'
        if (anyItemReceived) return 'PARTIAL'
        return 'PENDING'
    }

    const grnStatus = calculateGRNStatus(grnData)
    const statusConfig = GRN_STATUS_CONFIG[grnStatus] || GRN_STATUS_CONFIG.PENDING

    return (
        <ParentLayout title="GRN">
            <div className="flex flex-col gap-6">
                {/* page header */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                                <LuClipboardList className="text-indigo-600" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Goods Receiving Notes</h1>
                                <p className="text-sm text-gray-500">Select a purchase order to view GRN details</p>
                            </div>
                        </div>

                        {/* PO Selector */}
                        <div className="flex items-center gap-3">
                            <Select
                                placeholder="Select a purchase order..."
                                value={selectedPurchaseOrder?.id}
                                onChange={handlePOChange}
                                className="w-64"
                                size="large"
                                showSearch
                                filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                                options={purchaseOrders.map((purchaseOrder) => ({
                                    label: purchaseOrder.poNumber || `PO-${purchaseOrder.id.slice(0, 8)}`,
                                    value: purchaseOrder.id,
                                }))}
                                suffixIcon={<FiChevronDown className="text-gray-400" />}
                            />
                        </div>
                    </div>
                </div>

                {/* content area */}
                {!selectedPurchaseOrder?.id ? (
                    <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={
                            <div className="text-center">
                                <p className="text-gray-500">Select a purchase order to view GRN</p>
                                <p className="text-sm text-gray-400 mt-1">Choose a purchase order from the dropdown above</p>
                            </div>
                        } />
                    </div>
                ) : grnLoading ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="text-center py-8 text-gray-500">Loading GRN data...</div>
                    </div>
                ) : !grnData ? (
                    <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={
                            <div className="text-center">
                                <p className="text-gray-500">No GRN found for this purchase order</p>
                                <p className="text-sm text-gray-400 mt-1">Create a GRN from the Purchase Orders page</p>
                            </div>
                        } />
                    </div>
                ) : (
                    <>
                        {/* GRN Summary Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <FiPackage className="text-indigo-600" size={20} />
                                        {grnData.grnNumber || `GRN-${grnData.id.slice(0, 8)}`}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        PO: {selectedPurchaseOrder.poNumber || `PO-${selectedPurchaseOrder.id.slice(0, 8)}`}
                                    </p>
                                </div>
                                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusConfig.dotColor }}></span>
                                    {statusConfig.label}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-gray-500">Received By</span>
                                    <span className="text-sm font-medium text-gray-900">{grnData.receivedBy}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-gray-500">Received Date</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {moment(grnData.receivedDate).format('MMM DD, YYYY')}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-gray-500">Total Items</span>
                                    <span className="text-sm font-medium text-gray-900">{grnData.items?.length || 0}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-gray-500">Vendor</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {selectedPurchaseOrder.vendorName || "—"}
                                    </span>
                                </div>
                            </div>

                            {grnData.remarks && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <span className="text-xs text-gray-500">Remarks:</span>
                                    <p className="text-sm text-gray-700 mt-1">{grnData.remarks}</p>
                                </div>
                            )}

                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleViewGRN}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    <FiEye size={16} />
                                    View Details
                                </button>
                                <button
                                    onClick={openEditGRNModal}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    <FiEdit2 size={16} />
                                    Edit GRN
                                </button>
                                <button
                                    onClick={() => handlePrintGRN()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                                >
                                    <BiPrinter size={16} />
                                    Print GRN
                                </button>
                            </div>
                        </div>

                        {/* GRN Items Table */}
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900">GRN Items</h4>
                            </div>
                            <Table
                                loading={loading}
                                dataSource={grnData.items || []}
                                columns={columns}
                                pagination={false}
                                rowKey={(row: any) => row.id || row.purchaseOrderItemId}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* View GRN Modal */}
            <Modal
                title="GRN Details"
                open={viewModalOpen}
                onCancel={() => {
                    setViewModalOpen(false)
                    setViewingGRN(null)
                }}
                footer={null}
                width={800}
            >
                {viewingGRN && (
                    <div className="mt-4 space-y-6">
                        <div className="rounded-lg bg-gray-50 p-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-600">GRN Number</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {viewingGRN.grnNumber || `GRN-${viewingGRN.id.slice(0, 8)}`}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">PO Number</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {selectedPurchaseOrder?.poNumber || `PO-${viewingGRN.purchaseOrderId.slice(0, 8)}`}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Received By</div>
                                    <div className="text-base font-medium text-gray-900">{viewingGRN.receivedBy}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Received Date</div>
                                    <div className="text-base font-medium text-gray-900">
                                        {moment(viewingGRN.receivedDate).format('MMM DD, YYYY')}
                                    </div>
                                </div>
                            </div>
                            {viewingGRN.remarks && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-600">Remarks</div>
                                    <div className="text-base text-gray-900 mt-1">{viewingGRN.remarks}</div>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Items</h4>
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Item</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Unit</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Ordered</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Received</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Damaged</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Net</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {viewingGRN.items?.map((item, idx) => {
                                            const net = (item.receivedQuantity || 0) - (item.damagedQuantity || 0)
                                            return (
                                                <tr key={idx}>
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                        {item.itemName || "—"}
                                                        {item.remarks && (
                                                            <div className="text-xs text-gray-500 mt-1">{item.remarks}</div>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-600">
                                                        {item.unit || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-700">
                                                        {item.orderedQuantity ?? "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-700">
                                                        {item.receivedQuantity ?? 0}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-700">
                                                        {item.damagedQuantity ?? 0}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm font-semibold text-gray-900">
                                                        {net}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setViewModalOpen(false)
                                    setViewingGRN(null)
                                }}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handlePrintGRN(viewingGRN)}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                            >
                                <BiPrinter />
                                Print GRN
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit GRN Modal */}
            <Modal
                title="Edit GRN"
                open={editModalOpen}
                onCancel={() => {
                    setEditModalOpen(false)
                    setEditingGRN(null)
                    setEditGRNItems([])
                    editForm.resetFields()
                }}
                footer={null}
                width={1000}
            >
                {editingGRN && (
                    <Form form={editForm} layout="vertical" onFinish={handleUpdateGRN} className="mt-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <Form.Item label="PO Number">
                                <Input 
                                    value={selectedPurchaseOrder?.poNumber || `PO-${editingGRN.purchaseOrderId.slice(0, 8)}`} 
                                    disabled 
                                />
                            </Form.Item>
                            <Form.Item label="Vendor">
                                <Input value={selectedPurchaseOrder?.vendorName || "—"} disabled />
                            </Form.Item>
                            <Form.Item
                                label="Received Date"
                                name="receivedDate"
                                rules={[{ required: true, message: "Please select received date" }]}
                            >
                                <DatePicker className="w-full" />
                            </Form.Item>
                            <Form.Item
                                label="Received By"
                                name="receivedBy"
                                rules={[{ required: true, message: "Please enter who received the goods" }]}
                            >
                                <Input placeholder="Enter receiver name" />
                            </Form.Item>
                        </div>
                        <Form.Item label="Remarks" name="remarks" className="mb-4">
                            <Input.TextArea rows={2} placeholder="Overall remarks for this GRN" />
                        </Form.Item>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FiPackage size={16} className="text-gray-400" />
                                    GRN Items
                                </label>
                                <span className="text-xs text-gray-500">
                                    Update received and damaged quantities for each item
                                </span>
                            </div>

                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Item
                                            </th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">
                                                Ordered
                                            </th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">
                                                Received
                                            </th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">
                                                Damaged
                                            </th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">
                                                Net Received
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-40">
                                                Item Remarks
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {editGRNItems.map((item, index) => {
                                            const netReceived =
                                                (item.receivedQuantity || 0) - (item.damagedQuantity || 0)

                                            return (
                                                <tr key={index}>
                                                    <td className="px-3 py-2 text-sm text-gray-800">
                                                        {item.itemName}
                                                        <div className="text-xs text-gray-500">{item.unit}</div>
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-sm text-gray-600">
                                                        {item.orderedQuantity}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <InputNumber
                                                            min={0}
                                                            value={item.receivedQuantity}
                                                            onChange={(val) =>
                                                                handleEditGRNItemChange(index, "receivedQuantity", val || 0)
                                                            }
                                                            className="w-full"
                                                            size="small"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <InputNumber
                                                            min={0}
                                                            value={item.damagedQuantity}
                                                            onChange={(val) =>
                                                                handleEditGRNItemChange(index, "damagedQuantity", val || 0)
                                                            }
                                                            className="w-full"
                                                            size="small"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-sm font-medium text-gray-800">
                                                        {netReceived}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            placeholder="Item remarks"
                                                            value={item.remarks}
                                                            onChange={(e) =>
                                                                handleEditGRNItemChange(index, "remarks", e.target.value)
                                                            }
                                                            size="small"
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditModalOpen(false)
                                    setEditingGRN(null)
                                    setEditGRNItems([])
                                    editForm.resetFields()
                                }}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={editLoading}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                            >
                                {editLoading ? "Updating..." : "Update GRN"}
                            </button>
                        </div>
                    </Form>
                )}
            </Modal>
        </ParentLayout>
    )
}


export { GRN }
