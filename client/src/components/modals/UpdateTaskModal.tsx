import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  WrenchScrewdriverIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { requestsAPI } from '../../utils/api';
import { MaintenanceRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Badge from '../common/Badge';
import { formatDate, formatRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface UpdateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UpdateTaskFormData {
  request_id: number;
  status: string;
  progress_notes?: string;
  completion_percentage?: number;
  estimated_completion?: string;
}

const UpdateTaskModal: React.FC<UpdateTaskModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState<MaintenanceRequest[]>([]);
  const [selectedTask, setSelectedTask] = useState<MaintenanceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateTaskFormData>();

  const watchStatus = watch('status');

  useEffect(() => {
    if (isOpen) {
      fetchMyTasks();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTask) {
      setValue('request_id', selectedTask.id);
      setValue('status', selectedTask.status);
      setValue('progress_notes', '');
      setValue('completion_percentage', selectedTask.completion_percentage || 0);
      if (selectedTask.estimated_completion) {
        setValue('estimated_completion', new Date(selectedTask.estimated_completion).toISOString().slice(0, 16));
      }
    }
  }, [selectedTask, setValue]);

  const fetchMyTasks = async () => {
    try {
      setIsLoading(true);
      const response = await requestsAPI.getAll({
        assigned_to: user?.id,
        status: ['new', 'in_progress', 'on_hold'],
        limit: 20
      });
      setMyTasks(response.requests || []);
      
      // Auto-select first task if available
      if (response.requests && response.requests.length > 0) {
        setSelectedTask(response.requests[0]);
      }
    } catch (error) {
      console.error('Failed to fetch my tasks:', error);
      toast.error('Failed to load your tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UpdateTaskFormData) => {
    if (!selectedTask) return;

    try {
      setIsSubmitting(true);
      
      const updateData: any = {
        status: data.status,
        completion_percentage: data.completion_percentage,
      };

      if (data.progress_notes) {
        updateData.progress_notes = data.progress_notes;
      }

      if (data.estimated_completion) {
        updateData.estimated_completion = data.estimated_completion;
      }

      await requestsAPI.update(selectedTask.id, updateData);
      toast.success('Task updated successfully!');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update task:', error);
      toast.error(error.response?.data?.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedTask(null);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on_hold':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <ClockIcon className="w-4 h-4" />;
      case 'in_progress':
        return <PlayIcon className="w-4 h-4" />;
      case 'on_hold':
        return <PauseIcon className="w-4 h-4" />;
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') {
      return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <WrenchScrewdriverIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-xl font-bold text-white">Update My Tasks</h3>
                  <p className="text-green-100 text-sm">Manage your assigned maintenance tasks</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="bg-white px-6 py-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Loading your tasks...</p>
              </div>
            ) : myTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <WrenchScrewdriverIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Tasks</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  You don't have any active maintenance tasks assigned to you at the moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Task Selection - Mobile First */}
                <div className="order-2 xl:order-1">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">My Active Tasks</h4>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {myTasks.length} task{myTasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {myTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={`group relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedTask?.id === task.id
                            ? 'border-primary-500 bg-primary-50 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {/* Priority Indicator */}
                        {task.priority === 'high' && (
                          <div className="absolute top-2 right-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                              {task.subject}
                            </h5>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
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

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {task.scheduled_date ? formatRelativeTime(task.scheduled_date) : 'No due date'}
                          </span>
                          {selectedTask?.id === task.id && (
                            <span className="text-primary-600 font-medium">Selected</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task Update Form - Mobile First */}
                <div className="order-1 xl:order-2">
                  {selectedTask ? (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Update Task Progress</h4>
                      
                      {/* Task Summary Card */}
                      <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 mb-1">{selectedTask.subject}</h5>
                            <p className="text-sm text-gray-600 mb-2">{selectedTask.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary-600">
                              {selectedTask.completion_percentage || 0}%
                            </div>
                            <div className="text-xs text-gray-500">Complete</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Equipment:</span>
                            <div className="font-medium text-gray-900">{selectedTask.equipment?.name}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Location:</span>
                            <div className="font-medium text-gray-900">{selectedTask.equipment?.location}</div>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Status *
                            </label>
                            <select
                              {...register('status', { required: 'Status is required' })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            >
                              <option value="new">🆕 New</option>
                              <option value="in_progress">⚡ In Progress</option>
                              <option value="on_hold">⏸️ On Hold</option>
                              <option value="completed">✅ Completed</option>
                            </select>
                            {errors.status && (
                              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Completion Percentage
                            </label>
                            <div className="relative">
                              <input
                                {...register('completion_percentage', {
                                  valueAsNumber: true,
                                  min: { value: 0, message: 'Minimum 0%' },
                                  max: { value: 100, message: 'Maximum 100%' }
                                })}
                                type="number"
                                min="0"
                                max="100"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                placeholder="0"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-gray-500 text-sm">%</span>
                              </div>
                            </div>
                            {errors.completion_percentage && (
                              <p className="mt-1 text-sm text-red-600">{errors.completion_percentage.message}</p>
                            )}
                          </div>
                        </div>

                        {watchStatus !== 'completed' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Estimated Completion
                            </label>
                            <input
                              {...register('estimated_completion')}
                              type="datetime-local"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Progress Notes
                          </label>
                          <textarea
                            {...register('progress_notes')}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                            placeholder="Add notes about your progress, any issues encountered, or next steps..."
                          />
                        </div>

                        {watchStatus === 'completed' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                              <div>
                                <h6 className="font-medium text-green-900 mb-1">Task Completion</h6>
                                <p className="text-sm text-green-800">
                                  Marking this task as completed will notify the manager and update the equipment maintenance records.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                          <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            disabled={isSubmitting}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-lg hover:from-primary-700 hover:to-blue-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <div className="flex items-center justify-center">
                                <LoadingSpinner size="sm" className="mr-2" />
                                Updating...
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <CheckCircleIcon className="w-5 h-5 mr-2" />
                                Update Task
                              </div>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <WrenchScrewdriverIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-2">Select a Task</h5>
                      <p className="text-gray-500">Choose a task from the list to update its progress</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateTaskModal;