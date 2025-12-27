import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CogIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  DocumentChartBarIcon,
  SparklesIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/helpers';
import AddEquipmentModal from '../modals/AddEquipmentModal';
import CreateRequestModal from '../modals/CreateRequestModal';
import ScheduleMaintenanceModal from '../modals/ScheduleMaintenanceModal';
import UpdateTaskModal from '../modals/UpdateTaskModal';
import toast from 'react-hot-toast';

// Role-based navigation configurations
const getNavigationForRole = (role: string) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
  ];

  switch (role) {
    case 'admin':
      return [
        ...baseNavigation,
        { name: 'Equipment', href: '/equipment', icon: CogIcon },
        { name: 'Teams', href: '/teams', icon: UserGroupIcon },
        { name: 'Requests', href: '/requests', icon: ClipboardDocumentListIcon },
        { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
        { name: 'Reports', href: '/reports', icon: ChartBarIcon },
      ];
    
    case 'manager':
      return [
        ...baseNavigation,
        { name: 'Equipment', href: '/equipment', icon: CogIcon },
        { name: 'My Team', href: '/teams', icon: UserGroupIcon },
        { name: 'Requests', href: '/requests', icon: ClipboardDocumentListIcon },
        { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
        { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
      ];
    
    case 'technician':
      return [
        ...baseNavigation,
        { name: 'My Tasks', href: '/requests', icon: WrenchScrewdriverIcon },
        { name: 'Equipment', href: '/equipment', icon: CogIcon },
        { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
      ];
    
    default:
      return baseNavigation;
  }
};

const adminNavigation = [
  { name: 'System Settings', href: '/settings', icon: Cog6ToothIcon },
  { name: 'User Management', href: '/users', icon: UserGroupIcon },
];

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [showScheduleMaintenanceModal, setShowScheduleMaintenanceModal] = useState(false);
  const [showUpdateTaskModal, setShowUpdateTaskModal] = useState(false);

  const handleAddEquipment = () => {
    setShowAddEquipmentModal(true);
  };

  const handleCreateRequest = () => {
    setShowCreateRequestModal(true);
  };

  const handleScheduleMaintenance = () => {
    setShowScheduleMaintenanceModal(true);
  };

  const handleUpdateTask = () => {
    setShowUpdateTaskModal(true);
  };

  const handleModalSuccess = () => {
    toast.success('Action completed successfully!');
  };

  const navigation = getNavigationForRole(user?.role || 'user');

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col w-64 bg-white/80 backdrop-blur-md shadow-xl border-r border-white/20 min-h-screen">
      {/* Logo */}
      <div className="flex items-center justify-center h-20 px-6 border-b border-white/20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <CogIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-white">GearGuard</h1>
            <p className="text-xs text-blue-100">Maintenance Tracker</p>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50/80 to-white/80 border-b border-white/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {user?.role} Dashboard
          </span>
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border backdrop-blur-sm",
            user?.role === 'admin' ? 'bg-red-50/80 text-red-700 border-red-200' :
            user?.role === 'manager' ? 'bg-blue-50/80 text-blue-700 border-blue-200' :
            'bg-green-50/80 text-green-700 border-green-200'
          )}>
            <SparklesIcon className="w-3 h-3 inline mr-1" />
            {user?.role?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 custom-scrollbar overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover-lift',
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg border-l-4 border-white/30'
                  : 'text-gray-700 hover:bg-white/60 hover:text-gray-900 hover:shadow-md backdrop-blur-sm'
              )
            }
          >
            <item.icon
              className={cn(
                'mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200',
                isActive(item.href)
                  ? 'text-white'
                  : 'text-gray-500 group-hover:text-gray-700'
              )}
            />
            <span className="font-medium">{item.name}</span>
            {isActive(item.href) && (
              <BoltIcon className="ml-auto h-4 w-4 text-white/80" />
            )}
          </NavLink>
        ))}

        {/* Admin only navigation */}
        {user?.role === 'admin' && (
          <>
            <div className="pt-6">
              <div className="px-4 mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                  <Cog6ToothIcon className="w-3 h-3 mr-1" />
                  Administration
                </h3>
              </div>
              {adminNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover-lift',
                      isActive
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg border-l-4 border-white/30'
                        : 'text-gray-700 hover:bg-white/60 hover:text-gray-900 hover:shadow-md backdrop-blur-sm'
                    )
                  }
                >
                  <item.icon
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200',
                      isActive(item.href)
                        ? 'text-white'
                        : 'text-gray-500 group-hover:text-gray-700'
                    )}
                  />
                  <span className="font-medium">{item.name}</span>
                  {isActive(item.href) && (
                    <BoltIcon className="ml-auto h-4 w-4 text-white/80" />
                  )}
                </NavLink>
              ))}
            </div>
          </>
        )}

        {/* Quick Actions based on role */}
        <div className="pt-6">
          <div className="px-4 mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
              <BoltIcon className="w-3 h-3 mr-1" />
              Quick Actions
            </h3>
          </div>
          
          {user?.role === 'admin' && (
            <button 
              onClick={handleAddEquipment}
              className="w-full text-left group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-600 hover:text-white transition-all duration-200 hover-lift hover:shadow-lg backdrop-blur-sm"
            >
              <BuildingOfficeIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-500 group-hover:text-white transition-colors duration-200" />
              <span className="font-medium">Add Equipment</span>
              <SparklesIcon className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          )}
          
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <>
              <button 
                onClick={handleCreateRequest}
                className="w-full text-left group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all duration-200 hover-lift hover:shadow-lg backdrop-blur-sm"
              >
                <ClipboardDocumentListIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-500 group-hover:text-white transition-colors duration-200" />
                <span className="font-medium">Create Request</span>
                <SparklesIcon className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
              
              <button 
                onClick={handleScheduleMaintenance}
                className="w-full text-left group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-yellow-500 hover:to-orange-500 hover:text-white transition-all duration-200 hover-lift hover:shadow-lg backdrop-blur-sm"
              >
                <CalendarIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-500 group-hover:text-white transition-colors duration-200" />
                <span className="font-medium">Schedule Maintenance</span>
                <SparklesIcon className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
            </>
          )}
          
          {user?.role === 'technician' && (
            <button 
              onClick={handleUpdateTask}
              className="w-full text-left group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-green-500 hover:to-teal-600 hover:text-white transition-all duration-200 hover-lift hover:shadow-lg backdrop-blur-sm"
            >
              <WrenchScrewdriverIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-500 group-hover:text-white transition-colors duration-200" />
              <span className="font-medium">Update Task</span>
              <SparklesIcon className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          )}
        </div>
      </nav>

      {/* User info */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-white/20 bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm border-2",
              user?.role === 'admin' ? 'bg-gradient-to-r from-red-500 to-pink-600 border-red-300' :
              user?.role === 'manager' ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-300' :
              'bg-gradient-to-r from-green-500 to-emerald-600 border-green-300'
            )}>
              <span className="text-sm font-bold text-white">
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </span>
            </div>
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-600 truncate capitalize flex items-center">
              <span className={cn(
                "w-2 h-2 rounded-full mr-2",
                user?.role === 'admin' ? 'bg-red-500' :
                user?.role === 'manager' ? 'bg-blue-500' :
                'bg-green-500'
              )}></span>
              {user?.role}
              {user?.team_id && (
                <span className="ml-1">• Team Member</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEquipmentModal
        isOpen={showAddEquipmentModal}
        onClose={() => setShowAddEquipmentModal(false)}
        onSuccess={handleModalSuccess}
      />

      <CreateRequestModal
        isOpen={showCreateRequestModal}
        onClose={() => setShowCreateRequestModal(false)}
        onSuccess={handleModalSuccess}
      />

      <ScheduleMaintenanceModal
        isOpen={showScheduleMaintenanceModal}
        onClose={() => setShowScheduleMaintenanceModal(false)}
        onSuccess={handleModalSuccess}
      />

      <UpdateTaskModal
        isOpen={showUpdateTaskModal}
        onClose={() => setShowUpdateTaskModal(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default Sidebar;