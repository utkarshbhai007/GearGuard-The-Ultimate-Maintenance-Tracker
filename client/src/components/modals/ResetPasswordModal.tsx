import React, { useState } from 'react';
import { XMarkIcon, KeyIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { adminAPI } from '../../utils/api';
import { User } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

interface ResetPasswordFormData {
  new_password: string;
  confirm_password: string;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, onSuccess, user }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>();

  const watchPassword = watch('new_password');

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      await adminAPI.resetUserPassword(user.id, data.new_password);
      toast.success('Password reset successfully!');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <KeyIcon className="w-6 h-6 text-yellow-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                You are about to reset the password for <strong>{user.first_name} {user.last_name}</strong> ({user.email}).
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password *
                </label>
                <input
                  {...register('new_password', { 
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  type="password"
                  className="input mt-1"
                  placeholder="••••••••"
                />
                {errors.new_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm New Password *
                </label>
                <input
                  {...register('confirm_password', { 
                    required: 'Please confirm the password',
                    validate: (value) => value === watchPassword || 'Passwords do not match'
                  })}
                  type="password"
                  className="input mt-1"
                  placeholder="••••••••"
                />
                {errors.confirm_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
                )}
              </div>

              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> The user will need to use this new password to log in. Make sure to communicate the new password securely.
                </p>
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
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal;