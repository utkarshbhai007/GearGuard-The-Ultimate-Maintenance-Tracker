import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Cog6ToothIcon,
  ServerIcon,
  BellIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { adminAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

interface SystemSettings {
  system_name: string;
  version: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  max_file_size: string;
  session_timeout: string;
  backup_frequency: string;
  notification_settings: {
    email_notifications: boolean;
    push_notifications: boolean;
    maintenance_reminders: boolean;
  };
}

const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SystemSettings>();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getSettings();
      setSettings(response.settings);
      reset(response.settings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load system settings');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SystemSettings) => {
    try {
      setIsSaving(true);
      await adminAPI.updateSettings(data);
      setSettings(data);
      toast.success('System settings updated successfully');
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <Cog6ToothIcon className="w-8 h-8 text-gray-400 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
              <p className="text-sm text-gray-500">
                Configure system-wide settings and preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <ServerIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  System Name
                </label>
                <input
                  {...register('system_name', { required: 'System name is required' })}
                  className="input mt-1"
                  placeholder="GearGuard Maintenance System"
                />
                {errors.system_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.system_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Version
                </label>
                <input
                  {...register('version')}
                  className="input mt-1"
                  placeholder="1.0.0"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Session Timeout
                </label>
                <select
                  {...register('session_timeout')}
                  className="input mt-1"
                >
                  <option value="1h">1 Hour</option>
                  <option value="4h">4 Hours</option>
                  <option value="8h">8 Hours</option>
                  <option value="1d">1 Day</option>
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max File Size
                </label>
                <select
                  {...register('max_file_size')}
                  className="input mt-1"
                >
                  <option value="5MB">5 MB</option>
                  <option value="10MB">10 MB</option>
                  <option value="25MB">25 MB</option>
                  <option value="50MB">50 MB</option>
                  <option value="100MB">100 MB</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  {...register('maintenance_mode')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Maintenance Mode
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                When enabled, only administrators can access the system
              </p>

              <div className="flex items-center">
                <input
                  {...register('registration_enabled')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Allow User Registration
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Allow new users to register accounts
              </p>
            </div>
          </div>
        </div>

        {/* Backup Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Backup Settings</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Backup Frequency
              </label>
              <select
                {...register('backup_frequency')}
                className="input mt-1 max-w-xs"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                How often should automatic backups be created
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <BellIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  {...register('notification_settings.email_notifications')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Email Notifications
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Send email notifications for important events
              </p>

              <div className="flex items-center">
                <input
                  {...register('notification_settings.push_notifications')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Push Notifications
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Send browser push notifications
              </p>

              <div className="flex items-center">
                <input
                  {...register('notification_settings.maintenance_reminders')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Maintenance Reminders
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Send reminders for upcoming maintenance tasks
              </p>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">System Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Version</dt>
                <dd className="mt-1 text-sm text-gray-900">{settings?.version}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Online
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date().toLocaleDateString()}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettingsPage;