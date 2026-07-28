import { Empty, Skeleton, Table } from "antd"
import type { GRNSummaryItem } from "../../hooks/useGRN"

interface GRNSummaryTableProps {
  summary: GRNSummaryItem[] | null
  loading?: boolean
}

/** Item Summary table — always sourced directly from the backend `summary`, never derived locally. */
export const GRNSummaryTable = ({ summary, loading }: GRNSummaryTableProps) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    )
  }

  const columns = [
    { title: "Item", dataIndex: "itemName", key: "itemName", render: (v: string) => v || "—" },
    { title: "Unit", dataIndex: "unit", key: "unit", width: 100, render: (v: string) => v || "—" },
    { title: "Ordered", dataIndex: "orderedQuantity", key: "orderedQuantity", width: 100, align: "center" as const },
    { title: "Received", dataIndex: "receivedQuantity", key: "receivedQuantity", width: 100, align: "center" as const },
    { title: "Damaged", dataIndex: "damagedQuantity", key: "damagedQuantity", width: 100, align: "center" as const },
    {
      title: "Pending",
      dataIndex: "pendingQuantity",
      key: "pendingQuantity",
      width: 100,
      align: "center" as const,
      render: (v: number) => <span className={v > 0 ? "font-semibold text-orange-600" : "text-gray-400"}>{v}</span>,
    },
  ]

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-900">Item Summary</h4>
      </div>
      <Table
        dataSource={summary || []}
        columns={columns}
        rowKey="itemId"
        pagination={false}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No items on this purchase order" /> }}
      />
    </div>
  )
}
