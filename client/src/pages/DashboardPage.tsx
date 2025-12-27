import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import ManagerDashboard from '../components/dashboards/ManagerDashboard';
import TechnicianDashboard from '../components/dashboards/TechnicianDashboard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { 
  SparklesIcon, 
  BoltIcon,
  ChartBarIcon,
  CogIcon,
  WrenchScrewdriverIcon 
} from '@heroicons/react/24/outline';

const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <LoadingSpinner size="lg" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
          <p className="text-gray-600">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return <CogIcon className="w-8 h-8" />;
      case 'manager':
        return <ChartBarIcon className="w-8 h-8" />;
      case 'technician':
        return <WrenchScrewdriverIcon className="w-8 h-8" />;
      default:
        return <SparklesIcon className="w-8 h-8" />;
    }
  };

  const getRoleGradient = () => {
    switch (user?.role) {
      case 'admin':
        return 'from-red-500 to-pink-600';
      case 'manager':
        return 'from-blue-500 to-purple-600';
      case 'technician':
        return 'from-green-500 to-emerald-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    if (hour >= 17) greeting = 'Good evening';

    return `${greeting}, ${user?.first_name}!`;
  };

  // Render role-specific dashboard with enhanced layout
  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'technician':
        return <TechnicianDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">
              You don't have permission to access this dashboard.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Welcome Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded-2xl bg-gradient-to-r ${getRoleGradient()} shadow-lg`}>
                <div className="text-white">
                  {getRoleIcon()}
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                  {getWelcomeMessage()}
                  <SparklesIcon className="w-6 h-6 ml-2 text-yellow-500" />
                </h1>
                <p className="text-base sm:text-lg text-gray-600 capitalize flex items-center mt-1">
                  <BoltIcon className="w-4 h-4 mr-1" />
                  {user?.role} Dashboard • GearGuard
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fadeIn">
          {renderDashboard()}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;