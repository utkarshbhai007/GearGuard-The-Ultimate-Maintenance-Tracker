import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { requestsAPI, equipmentAPI, teamsAPI } from '../../utils/api';
import { Equipment, Team } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import Badge from '../common/Badge';
import toast from 'react-hot-toast';

interface ScheduleMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedDate?: Date | null;
}

interface MaintenanceFormData {
  subject: string;
  description: string;
  equipment_id: number;
  team_id: number;
  scheduled_date: string;
  priority: string;
  maintenance_type: string;
  estimated_duration: number;
  required_parts?: string;
  special_instructions?: string;
}

const ScheduleMaintenanceModal: React.FC<ScheduleMaintenanceModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  preselectedDate 
}) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    defaultValues: {
      priority: 'medium',
      maintenance_type: 'routine_inspection',
      estimated_duration: 2,
    }
  });

  const watchEquipmentId = watch('equipment_id');
  const watchMaintenanceType = watch('maintenance_type');

  useEffect(() => {
    if (isOpen) {
      fetchData();
      // Set preselected date if provided
      if (preselectedDate) {
        const dateTime = new Date(preselectedDate);
        dateTime.setHours(9, 0, 0, 0); // Set to 9 AM
        setValue('scheduled_date', dateTime.toISOString().slice(0, 16));
      } else {
        // Set default scheduled date to next week
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(9, 0, 0, 0); // 9 AM
        setValue('scheduled_date', nextWeek.toISOString().slice(0, 16));
      }
    }
  }, [isOpen, preselectedDate, setValue]);

  useEffect(() => {
    // Auto-fill team and subject when equipment is selected
    if (watchEquipmentId) {
      const selected = equipment.find(eq => eq.id === Number(watchEquipmentId));
      if (selected) {
        setSelectedEquipment(selected);
        if (selected.maintenance_team_id) {
          setValue('team_id', selected.maintenance_team_id);
        }
        // Auto-generate subject based on maintenance type and equipment
        const maintenanceTypeText = watchMaintenanceType.replace('_', ' ');
        setValue('subject', `${maintenanceTypeText} - ${selected.name}`);
      }
    }
  }, [watchEquipmentId, watchMaintenanceType, equipment, setValue]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [equipmentResponse, teamsResponse] = await Promise.all([
        equipmentAPI.getAll(),
        teamsAPI.getAll()
      ]);
      setEquipment(equipmentResponse.equipment || []);
      setTeams(teamsResponse.teams || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      setIsSubmitting(true);
      
      // Create preventive maintenance request
      const requestData = {
        ...data,
        request_type: 'preventive',
        status: 'new'
      };
      
      await requestsAPI.create(requestData);
      toast.success('Preventive maintenance scheduled successfully!');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to schedule maintenance:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule maintenance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedEquipment(null);
    onClose();
  };

  const getMaintenanceTypeDescription = (type: string) => {
    const descriptions = {
      routine_inspection: 'Regular inspection and basic maintenance checks',
      oil_change: 'Oil and fluid replacement service',
      filter_replacement: 'Air, oil, and other filter replacements',
      calibration: 'Equipment calibration and adjustment',
      cleaning: 'Deep cleaning and sanitization',
      lubrication: 'Lubrication of moving parts',
      belt_replacement: 'Belt and chain inspection/replacement',
      electrical_check: 'Electrical system inspection and testing',
      safety_inspection: 'Safety system and emergency stop testing',
      performance_test: 'Performance and efficiency testing'
    };
    return descriptions[type as keyof typeof descriptions] || 'Custom maintenance task';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CalendarIcon className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Schedule Preventive Maintenance</h3>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Equipment *
                    </label>
                    <select
                      {...register('equipment_id', { 
                        required: 'Equipment is required',
                        valueAsNumber: true 
                      })}
                      className="input mt-1"
                    >
                      <option value="">Select equipment</option>
                      {equipment.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} ({eq.serial_number}) - {eq.location}
                        </option>
                      ))}
                    </select>
                    {errors.equipment_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.equipment_id.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Maintenance Type *
                    </label>
                    <select
                      {...register('maintenance_type', { required: 'Maintenance type is required' })}
                      className="input mt-1"
                    >
                      <option value="routine_inspection">Routine Inspection</option>
                      <option value="oil_change">Oil Change</option>
                      <option value="filter_replacement">Filter Replacement</option>
                      <option value="calibration">Calibration</option>
                      <option value="cleaning">Deep Cleaning</option>
                      <option value="lubrication">Lubrication</option>
                      <option value="belt_replacement">Belt/Chain Service</option>
                      <option value="electrical_check">Electrical Check</option>
                      <option value="safety_inspection">Safety Inspection</option>
                      <option value="performance_test">Performance Test</option>
                    </select>
                    {errors.maintenance_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.maintenance_type.message}</p>
                    )}
                  </div>
                </div>

                {watchMaintenanceType && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Task Description:</strong> {getMaintenanceTypeDescription(watchMaintenanceType)}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subject *
                  </label>
                  <input
                    {...register('subject', { required: 'Subject is required' })}
                    className="input mt-1"
                    placeholder="e.g., Routine Inspection - CNC Machine #001"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="input mt-1"
                    placeholder="Detailed description of the maintenance tasks to be performed..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Scheduled Date & Time *
                    </label>
                    <input
                      {...register('scheduled_date', { required: 'Scheduled date is required' })}
                      type="datetime-local"
                      className="input mt-1"
                    />
                    {errors.scheduled_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.scheduled_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estimated Duration (hours) *
                    </label>
                    <input
                      {...register('estimated_duration', { 
                        required: 'Duration is required',
                        valueAsNumber: true,
                        min: { value: 0.5, message: 'Minimum 0.5 hours' },
                        max: { value: 24, message: 'Maximum 24 hours' }
                      })}
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      className="input mt-1"
                      placeholder="2.0"
                    />
                    {errors.estimated_duration && (
                      <p className="mt-1 text-sm text-red-600">{errors.estimated_duration.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Priority *
                    </label>
                    <select
                      {...register('priority', { required: 'Priority is required' })}
                      className="input mt-1"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    {errors.priority && (
                      <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Assigned Team *
                    </label>
                    <select
                      {...register('team_id', { 
                        required: 'Team is required',
                        valueAsNumber: true 
                      })}
                      className="input mt-1"
                    >
                      <option value="">Select team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.specialization})
                        </option>
                      ))}
                    </select>
                    {errors.team_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.team_id.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Required Parts/Materials
                  </label>
                  <textarea
                    {...register('required_parts')}
                    rows={2}
                    className="input mt-1"
                    placeholder="List any parts, materials, or tools needed for this maintenance..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Special Instructions
                  </label>
                  <textarea
                    {...register('special_instructions')}
                    rows={2}
                    className="input mt-1"
                    placeholder="Any special safety requirements, procedures, or notes..."
                  />
                </div>

                {selectedEquipment && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Equipment Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
                      <div>
                        <span className="font-medium">Location:</span> {selectedEquipment.location}
                      </div>
                      <div>
                        <span className="font-medium">Category:</span> {selectedEquipment.category}
                      </div>
                      <div>
                        <span className="font-medium">Condition:</span> 
                        <Badge 
                          className={
                            selectedEquipment.condition === 'excellent' ? 'bg-green-100 text-green-800 ml-1' :
                            selectedEquipment.condition === 'good' ? 'bg-blue-100 text-blue-800 ml-1' :
                            selectedEquipment.condition === 'fair' ? 'bg-yellow-100 text-yellow-800 ml-1' :
                            'bg-red-100 text-red-800 ml-1'
                          } 
                          size="sm"
                        >
                          {selectedEquipment.condition}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Assigned Team:</span> {
                          teams.find(t => t.id === selectedEquipment.maintenance_team_id)?.name || 'None'
                        }
                      </div>
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
                        Scheduling...
                      </>
                    ) : (
                      'Schedule Maintenance'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMaintenanceModal;