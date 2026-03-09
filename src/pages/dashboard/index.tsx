import { useEffect, useState } from 'react';
import { ParentLayout } from '../../layout/ParentLayout';
import { Request } from '../../utils/Request';
import { Skeleton, Empty } from 'antd';
import toast from 'react-hot-toast';
import moment from 'moment';
import {
  FiPackage,
  FiClipboard,
  FiShoppingCart,
  FiFileText,
  FiBox,
  FiUser,
  FiCheckCircle,
  FiActivity,
  FiClock,
  FiArrowRight,
  FiTrendingUp,
  FiUsers,
  FiAlertCircle,
} from 'react-icons/fi';

interface DashboardStats {
  overview?: {
    projects?: {
      total?: number;
      active?: number;
    };
    tasks?: {
      total?: number;
      completed?: number;
      overdue?: number;
    };
    teams?: number;
    labours?: number;
    users?: number;
    vendors?: number;
  };
  procurement?: {
    pipeline?: {
      pendingApproval?: number;
      awaitingPO?: number;
      draftPOs?: number;
      awaitingDelivery?: number;
      awaitingInspection?: number;
      completedGRNs?: number;
    };
    totalPOAmount?: number;
  };
  inventory?: {
    totalItems?: number;
    lowStockCount?: number;
    lowStockItems?: Array<{
      itemName?: string;
      quantity?: number;
      minimumQuantity?: number;
      unit?: string;
    }>;
  };
  recentProjects?: Array<{
    name?: string;
    status?: string;
    manager?: any;
    _count?: any;
  }>;
  upcomingTasks?: Array<{
    name?: string;
    dueDate?: string;
    isOverdue?: boolean;
    priority?: string;
    assignedTo?: any;
  }>;
}

interface RecentActivity {
  id: string;
  type: string; // 'PROJECT', 'TASK', 'MATERIAL_REQUEST', 'PURCHASE_ORDER', 'GRN', 'INVENTORY', etc.
  action: string; // 'CREATED', 'UPDATED', 'COMPLETED', 'APPROVED', etc.
  title: string;
  description?: string;
  entityId?: string;
  entityName?: string;
  user?: {
    id: string;
    name: string;
  };
  createdAt: string;
  metadata?: Record<string, any>;
}


