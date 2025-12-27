import React, { useEffect, useState } from 'react';
import {
  WrenchScrewdriverIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CogIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { requestsAPI, dashboardAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { MaintenanceRequest } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import Badge from '../common/Badge';
import WorkHoursModal from '../modals/WorkHoursModal';
import UpdateTaskModal from '../modals/UpdateTaskModal';
import { formatRelativeTime, getStatusColor, getPriorityColor, isOverdue } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TechnicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState<MaintenanceRequest[]>([]);
  const [todayTasks, setTodayTasks] = useState<MaintenanceRequest[]>([]);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showWorkHoursModal, setShowWorkHoursModal] = useState(false);
  const [showUpdateTaskModal, setShowUpdateTaskModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTechnicianData();
  }, []);

  const fetchTechnicianData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tasks assigned to this technician
      const tasksResponse = await requestsAPI.getAll({ 
        assigned_to: user?.id,
        status: ['new', 'in_progress']
      });
      
      const tasks = tasksResponse.requests || [];
      setMyTasks(tasks);
      
      // Filter today's scheduled tasks
      const today = new Date().toDateString();
      const todayScheduled = tasks.filter(task => 
        task.scheduled_date && new Date(task.scheduled_date).toDateString() === today
      );
      setTodayTasks(todayScheduled);
      
      // Calculate stats
      const totalAssigned = tasks.length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      const completed = tasks.filter(t => t.status === 'repaired').length;
      const overdue = tasks.filter(t => 
        t.scheduled_date && isOverdue(t.scheduled_date) && t.status !== 'repaired'
      ).length;
      
      setStats({ totalAssigned, inProgress, completed, overdue });
      
    } catch (error: any) {
      console.error('Failed to fetch technician data:', error);
      toast.error('Failed to load your tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTask = async (taskId: number) => {
    try {
      await requestsAPI.updateStatus(taskId, 'in_progress');
      toast.success('Task started!');
      fetchTechnicianData();
    } catch (error) {
      toast.error('Failed to start task');
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await requestsAPI.updateStatus(taskId, 'repaired');
      toast.success('Task completed!');
      fetchTechnicianData();
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleUpdateTaskStatus = () => {
    setShowUpdateTaskModal(true);
  };

  const handleLogWorkHours = () => {
    setShowWorkHoursModal(true);
  };

  const handleViewEquipmentDetails = () => {
    navigate('/equipment');
  };

  const handleCheckSchedule = () => {
    navigate('/calendar');
  };

  const handleWorkHoursSuccess = () => {
    fetchTechnicianData(); // Refresh dashboard data
  };

  const handleUpdateTaskSuccess = () => {
    fetchTechnicianData(); // Refresh dashboard data
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <ClockIcon className="w-4 h-4" />;
      case 'in_progress':
        return <PlayIcon className="w-4 h-4" />;
      case 'on_hold':
        return <PauseIcon className="w-4 h-4" />;
      case 'repaired':
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high' || priority === 'critical') {
      return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Technician Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Workspace</h1>
            <p className="mt-1 text-green-100">
              Your assigned tasks and maintenance activities
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalAssigned}</div>
              <div className="text-sm text-green-100">My Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{todayTasks.length}</div>
              <div className="text-sm text-green-100">Today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Technician Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Assigned Tasks
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.totalAssigned}
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
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    In Progress
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.inProgress}
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
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.completed}
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
                    Overdue
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.overdue}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      {todayTasks.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Today's Schedule</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {todayTasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.subject}</h4>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <CogIcon className="w-4 h-4 mr-1" />
                          {task.equipment?.name}
                        </div>
                        <Badge className={getPriorityColor(task.priority)} size="sm">
                          {task.priority}
                        </Badge>
                        <Badge variant="primary" size="sm">
                          {task.request_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.status === 'new' && (
                        <button
                          onClick={() => handleStartTask(task.id)}
                          className="btn-primary btn-sm flex items-center"
                        >
                          <PlayIcon className="w-4 h-4 mr-1" />
                          Start
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="btn-success btn-sm flex items-center"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* My Tasks - Enhanced Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tasks - Main Section */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <WrenchScrewdriverIcon className="w-6 h-6 text-blue-600 mr-2" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">My Tasks</h3>
                    <p className="text-sm text-gray-500">Manage your assigned maintenance tasks</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {myTasks.length} active task{myTasks.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={handleUpdateTaskStatus}
                    className="btn-primary btn-sm flex items-center"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Update Tasks
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {myTasks.length > 0 ? (
                <div className="space-y-4">
                  {myTasks.filter(task => task.status !== 'repaired').slice(0, 6).map((task) => (
                    <div key={task.id} className="group relative border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                      {/* Priority Indicator */}
                      {(task.priority === 'high' || task.priority === 'critical') && (
                        <div className="absolute top-3 right-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {task.subject}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {task.equipment?.name} • {task.equipment?.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
                          </div>
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {getPriorityIcon(task.priority)}
                            <span className={getPriorityIcon(task.priority) ? 'ml-1' : ''}>{task.priority}</span>
                          </div>
                          {task.scheduled_date && isOverdue(task.scheduled_date) && task.status !== 'repaired' && (
                            <Badge variant="danger" size="sm">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{task.completion_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              (task.completion_percentage || 0) === 100 
                                ? 'bg-green-500' 
                                : (task.completion_percentage || 0) >= 50 
                                  ? 'bg-blue-500' 
                                  : 'bg-yellow-500'
                            }`}
                            style={{ width: `${task.completion_percentage || 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {task.created_at ? formatRelativeTime(task.created_at) : 'Unknown'}
                        </div>
                        <div className="flex items-center space-x-2">
                          {task.status === 'new' && (
                            <button
                              onClick={() => handleStartTask(task.id)}
                              className="btn-primary btn-sm flex items-center"
                            >
                              <PlayIcon className="w-3 h-3 mr-1" />
                              Start
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            <button
                              onClick={() => handleCompleteTask(task.id)}
                              className="btn-success btn-sm flex items-center"
                            >
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {myTasks.filter(task => task.status !== 'repaired').length > 6 && (
                    <div className="text-center pt-4">
                      <button
                        onClick={handleUpdateTaskStatus}
                        className="btn-outline flex items-center mx-auto"
                      >
                        View All Tasks
                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <WrenchScrewdriverIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Tasks</h4>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    You don't have any active maintenance tasks assigned to you at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Performance */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <button 
                  onClick={handleUpdateTaskStatus}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  <WrenchScrewdriverIcon className="w-5 h-5 mr-2" />
                  Update Task Status
                </button>
                <button 
                  onClick={handleLogWorkHours}
                  className="w-full btn-outline flex items-center justify-center"
                >
                  <ClockIcon className="w-5 h-5 mr-2" />
                  Log Work Hours
                </button>
                <button 
                  onClick={handleViewEquipmentDetails}
                  className="w-full btn-outline flex items-center justify-center"
                >
                  <CogIcon className="w-5 h-5 mr-2" />
                  View Equipment Details
                </button>
                <button 
                  onClick={handleCheckSchedule}
                  className="w-full btn-outline flex items-center justify-center"
                >
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Check Schedule
                </button>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">My Performance</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tasks Completed</span>
                  <div className="flex items-center">
                    <span className="font-bold text-green-600 text-lg">{stats.completed}</span>
                    <CheckCircleIcon className="w-4 h-4 text-green-600 ml-1" />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <div className="flex items-center">
                    <span className="font-bold text-yellow-600 text-lg">{stats.inProgress}</span>
                    <ClockIcon className="w-4 h-4 text-yellow-600 ml-1" />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <div className="flex items-center">
                    <span className="font-bold text-blue-600 text-lg">
                      {stats.totalAssigned > 0 ? Math.round((stats.completed / (stats.totalAssigned + stats.completed)) * 100) : 0}%
                    </span>
                  </div>
                </div>
                
                {/* Performance Progress Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Overall Progress</span>
                    <span className="font-medium">
                      {stats.totalAssigned > 0 ? Math.round((stats.completed / (stats.totalAssigned + stats.completed)) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                      style={{ 
                        width: `${stats.totalAssigned > 0 ? Math.round((stats.completed / (stats.totalAssigned + stats.completed)) * 100) : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Instructions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Work Instructions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <PlayIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">Start Task</h4>
              <p className="text-sm text-gray-500 mt-1">
                Click "Start" to begin working on a task and update its status to "In Progress"
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <h4 className="font-medium text-gray-900">Track Progress</h4>
              <p className="text-sm text-gray-500 mt-1">
                Log your work hours and update task progress as you work
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900">Complete Task</h4>
              <p className="text-sm text-gray-500 mt-1">
                Mark tasks as "Complete" when finished and add resolution notes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WorkHoursModal
        isOpen={showWorkHoursModal}
        onClose={() => setShowWorkHoursModal(false)}
        onSuccess={handleWorkHoursSuccess}
      />
      
      <UpdateTaskModal
        isOpen={showUpdateTaskModal}
        onClose={() => setShowUpdateTaskModal(false)}
        onSuccess={handleUpdateTaskSuccess}
      />
    </div>
  );
};

export default TechnicianDashboard;