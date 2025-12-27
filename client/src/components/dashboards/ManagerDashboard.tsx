import React, { useEffect, useState } from 'react';
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ChartBarIcon,
  PlusIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { dashboardAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Badge from '../common/Badge';
import CreateRequestModal from '../modals/CreateRequestModal';
import ScheduleMaintenanceModal from '../modals/ScheduleMaintenanceModal';
import { formatNumber, formatRelativeTime, getStatusColor, getPriorityColor } from '../../utils/helpers';
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
  requestsByStatus: Record<string, number>;
  requestsByPriority: Record<string, number>;
}

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [showScheduleMaintenanceModal, setShowScheduleMaintenanceModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Fetch data filtered by manager's team if applicable
      const params = user?.team_id ? { team_id: user.team_id } : {};
      const response = await dashboardAPI.getOverview(params);
      setDashboardData(response);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRequest = () => {
    setShowCreateRequestModal(true);
  };

  const handleScheduleMaintenance = () => {
    setShowScheduleMaintenanceModal(true);
  };

  const handleAssignTeamMembers = () => {
    navigate('/teams');
  };

  const handleViewTeamPerformance = () => {
    navigate('/reports?tab=team-performance');
  };

  const handleRequestSuccess = () => {
    fetchDashboardData(); // Refresh dashboard data
    toast.success('Request created successfully!');
  };

  const handleMaintenanceSuccess = () => {
    fetchDashboardData(); // Refresh dashboard data
    toast.success('Maintenance scheduled successfully!');
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

  const { overview, recentActivity, requestsByStatus, requestsByPriority } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Manager Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manager Dashboard</h1>
            <p className="mt-1 text-blue-100">
              Team management and operational oversight
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{overview.totalRequests}</div>
              <div className="text-sm text-blue-100">Team Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{overview.overdueRequests}</div>
              <div className="text-sm text-blue-100">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Manager Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Team Equipment
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
                    Active Requests
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {(requestsByStatus.new || 0) + (requestsByStatus.in_progress || 0)}
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
                    Overdue Tasks
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
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completion Rate
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {overview.totalRequests > 0 ? Math.round(((requestsByStatus.repaired || 0) / overview.totalRequests) * 100) : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manager Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Management */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Request Management</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {/* Request Status Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{requestsByStatus.new || 0}</div>
                  <div className="text-sm text-blue-800">New Requests</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{requestsByStatus.in_progress || 0}</div>
                  <div className="text-sm text-yellow-800">In Progress</div>
                </div>
              </div>
              
              {/* Priority Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Priority Breakdown</h4>
                {Object.entries(requestsByPriority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
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
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Manager Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Manager Actions</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <button 
                onClick={handleCreateRequest}
                className="w-full btn-primary flex items-center justify-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Maintenance Request
              </button>
              <button 
                onClick={handleScheduleMaintenance}
                className="w-full btn-outline flex items-center justify-center"
              >
                <CalendarIcon className="w-5 h-5 mr-2" />
                Schedule Preventive Maintenance
              </button>
              <button 
                onClick={handleAssignTeamMembers}
                className="w-full btn-outline flex items-center justify-center"
              >
                <UserGroupIcon className="w-5 h-5 mr-2" />
                Assign Team Members
              </button>
              <button 
                onClick={handleViewTeamPerformance}
                className="w-full btn-outline flex items-center justify-center"
              >
                <ChartBarIcon className="w-5 h-5 mr-2" />
                View Team Performance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Team Activity & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Team Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Team Activity</h3>
          </div>
          <div className="card-body">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400 mt-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {request.subject}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.equipment?.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(request.status)} size="sm">
                          {request.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {request.created_at ? formatRelativeTime(request.created_at) : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardDocumentListIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No recent team activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Team Performance</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Average Resolution Time</span>
                <span className="text-sm font-bold text-gray-900">{formatNumber(overview.avgResolutionTime, 1)}h</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                <span className="text-sm font-bold text-green-600">
                  {overview.totalRequests > 0 ? Math.round(((requestsByStatus.repaired || 0) / overview.totalRequests) * 100) : 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">On-Time Delivery</span>
                <span className="text-sm font-bold text-blue-600">
                  {overview.totalRequests > 0 ? Math.round(((overview.totalRequests - overview.overdueRequests) / overview.totalRequests) * 100) : 100}%
                </span>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3 pt-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Completed Tasks</span>
                    <span>{requestsByStatus.repaired || 0}/{overview.totalRequests}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${overview.totalRequests > 0 ? ((requestsByStatus.repaired || 0) / overview.totalRequests) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>In Progress</span>
                    <span>{requestsByStatus.in_progress || 0}/{overview.totalRequests}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ 
                        width: `${overview.totalRequests > 0 ? ((requestsByStatus.in_progress || 0) / overview.totalRequests) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateRequestModal
        isOpen={showCreateRequestModal}
        onClose={() => setShowCreateRequestModal(false)}
        onSuccess={handleRequestSuccess}
      />

      <ScheduleMaintenanceModal
        isOpen={showScheduleMaintenanceModal}
        onClose={() => setShowScheduleMaintenanceModal(false)}
        onSuccess={handleMaintenanceSuccess}
      />
    </div>
  );
};

export default ManagerDashboard;