const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response: any = await Request.get('/v1/api/dashboard/stats');
      // Handle both response.data and direct response
      const data = response?.data || response || {};
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
      // Set default empty stats on error
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    setActivitiesLoading(true);
    try {
      const response: any = await Request.get('/v1/api/dashboard/recent-activity');
      // Handle both response.data and direct response
      const data = response?.data || response || [];
      setRecentActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load recent activities:', error);
      // Don't show toast for activities, just log
      setRecentActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivities();
  }, []);

  // Helper to format currency
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return '₹0';
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Helper to format relative time
  const formatRelativeTime = (date: string): string => {
    return moment(date).fromNow();
  };

  // Helper to get activity icon and color
  const getActivityConfig = (type: string, action: string) => {
    const typeUpper = type?.toUpperCase() || '';
    const actionUpper = action?.toUpperCase() || '';

    // Icon mapping
    const iconMap: Record<string, any> = {
      PROJECT: FiClipboard,
      TASK: FiCheckCircle,
      MATERIAL_REQUEST: FiPackage,
      PURCHASE_ORDER: FiShoppingCart,
      GRN: FiFileText,
      INVENTORY: FiBox,
      USER: FiUser,
      TEAM: FiUser,
      VENDOR: FiUser,
    };

    // Color mapping based on action - all black and white
    const colorMap: Record<string, string> = {
      CREATED: 'text-gray-900 bg-gray-100',
      UPDATED: 'text-gray-900 bg-gray-100',
      COMPLETED: 'text-gray-900 bg-gray-100',
      APPROVED: 'text-gray-900 bg-gray-100',
      REJECTED: 'text-gray-900 bg-gray-100',
      DELETED: 'text-gray-900 bg-gray-100',
    };

    const Icon = iconMap[typeUpper] || FiActivity;
    const colorClass = colorMap[actionUpper] || 'text-gray-900 bg-gray-100';

    return { Icon, colorClass };
  };

  // Helper to safely convert value to string
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      // If it's an object, try to get a meaningful string representation
      if (value.itemName) return value.itemName;
      if (value.name) return value.name;
      if (value.title) return value.title;
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Helper to format activity message
  const formatActivityMessage = (activity: RecentActivity): string => {
    const action = activity.action?.toLowerCase() || 'updated';
    const entityName = safeString(activity.entityName || activity.title || 'item');
    return `${action} ${entityName}`;
  };

  // Calculate pipeline counts from stats
  const pipelineCounts = {
    pendingApproval: stats?.procurement?.pipeline?.pendingApproval || 0,
    awaitingPO: stats?.procurement?.pipeline?.awaitingPO || 0,
    draftPOs: stats?.procurement?.pipeline?.draftPOs || 0,
    awaitingDelivery: stats?.procurement?.pipeline?.awaitingDelivery || 0,
    awaitingInspection: stats?.procurement?.pipeline?.awaitingInspection || 0,
    completedGRNs: stats?.procurement?.pipeline?.completedGRNs || 0,
  };

  // Pipeline steps
  const pipelineSteps = [
    {
      id: 'pendingApproval',
      title: 'Pending Approval',
      description: 'Material Requests',
      count: pipelineCounts.pendingApproval,
      icon: FiClock,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-900',
      borderColor: 'border-gray-300',
    },
    {
      id: 'awaitingPO',
      title: 'Awaiting PO',
      description: 'Approved MRs',
      count: pipelineCounts.awaitingPO,
      icon: FiPackage,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-900',
      borderColor: 'border-gray-300',
    },
    {
      id: 'draftPOs',
      title: 'Draft POs',
      description: 'In Progress',
      count: pipelineCounts.draftPOs,
      icon: FiFileText,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-900',
      borderColor: 'border-gray-300',
    },
    {
      id: 'awaitingDelivery',
      title: 'Awaiting Delivery',
      description: 'POs Sent',
      count: pipelineCounts.awaitingDelivery,
      icon: FiShoppingCart,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-900',
      borderColor: 'border-gray-300',
    },
    {
      id: 'awaitingInspection',
      title: 'Awaiting Inspection',
      description: 'POs Received',
      count: pipelineCounts.awaitingInspection,
      icon: FiFileText,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-900',
      borderColor: 'border-gray-300',
    },
    {
      id: 'completedGRNs',
      title: 'Completed GRNs',
      description: 'Finished',
      count: pipelineCounts.completedGRNs,
      icon: FiCheckCircle,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-900',
      borderColor: 'border-gray-300',
    },
  ];

  // Define stat cards with dynamic data from API
  const statCards = [
    {
      title: 'Total Projects',
      value: stats?.overview?.projects?.total || 0,
      subtitle: stats?.overview?.projects?.active ? `${stats.overview.projects.active} Active` : 'All Projects',
      icon: FiClipboard,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-900',
      key: 'projects',
    },
    {
      title: 'Total Tasks',
      value: stats?.overview?.tasks?.total || 0,
      subtitle: stats?.overview?.tasks?.overdue ? `${stats.overview.tasks.overdue} Overdue` : stats?.overview?.tasks?.completed ? `${stats.overview.tasks.completed} Completed` : 'All Tasks',
      icon: FiCheckCircle,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-900',
      warning: stats?.overview?.tasks?.overdue ? stats.overview.tasks.overdue : undefined,
      key: 'tasks',
    },
    {
      title: 'Inventory Items',
      value: stats?.inventory?.totalItems || 0,
      subtitle: stats?.inventory?.lowStockCount ? `${stats.inventory.lowStockCount} Low Stock` : 'All Items',
      icon: FiBox,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-900',
      warning: stats?.inventory?.lowStockCount ? stats.inventory.lowStockCount : undefined,
      key: 'inventory',
    },
    {
      title: 'Purchase Orders',
      value: pipelineCounts.draftPOs + pipelineCounts.awaitingDelivery + pipelineCounts.awaitingInspection,
      subtitle: stats?.procurement?.totalPOAmount ? formatCurrency(stats.procurement.totalPOAmount) : 'All Orders',
      icon: FiShoppingCart,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-900',
      key: 'purchaseOrders',
    },
  ];

  // Additional quick stats
  const quickStats = [
    {
      label: 'Teams',
      value: stats?.overview?.teams || 0,
      icon: FiUsers,
      color: 'text-gray-900',
      bgColor: 'bg-gray-100',
    },
    {
      label: 'Users',
      value: stats?.overview?.users || 0,
      icon: FiUser,
      color: 'text-gray-900',
      bgColor: 'bg-gray-100',
    },
    {
      label: 'Labours',
      value: stats?.overview?.labours || 0,
      icon: FiUser,
      color: 'text-gray-900',
      bgColor: 'bg-gray-100',
    },
    {
      label: 'Vendors',
      value: stats?.overview?.vendors || 0,
      icon: FiUsers,
      color: 'text-gray-900',
      bgColor: 'bg-gray-100',
    },
  ];

  return (
    <ParentLayout title="Dashboard">
      <div className="flex flex-col gap-6">
        {/* Welcome Header */}
        <div className="rounded-2xl bg-black p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
              <p className="text-gray-300">Welcome back! Here's what's happening today.</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
                <div className="text-sm text-gray-300 mb-1">Total Value</div>
                <div className="text-2xl font-bold">
                  {stats?.procurement?.totalPOAmount ? formatCurrency(stats.procurement.totalPOAmount) : '₹0'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton.Button
                key={i}
                active
                style={{ width: '100%', height: '140px', borderRadius: '16px' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${card.bgColor}`}>
                        <Icon className={`${card.iconColor} text-xl`} />
                      </div>
                      {card.warning && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-200 text-gray-900 text-xs font-semibold">
                          <FiAlertCircle size={12} />
                          {card.warning}
                        </div>
                      )}
                    </div>
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                    </div>
                    <p className="text-xs text-gray-500">{card.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Stats Row */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`${stat.color} text-lg`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Procurement Pipeline Section */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white shadow-md">
                <FiTrendingUp size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Procurement Pipeline</h2>
                <p className="text-sm text-gray-600">Track the flow from Material Requests to GRN</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 overflow-x-auto">
                {pipelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex-1 flex items-center w-full md:w-auto">
                      <div className={`flex-1 rounded-xl border-2 ${step.borderColor} ${step.bgColor} p-5 text-center transition-all hover:shadow-lg hover:scale-105`}>
                        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${step.bgColor} mb-3 shadow-sm`}>
                          <Icon className={step.textColor} size={24} />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-2">{step.count}</div>
                        <div className="text-sm font-semibold text-gray-700 mb-1">{step.title}</div>
                        <div className="text-xs text-gray-500">{step.description}</div>
                      </div>
                      {index < pipelineSteps.length - 1 && (
                        <div className="mx-3 hidden md:flex items-center">
                          <FiArrowRight className="text-gray-400" size={24} />
                        </div>
                      )}
                      {index < pipelineSteps.length - 1 && (
                        <div className="my-3 md:hidden w-full flex items-center justify-center">
                          <FiArrowRight className="text-gray-400 rotate-90" size={24} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Projects and Upcoming Tasks Grid */}
        {!loading && (stats?.recentProjects?.length || stats?.upcomingTasks?.length) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Projects */}
            {stats?.recentProjects && stats.recentProjects.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
                      <FiClipboard size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
                      <p className="text-sm text-gray-600">Latest project updates</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {stats.recentProjects.slice(0, 5).map((project, index) => (
                    <div
                      key={index}
                      className="p-5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            {safeString(project.name)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-900">
                              {safeString(project.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Tasks */}
            {stats?.upcomingTasks && stats.upcomingTasks.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
                      <FiCheckCircle size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Upcoming Tasks</h2>
                      <p className="text-sm text-gray-600">Tasks requiring attention</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {stats.upcomingTasks.slice(0, 5).map((task, index) => (
                    <div
                      key={index}
                      className={`p-5 hover:bg-gray-50 transition-colors ${task.isOverdue ? 'bg-gray-100' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {safeString(task.name)}
                            </p>
                            {task.isOverdue && (
                              <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-900 text-xs font-medium">
                                Overdue
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <FiClock size={12} />
                                {moment(task.dueDate).format('MMM DD, YYYY')}
                              </span>
                            )}
                            {task.priority && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-900">
                                {safeString(task.priority)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity Section */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
                  <FiActivity size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-600">Latest updates across the system</p>
                </div>
              </div>
            </div>
          </div>

          {activitiesLoading ? (
            <div className="p-6">
              <Skeleton active paragraph={{ rows: 5 }} />
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="p-12">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No recent activity"
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentActivities.slice(0, 10).map((activity) => {
                const { Icon, colorClass } = getActivityConfig(activity.type, activity.action);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-5 hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colorClass} shadow-sm`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {safeString(activity.title) || formatActivityMessage(activity)}
                            </p>
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 uppercase tracking-wider">
                              {safeString(activity.type)}
                            </span>
                          </div>
                          {activity.description && (
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                              {safeString(activity.description)}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            {activity.user && (
                              <span className="flex items-center gap-1.5">
                                <FiUser size={12} />
                                <span className="font-medium">{activity.user.name}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <FiClock size={12} />
                              {formatRelativeTime(activity.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ParentLayout>
  );
};

export { Dashboard };