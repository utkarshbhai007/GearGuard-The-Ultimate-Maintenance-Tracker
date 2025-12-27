import React, { useEffect, useState } from 'react';
import {
  CogIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { dashboardAPI } from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Badge from '../common/Badge';
import AddEquipmentModal from '../modals/AddEquipmentModal';
import CreateRequestModal from '../modals/CreateRequestModal';
import ManageTeamsModal from '../modals/ManageTeamsModal';
import { formatNumber, formatRelativeTime, getStatusColor } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface DashboardData {
  overview: {
    totalEquipment: number;
    totalRequests: number;
    overdueRequests: number;
    avgResolutionTime: number;
  };
  recentActivity: any[];
  equipmentByStatus: Record<string, number>;
  requestsByStatus: Record<string, number>;
  requestsByPriority: Record<string, number>;
  monthlyTrends: any[];
}

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [showManageTeamsModal, setShowManageTeamsModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await dashboardAPI.getOverview();
      setDashboardData(response);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEquipment = () => {
    setShowAddEquipmentModal(true);
  };

  const handleManageTeams = () => {
    setShowManageTeamsModal(true);
  };

  const handleViewReports = () => {
    navigate('/reports');
  };

  const handleCostAnalysis = () => {
    navigate('/reports?tab=cost-analysis');
  };

  const handleEquipmentSuccess = () => {
    fetchDashboardData(); // Refresh dashboard data
    toast.success('Equipment added successfully!');
  };

  const handleRequestSuccess = () => {
    fetchDashboardData(); // Refresh dashboard data
    toast.success('Request created successfully!');
  };

  const handleTeamsSuccess = () => {
    fetchDashboardData(); // Refresh dashboard data
    toast.success('Teams updated successfully!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No data available</h3>
        <button onClick={fetchDashboardData} className="mt-4 btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const { overview, recentActivity, equipmentByStatus, requestsByStatus, requestsByPriority } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="mt-1 text-red-100">
              Complete system overview and management controls
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{overview.totalEquipment}</div>
              <div className="text-sm text-red-100">Total Assets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{overview.totalRequests}</div>
              <div className="text-sm text-red-100">All Requests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CogIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Equipment
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {overview.totalEquipment}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Requests
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {overview.totalRequests}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Overdue Requests
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {overview.overdueRequests}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Resolution Time
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {formatNumber(overview.avgResolutionTime, 1)}h
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Equipment Status</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {Object.entries(equipmentByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge className={getStatusColor(status)} size="sm">
                      {status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Request Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Request Status</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {Object.entries(requestsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge className={getStatusColor(status)} size="sm">
                      {status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Priority Distribution</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {Object.entries(requestsByPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge 
                      className={
                        priority === 'critical' ? 'bg-red-100 text-red-800' :
                        priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      } 
                      size="sm"
                    >
                      {priority}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Admin Actions</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <button 
                onClick={handleAddEquipment}
                className="w-full btn-primary flex items-center justify-center"
              >
                <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                Add New Equipment
              </button>
              <button 
                onClick={handleManageTeams}
                className="w-full btn-outline flex items-center justify-center"
              >
                <UserGroupIcon className="w-5 h-5 mr-2" />
                Manage Teams
              </button>
              <button 
                onClick={handleViewReports}
                className="w-full btn-outline flex items-center justify-center"
              >
                <ChartBarIcon className="w-5 h-5 mr-2" />
                View System Reports
              </button>
              <button 
                onClick={handleCostAnalysis}
                className="w-full btn-outline flex items-center justify-center"
              >
                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                Cost Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent System Activity</h3>
          </div>
          <div className="card-body">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        request.status === 'new' ? 'bg-blue-400' :
                        request.status === 'in_progress' ? 'bg-yellow-400' :
                        request.status === 'repaired' ? 'bg-green-400' :
                        'bg-red-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {request.subject}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.equipment?.name} • {request.creator?.first_name} {request.creator?.last_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {request.created_at ? formatRelativeTime(request.created_at) : 'Unknown'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge className={getStatusColor(request.status)} size="sm">
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardDocumentListIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Health Indicators */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {overview.totalEquipment > 0 ? Math.round(((overview.totalEquipment - (equipmentByStatus.out_of_order || 0)) / overview.totalEquipment) * 100) : 100}%
              </div>
              <div className="text-sm text-gray-500">Equipment Operational</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {overview.totalRequests > 0 ? Math.round(((requestsByStatus.repaired || 0) / overview.totalRequests) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-500">Requests Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {formatNumber(overview.avgResolutionTime, 1)}h
              </div>
              <div className="text-sm text-gray-500">Average Response Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEquipmentModal
        isOpen={showAddEquipmentModal}
        onClose={() => setShowAddEquipmentModal(false)}
        onSuccess={handleEquipmentSuccess}
      />

      <CreateRequestModal
        isOpen={showCreateRequestModal}
        onClose={() => setShowCreateRequestModal(false)}
        onSuccess={handleRequestSuccess}
      />

      <ManageTeamsModal
        isOpen={showManageTeamsModal}
        onClose={() => setShowManageTeamsModal(false)}
        onSuccess={handleTeamsSuccess}
      />
    </div>
  );
};

export default AdminDashboard;