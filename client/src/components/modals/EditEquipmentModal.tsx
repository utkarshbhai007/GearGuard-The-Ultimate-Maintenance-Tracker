import React, { useState, useEffect } from 'react';
import { XMarkIcon, CogIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { equipmentAPI, teamsAPI } from '../../utils/api';
import { Equipment, Team } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import Badge from '../common/Badge';
import toast from 'react-hot-toast';

interface EditEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment: Equipment | null;
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
  warranty_expiry?: string;
}

const EditEquipmentModal: React.FC<EditEquipmentModalProps> = ({ isOpen, onClose, onSuccess, equipment }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EquipmentFormData>();

  useEffect(() => {
    if (isOpen && equipment) {
      fetchTeams();
      populateForm();
    }
  }, [isOpen, equipment]);

  const populateForm = () => {
    if (!equipment) return;

    // Populate form with equipment data
    setValue('name', equipment.name);
    setValue('serial_number', equipment.serial_number);
    setValue('category', equipment.category);
    setValue('department', equipment.department);
    setValue('location', equipment.location);
    setValue('maintenance_team_id', equipment.maintenance_team_id);
    setValue('assigned_technician_id', equipment.assigned_technician_id || undefined);
    setValue('manufacturer', equipment.manufacturer || '');
    setValue('model', equipment.model || '');
    setValue('condition', equipment.condition);
    setValue('purchase_cost', equipment.purchase_cost || undefined);
    setValue('notes', equipment.notes || '');

    // Handle date fields
    if (equipment.purchase_date) {
      setValue('purchase_date', new Date(equipment.purchase_date).toISOString().split('T')[0]);
    }
    if (equipment.warranty_expiry) {
      setValue('warranty_expiry', new Date(equipment.warranty_expiry).toISOString().split('T')[0]);
    }
  };

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
    if (!equipment) return;

    try {
      setIsSubmitting(true);
      await equipmentAPI.update(equipment.id, data);
      toast.success('Equipment updated successfully!');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update equipment:', error);
      toast.error(error.response?.data?.message || 'Failed to update equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !equipment) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CogIcon className="w-6 h-6 text-blue-600 mr-2" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Edit Equipment</h3>
                  <p className="text-sm text-gray-500">{equipment.name} ({equipment.serial_number})</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Current Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Status</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Condition:</span>
                  <Badge className={getConditionColor(equipment.condition)} size="sm">
                    {equipment.condition}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>
                  <span className="font-medium text-gray-900 ml-1">{equipment.location}</span>
                </div>
                <div>
                  <span className="text-gray-500">Category:</span>
                  <span className="font-medium text-gray-900 ml-1">{equipment.category}</span>
                </div>
                <div>
                  <span className="text-gray-500">Department:</span>
                  <span className="font-medium text-gray-900 ml-1">{equipment.department}</span>
                </div>
              </div>
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
                      Warranty Expiry
                    </label>
                    <input
                      {...register('warranty_expiry')}
                      type="date"
                      className="input mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Condition *
                    </label>
                    <select
                      {...register('condition', { required: 'Condition is required' })}
                      className="input mt-1"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                      <option value="critical">Critical</option>
                    </select>
                    {errors.condition && (
                      <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>
                    )}
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
                        Updating...
                      </>
                    ) : (
                      'Update Equipment'
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

export default EditEquipmentModal;