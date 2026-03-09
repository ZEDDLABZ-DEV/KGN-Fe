/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { ParentLayout } from '../../layout/ParentLayout';
import { Request } from '../../utils/Request';
import { Skeleton, Empty } from 'antd';
import toast from 'react-hot-toast';
import {
  FiPackage,
  FiShoppingCart,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiArrowRight,
} from 'react-icons/fi';
import { MdOutlineRequestPage } from 'react-icons/md';

interface ProcurementStats {
  materialRequests?: {
    total?: number;
    pending?: number;
    approved?: number;
    rejected?: number;
    fulfilled?: number;
    byStatus?: Record<string, number>;
  };
  purchaseOrders?: {
    total?: number;
    draft?: number;
    sent?: number;
    received?: number;
    totalAmount?: number;
    byStatus?: Record<string, number>;
  };
  grns?: {
    total?: number;
    pending?: number;
    completed?: number;
    partial?: number;
    byStatus?: Record<string, number>;
  };
  pipeline?: {
    pendingApproval?: number; // MRs awaiting approval
    awaitingPO?: number; // Approved MRs without PO
    awaitingDelivery?: number; // POs sent, awaiting delivery
    awaitingInspection?: number; // POs received, awaiting GRN
  };
}

const Procurement = () => {
  const [stats, setStats] = useState<ProcurementStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProcurementStats = async () => {
    setLoading(true);
    try {
      const response: any = await Request.get('/v1/api/dashboard/procurement');
      const data = response?.data || response || {};
      setStats(data);
    } catch (error) {
      console.error('Failed to load procurement stats:', error);
      toast.error('Failed to load procurement statistics');
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcurementStats();
  }, []);

  // Helper to format currency
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return '₹0';
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Helper to get status count
  const getStatusCount = (byStatus: Record<string, number> | undefined, status: string): number => {
    if (!byStatus) return 0;
    return byStatus[status] || byStatus[status.toUpperCase()] || 0;
  };

  // Calculate pipeline counts from stats
  const pipelineCounts = {
    pendingApproval: stats?.pipeline?.pendingApproval || getStatusCount(stats?.materialRequests?.byStatus, 'PENDING'),
    awaitingPO: stats?.pipeline?.awaitingPO || (getStatusCount(stats?.materialRequests?.byStatus, 'APPROVED') - (stats?.purchaseOrders?.total || 0)),
    awaitingDelivery: stats?.pipeline?.awaitingDelivery || getStatusCount(stats?.purchaseOrders?.byStatus, 'SENT'),
    awaitingInspection: stats?.pipeline?.awaitingInspection || getStatusCount(stats?.purchaseOrders?.byStatus, 'RECEIVED'),
  };

  // Pipeline steps
  const pipelineSteps = [
    {
      id: 'pendingApproval',
      title: 'Pending Approval',
      description: 'Material Requests',
      count: pipelineCounts.pendingApproval,
      icon: FiClock,
      color: 'amber',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
    },
    {
      id: 'awaitingPO',
      title: 'Awaiting PO',
      description: 'Approved MRs',
      count: Math.max(0, pipelineCounts.awaitingPO),
      icon: FiPackage,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
    },
    {
      id: 'awaitingDelivery',
      title: 'Awaiting Delivery',
      description: 'POs Sent',
      count: pipelineCounts.awaitingDelivery,
      icon: FiShoppingCart,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
    },
    {
      id: 'awaitingInspection',
      title: 'Awaiting Inspection',
      description: 'POs Received',
      count: pipelineCounts.awaitingInspection,
      icon: FiFileText,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
    },
  ];

  return (
    <ParentLayout title="Procurement Pipeline">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <FiTrendingUp className="text-indigo-600" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Procurement Pipeline</h1>
              <p className="text-sm text-gray-500">Track the flow from Material Requests to GRN</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton active paragraph={{ rows: 4 }} />
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ) : (
          <>
            {/* Pipeline Flow Visualization */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Pipeline Flow</h2>
              <div className="flex items-center justify-between gap-4">
                {pipelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex-1 flex items-center">
                      {/* Step Card */}
                      <div className={`flex-1 rounded-lg border-2 ${step.borderColor} ${step.bgColor} p-4 text-center transition-all hover:shadow-md`}>
                        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${step.bgColor} mb-3`}>
                          <Icon className={step.textColor} size={24} />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{step.count}</div>
                        <div className="text-sm font-semibold text-gray-700 mb-1">{step.title}</div>
                        <div className="text-xs text-gray-500">{step.description}</div>
                      </div>
                      {/* Arrow */}
                      {index < pipelineSteps.length - 1 && (
                        <div className="mx-2 flex items-center">
                          <FiArrowRight className="text-gray-400" size={24} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Material Requests Stats */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                    <MdOutlineRequestPage className="text-orange-600" size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Material Requests</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      {stats?.materialRequests?.total || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-base font-semibold text-amber-600">
                      {stats?.materialRequests?.pending || getStatusCount(stats?.materialRequests?.byStatus, 'PENDING')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Approved</span>
                    <span className="text-base font-semibold text-emerald-600">
                      {stats?.materialRequests?.approved || getStatusCount(stats?.materialRequests?.byStatus, 'APPROVED')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Fulfilled</span>
                    <span className="text-base font-semibold text-blue-600">
                      {stats?.materialRequests?.fulfilled || getStatusCount(stats?.materialRequests?.byStatus, 'FULFILLED')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purchase Orders Stats */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                    <FiShoppingCart className="text-indigo-600" size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Purchase Orders</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      {stats?.purchaseOrders?.total || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Draft</span>
                    <span className="text-base font-semibold text-gray-600">
                      {stats?.purchaseOrders?.draft || getStatusCount(stats?.purchaseOrders?.byStatus, 'DRAFT')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sent</span>
                    <span className="text-base font-semibold text-purple-600">
                      {stats?.purchaseOrders?.sent || getStatusCount(stats?.purchaseOrders?.byStatus, 'SENT')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Received</span>
                    <span className="text-base font-semibold text-emerald-600">
                      {stats?.purchaseOrders?.received || getStatusCount(stats?.purchaseOrders?.byStatus, 'RECEIVED')}
                    </span>
                  </div>
                  {stats?.purchaseOrders?.totalAmount && (
                    <div className="pt-3 mt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Total Amount</span>
                        <span className="text-base font-bold text-indigo-600">
                          {formatCurrency(stats.purchaseOrders.totalAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* GRNs Stats */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                    <FiFileText className="text-emerald-600" size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Goods Receiving Notes</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      {stats?.grns?.total || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-base font-semibold text-amber-600">
                      {stats?.grns?.pending || getStatusCount(stats?.grns?.byStatus, 'PENDING')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Partial</span>
                    <span className="text-base font-semibold text-orange-600">
                      {stats?.grns?.partial || getStatusCount(stats?.grns?.byStatus, 'PARTIAL')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-base font-semibold text-emerald-600">
                      {stats?.grns?.completed || getStatusCount(stats?.grns?.byStatus, 'COMPLETED')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                    <FiClock className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {pipelineCounts.pendingApproval}
                    </p>
                    <p className="text-xs text-gray-500">Pending Approval</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <FiPackage className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.max(0, pipelineCounts.awaitingPO)}
                    </p>
                    <p className="text-xs text-gray-500">Awaiting PO</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                    <FiShoppingCart className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {pipelineCounts.awaitingDelivery}
                    </p>
                    <p className="text-xs text-gray-500">Awaiting Delivery</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                    <FiFileText className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {pipelineCounts.awaitingInspection}
                    </p>
                    <p className="text-xs text-gray-500">Awaiting Inspection</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ParentLayout>
  );
};

export { Procurement };
