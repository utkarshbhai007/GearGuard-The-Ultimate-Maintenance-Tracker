import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/helpers';
import Avatar from '../common/Avatar';
import AddEquipmentModal from '../modals/AddEquipmentModal';
import CreateRequestModal from '../modals/CreateRequestModal';
import ScheduleMaintenanceModal from '../modals/ScheduleMaintenanceModal';
import toast from 'react-hot-toast';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [showScheduleMaintenanceModal, setShowScheduleMaintenanceModal] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      title: 'Equipment Maintenance Due',
      message: 'CNC Machine #001 requires preventive maintenance',
      time: '2 hours ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Request Assigned',
      message: 'You have been assigned to repair Printer #003',
      time: '4 hours ago',
      unread: true,
    },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleAddEquipment = () => {
    setShowAddEquipmentModal(true);
  };

  const handleCreateRequest = () => {
    setShowCreateRequestModal(true);
  };

  const handleScheduleMaintenance = () => {
    setShowScheduleMaintenanceModal(true);
  };

  const handleModalSuccess = () => {
    toast.success('Action completed successfully!');
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-6">
        {/* Search bar */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <input
              type="text"
              placeholder="Search equipment, requests, or teams..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 placeholder-gray-500"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 border border-gray-200 rounded text-xs font-mono text-gray-500 bg-gray-50">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4 ml-6">
          {/* Notifications */}
          <Menu as="div" className="relative">
            <Menu.Button className="relative p-3 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl hover:bg-white/60 transition-all duration-200 backdrop-blur-sm">
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Menu.Button>

            <Transition
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-80 bg-white/90 backdrop-blur-md rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-white/20">
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                        <BellIcon className="w-4 h-4 mr-2" />
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <span className="text-xs text-blue-600 font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <Menu.Item key={notification.id}>
                        {({ active }) => (
                          <div
                            className={cn(
                              'px-4 py-3 cursor-pointer transition-colors duration-200',
                              active ? 'bg-blue-50/80' : '',
                              notification.unread ? 'bg-blue-50/50 border-l-4 border-blue-500' : ''
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                              </div>
                              {notification.unread && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 animate-pulse" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center">
                              <SparklesIcon className="w-3 h-3 mr-1" />
                              {notification.time}
                            </p>
                          </div>
                        )}
                      </Menu.Item>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Quick Actions */}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Menu as="div" className="relative">
              <Menu.Button className="btn-primary flex items-center shadow-lg hover:shadow-xl">
                <PlusIcon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Quick Actions</span>
                <BoltIcon className="w-4 h-4 ml-2" />
              </Menu.Button>

              <Transition
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 bg-white/90 backdrop-blur-md rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-white/20">
                  <div className="py-2">
                    {user?.role === 'admin' && (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleAddEquipment}
                            className={cn(
                              'flex items-center w-full px-4 py-3 text-sm text-gray-700 transition-all duration-200',
                              active ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : ''
                            )}
                          >
                            <BuildingOfficeIcon className="mr-3 h-5 w-5" />
                            <span className="font-medium">Add Equipment</span>
                            {active && <SparklesIcon className="ml-auto h-4 w-4" />}
                          </button>
                        )}
                      </Menu.Item>
                    )}
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleCreateRequest}
                          className={cn(
                            'flex items-center w-full px-4 py-3 text-sm text-gray-700 transition-all duration-200',
                            active ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : ''
                          )}
                        >
                          <ClipboardDocumentListIcon className="mr-3 h-5 w-5" />
                          <span className="font-medium">Create Request</span>
                          {active && <SparklesIcon className="ml-auto h-4 w-4" />}
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleScheduleMaintenance}
                          className={cn(
                            'flex items-center w-full px-4 py-3 text-sm text-gray-700 transition-all duration-200',
                            active ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : ''
                          )}
                        >
                          <CalendarIcon className="mr-3 h-5 w-5" />
                          <span className="font-medium">Schedule Maintenance</span>
                          {active && <SparklesIcon className="ml-auto h-4 w-4" />}
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 backdrop-blur-sm">
              <Avatar
                src={user?.avatar_url}
                firstName={user?.first_name}
                lastName={user?.last_name}
                size="sm"
                className="ring-2 ring-white shadow-lg"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-600 capitalize flex items-center">
                  <span className={cn(
                    "w-2 h-2 rounded-full mr-1",
                    user?.role === 'admin' ? 'bg-red-500' :
                    user?.role === 'manager' ? 'bg-blue-500' :
                    'bg-green-500'
                  )}></span>
                  {user?.role}
                </p>
              </div>
            </Menu.Button>

            <Transition
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-white/20">
                <div className="py-2">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={cn(
                          'flex items-center px-4 py-3 text-sm text-gray-700 transition-all duration-200',
                          active ? 'bg-blue-50/80 text-blue-700' : ''
                        )}
                      >
                        <UserCircleIcon className="mr-3 h-5 w-5" />
                        <span className="font-medium">Your Profile</span>
                        {active && <SparklesIcon className="ml-auto h-4 w-4" />}
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={cn(
                          'flex items-center w-full px-4 py-3 text-sm text-gray-700 transition-all duration-200',
                          active ? 'bg-red-50/80 text-red-700' : ''
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                        <span className="font-medium">Sign out</span>
                        {active && <SparklesIcon className="ml-auto h-4 w-4" />}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
        </div>
      </header>

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
    </>
  );
};

export default Header;