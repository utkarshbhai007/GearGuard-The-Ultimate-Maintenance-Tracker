import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { equipmentAPI, teamsAPI } from '../../utils/api';
import { Team } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EquipmentFormData {
  name: string;
  serial_number: string;
  category: string;
  department: string;
  location: string;
  maintenance_team_id: number;
  assigned_technician_id?: number;
  manufacturer?: string;
  model?: string;
  purchase_date?: string;
  condition: string;
  purchase_cost?: number;
  notes?: string;
}

const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EquipmentFormData>();

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen]);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const response = await teamsAPI.getAll();
      setTeams(response.teams || []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      setIsSubmitting(true);
      await equipmentAPI.create(data);
      toast.success('Equipment added successfully!');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to add equipment:', error);
      toast.error(error.response?.data?.message || 'Failed to add equipment');
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
              <h3 className="text-lg font-medium text-gray-900">Add New Equipment</h3>
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
                      Equipment Name *
                    </label>
                    <input
                      {...register('name', { required: 'Equipment name is required' })}
                      className="input mt-1"
                      placeholder="e.g., CNC Machine #001"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Serial Number *
                    </label>
                    <input
                      {...register('serial_number', { required: 'Serial number is required' })}
                      className="input mt-1"
                      placeholder="e.g., CNC-2023-001"
                    />
                    {errors.serial_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.serial_number.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category *
                    </label>
                    <select
                      {...register('category', { required: 'Category is required' })}
                      className="input mt-1"
                    >
                      <option value="">Select category</option>
                      <option value="machinery">Machinery</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="computer">Computer</option>
                      <option value="tool">Tool</option>
                      <option value="facility">Facility</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Department *
                    </label>
                    <input
                      {...register('department', { required: 'Department is required' })}
                      className="input mt-1"
                      placeholder="e.g., Production"
                    />
                    {errors.department && (
                      <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location *
                  </label>
                  <input
                    {...register('location', { required: 'Location is required' })}
                    className="input mt-1"
                    placeholder="e.g., Factory Floor A-1"
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maintenance Team *
                  </label>
                  <select
                    {...register('maintenance_team_id', { 
                      required: 'Maintenance team is required',
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
                  {errors.maintenance_team_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.maintenance_team_id.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Manufacturer
                    </label>
                    <input
                      {...register('manufacturer')}
                      className="input mt-1"
                      placeholder="e.g., Haas Automation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Model
                    </label>
                    <input
                      {...register('model')}
                      className="input mt-1"
                      placeholder="e.g., VF-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Purchase Date
                    </label>
                    <input
                      {...register('purchase_date')}
                      type="date"
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Condition
                    </label>
                    <select
                      {...register('condition')}
                      className="input mt-1"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Purchase Cost
                  </label>
                  <input
                    {...register('purchase_cost', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="input mt-1"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="input mt-1"
                    placeholder="Additional notes about the equipment..."
                  />
                </div>

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
                        Adding...
                      </>
                    ) : (
                      'Add Equipment'
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

export default AddEquipmentModal;