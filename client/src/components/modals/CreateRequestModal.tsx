import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { requestsAPI, equipmentAPI, teamsAPI } from '../../utils/api';
import { Equipment, Team } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RequestFormData {
  subject: string;
  description: string;
  equipment_id: number;
  team_id: number;
  request_type: string;
  priority: string;
  scheduled_date?: string;
}

const CreateRequestModal: React.FC<CreateRequestModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
  } = useForm<RequestFormData>();

  const watchEquipmentId = watch('equipment_id');
  const watchRequestType = watch('request_type');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-fill team when equipment is selected
    if (watchEquipmentId) {
      const selected = equipment.find(eq => eq.id === Number(watchEquipmentId));
      if (selected) {
        setSelectedEquipment(selected);
        if (selected.maintenance_team_id) {
          setValue('team_id', selected.maintenance_team_id);
        }
      }
    }
  }, [watchEquipmentId, equipment, setValue]);

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

  const onSubmit = async (data: RequestFormData) => {
    try {
      setIsSubmitting(true);
      await requestsAPI.create(data);
      toast.success('Maintenance request created successfully!');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create request:', error);
      toast.error(error.response?.data?.message || 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedEquipment(null);
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
              <h3 className="text-lg font-medium text-gray-900">Create Maintenance Request</h3>
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
                    Subject *
                  </label>
                  <input
                    {...register('subject', { required: 'Subject is required' })}
                    className="input mt-1"
                    placeholder="e.g., Oil leak in CNC Machine"
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
                    placeholder="Detailed description of the issue or maintenance needed..."
                  />
                </div>

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

                {selectedEquipment && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Auto-filled:</strong> This equipment is maintained by{' '}
                      {teams.find(t => t.id === selectedEquipment.maintenance_team_id)?.name || 'Unknown Team'}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maintenance Team *
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Request Type *
                    </label>
                    <select
                      {...register('request_type', { required: 'Request type is required' })}
                      className="input mt-1"
                    >
                      <option value="">Select type</option>
                      <option value="corrective">Corrective (Breakdown)</option>
                      <option value="preventive">Preventive (Routine)</option>
                    </select>
                    {errors.request_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.request_type.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Priority *
                    </label>
                    <select
                      {...register('priority', { required: 'Priority is required' })}
                      className="input mt-1"
                    >
                      <option value="">Select priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    {errors.priority && (
                      <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                    )}
                  </div>
                </div>

                {watchRequestType === 'preventive' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Scheduled Date
                    </label>
                    <input
                      {...register('scheduled_date')}
                      type="datetime-local"
                      className="input mt-1"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      For preventive maintenance, set when this should be performed
                    </p>
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
                        Creating...
                      </>
                    ) : (
                      'Create Request'
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

export default CreateRequestModal;