import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { equipmentAPI } from '../../utils/api';
import { Equipment } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

interface ScrapEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment: Equipment | null;
}

interface ScrapFormData {
  reason: string;
  notes: string;
  confirmation: string;
}

const ScrapEquipmentModal: React.FC<ScrapEquipmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  equipment
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ScrapFormData>();

  const confirmationText = watch('confirmation');

  const onSubmit = async (data: ScrapFormData) => {
    if (!equipment) return;

    if (data.confirmation !== 'SCRAP') {
      toast.error('Please type "SCRAP" to confirm');
      return;
    }

    try {
      setIsSubmitting(true);
      await equipmentAPI.scrap(equipment.id, data.reason, data.notes);
      
      toast.success('Equipment has been marked as scrapped');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to scrap equipment:', error);
      toast.error(error.response?.data?.message || 'Failed to scrap equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen || !equipment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-full">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Scrap Equipment</h3>
              <p className="text-sm text-gray-500">Mark equipment as unusable</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Warning: Irreversible Action</h4>
                <p className="text-sm text-red-700 mt-1">
                  Scrapping <strong>{equipment.name}</strong> will:
                </p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                  <li>Mark the equipment as permanently unusable</li>
                  <li>Cancel all pending maintenance requests</li>
                  <li>Remove it from active equipment lists</li>
                  <li>Log this action with timestamp and user details</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Equipment Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Equipment Details</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Name:</strong> {equipment.name}</p>
              <p><strong>Serial:</strong> {equipment.serial_number}</p>
              <p><strong>Category:</strong> {equipment.category}</p>
              <p><strong>Department:</strong> {equipment.department}</p>
              <p><strong>Location:</strong> {equipment.location}</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Scrapping *
            </label>
            <select
              {...register('reason', { required: 'Please select a reason' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              <option value="Beyond Economic Repair">Beyond Economic Repair</option>
              <option value="Safety Hazard">Safety Hazard</option>
              <option value="Obsolete Technology">Obsolete Technology</option>
              <option value="Irreparable Damage">Irreparable Damage</option>
              <option value="End of Useful Life">End of Useful Life</option>
              <option value="Regulatory Compliance">Regulatory Compliance</option>
              <option value="Other">Other</option>
            </select>
            {errors.reason && (
              <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Provide additional details about the scrapping decision..."
            />
          </div>

          {/* Confirmation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type "SCRAP" to confirm *
            </label>
            <input
              type="text"
              {...register('confirmation', { 
                required: 'Please type SCRAP to confirm',
                validate: value => value === 'SCRAP' || 'Please type exactly "SCRAP" to confirm'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Type SCRAP to confirm"
            />
            {errors.confirmation && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmation.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
              disabled={isSubmitting || confirmationText !== 'SCRAP'}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Scrapping...
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Scrap Equipment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScrapEquipmentModal;