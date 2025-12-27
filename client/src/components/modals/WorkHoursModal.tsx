import React, { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { requestsAPI } from '../../utils/api';
import { MaintenanceRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Badge from '../common/Badge';
import { getStatusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface WorkHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface WorkHoursFormData {
  request_id: number;
  hours_worked: number;
  work_description: string;
  work_date: string;
}

const WorkHoursModal: React.FC<WorkHoursModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkHoursFormData>({
    defaultValues: {
      work_date: new Date().toISOString().split('T')[0], // Today's date
    }
  });

  useEffect(() => {
    if (isOpen) {
      fetchMyTasks();
    }
  }, [isOpen]);

  const fetchMyTasks = async () => {
    try {
      setIsLoading(true);
      const response = await requestsAPI.getAll({ 
        assigned_to: user?.id,
        status: ['in_progress', 'repaired']
      });
      setMyTasks(response.requests || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load your tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: WorkHoursFormData) => {
    try {
      setIsSubmitting(true);
      
      // For now, we'll just show a success message
      // In a real implementation, you'd have a work hours API endpoint
      console.log('Work hours data:', data);
      
      toast.success(`Logged ${data.hours_worked} hours of work!`);
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to log work hours:', error);
      toast.error('Failed to log work hours');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <ClockIcon className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Log Work Hours</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Task *
                  </label>
                  <select
                    {...register('request_id', { 
                      required: 'Please select a task',
                      valueAsNumber: true 
                    })}
                    className="input mt-1"
                  >
                    <option value="">Select a task to log hours for</option>
                    {myTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.subject} - {task.equipment?.name}
                      </option>
                    ))}
                  </select>
                  {errors.request_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.request_id.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Work Date *
                    </label>
                    <input
                      {...register('work_date', { required: 'Work date is required' })}
                      type="date"
                      className="input mt-1"
                    />
                    {errors.work_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.work_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Hours Worked *
                    </label>
                    <input
                      {...register('hours_worked', { 
                        required: 'Hours worked is required',
                        valueAsNumber: true,
                        min: { value: 0.1, message: 'Must be at least 0.1 hours' },
                        max: { value: 24, message: 'Cannot exceed 24 hours' }
                      })}
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="24"
                      className="input mt-1"
                      placeholder="e.g., 2.5"
                    />
                    {errors.hours_worked && (
                      <p className="mt-1 text-sm text-red-600">{errors.hours_worked.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Work Description *
                  </label>
                  <textarea
                    {...register('work_description', { required: 'Work description is required' })}
                    rows={3}
                    className="input mt-1"
                    placeholder="Describe the work performed during this time..."
                  />
                  {errors.work_description && (
                    <p className="mt-1 text-sm text-red-600">{errors.work_description.message}</p>
                  )}
                </div>

                {/* Show current tasks for reference */}
                {myTasks.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Your Current Tasks</h4>
                    <div className="space-y-2">
                      {myTasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center justify-between text-sm">
                          <span className="text-blue-800">{task.subject}</span>
                          <Badge className={getStatusColor(task.status)} size="sm">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                      {myTasks.length > 3 && (
                        <p className="text-xs text-blue-600">+{myTasks.length - 3} more tasks</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Logging...
                      </>
                    ) : (
                      'Log Hours'
                    )}
                  </button>
                </div>
              </form>
            )}

            {myTasks.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No active tasks to log hours for</p>
                <p className="text-xs text-gray-400">Complete some tasks first to log work hours</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkHoursModal;