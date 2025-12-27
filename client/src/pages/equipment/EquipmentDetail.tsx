import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  WrenchScrewdriverIcon,
  CalendarIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  UserIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { equipmentAPI } from '../../utils/api';
import { Equipment, MaintenanceRequest } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import CreateRequestModal from '../../components/modals/CreateRequestModal';
import ScheduleMaintenanceModal from '../../components/modals/ScheduleMaintenanceModal';
import EditEquipmentModal from '../../components/modals/EditEquipmentModal';
import { getStatusColor, getConditionColor, formatDate, formatRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EquipmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [requestsCount, setRequestsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [showScheduleMaintenanceModal, setShowScheduleMaintenanceModal] = useState(false);
  const [showEditEquipmentModal, setShowEditEquipmentModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEquipmentDetails();
      fetchMaintenanceRequests();
    }
  }, [id]);

  const fetchEquipmentDetails = async () => {
    try {
      const response = await equipmentAPI.getById(Number(id));
      setEquipment(response.equipment);
      setRequestsCount(response.maintenanceRequestsCount || 0);
    } catch (error: any) {
      console.error('Failed to fetch equipment:', error);
      toast.error('Failed to load equipment details');
    }
  };

  const fetchMaintenanceRequests = async () => {
    try {
      const response = await equipmentAPI.getMaintenanceRequests(Number(id), { limit: 5 });
      setMaintenanceRequests(response.requests || []);
    } catch (error: any) {
      console.error('Failed to fetch maintenance requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllRequests = async () => {
    try {
      const response = await equipmentAPI.getMaintenanceRequests(Number(id));
      setMaintenanceRequests(response.requests || []);
      setShowAllRequests(true);
    } catch (error: any) {
      console.error('Failed to fetch all requests:', error);
      toast.error('Failed to load all requests');
    }
  };

  const handleCreateRequest = () => {
    setShowCreateRequestModal(true);
  };

  const handleScheduleMaintenance = () => {
    setShowScheduleMaintenanceModal(true);
  };

  const handleEditEquipment = () => {
    setShowEditEquipmentModal(true);
  };

  const handleModalSuccess = () => {
    // Refresh equipment details and maintenance requests
    fetchEquipmentDetails();
    fetchMaintenanceRequests();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Equipment not found</h3>
        <Link to="/equipment" className="btn-primary mt-4">
          Back to Equipment
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/equipment"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Serial: {equipment.serial_number}
            </p>
          </div>
        </div>
        
        {/* Smart Button - Maintenance Requests */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleEditEquipment}
            className="btn-outline flex items-center"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </button>
          <button
            onClick={fetchAllRequests}
            className="btn-primary relative"
          >
            <WrenchScrewdriverIcon className="w-5 h-5 mr-2" />
            Maintenance
            {requestsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                {requestsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Equipment Information</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <Badge variant="primary" className="mt-1">
                      {equipment.category}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <Badge className={`${getStatusColor(equipment.status)} mt-1`}>
                      {equipment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Condition</label>
                    <Badge className={`${getConditionColor(equipment.condition)} mt-1`}>
                      {equipment.condition}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Department</p>
                      <p className="text-sm text-gray-900">{equipment.department}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Location</p>
                      <p className="text-sm text-gray-900">{equipment.location}</p>
                    </div>
                  </div>
                  {equipment.assigned_employee && (
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Assigned Employee</p>
                        <p className="text-sm text-gray-900">{equipment.assigned_employee}</p>
                      </div>
                    </div>
                  )}
                  {equipment.purchase_date && (
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Purchase Date</p>
                        <p className="text-sm text-gray-900">{equipment.purchase_date ? formatDate(equipment.purchase_date) : 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  {equipment.manufacturer && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Manufacturer</p>
                      <p className="text-sm text-gray-900">{equipment.manufacturer}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {equipment.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
                  <p className="text-sm text-gray-900">{equipment.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Maintenance Team */}
          {equipment.maintenanceTeam && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Maintenance Team</h3>
              </div>
              <div className="card-body">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: equipment.maintenanceTeam.color }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{equipment.maintenanceTeam.name}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {equipment.maintenanceTeam.specialization.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                {equipment.assignedTechnician && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Assigned Technician</p>
                    <p className="text-sm text-gray-900">
                      {equipment.assignedTechnician.first_name} {equipment.assignedTechnician.last_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="card-body space-y-3">
              <button 
                onClick={handleCreateRequest}
                className="w-full btn-primary"
              >
                Create Maintenance Request
              </button>
              <button 
                onClick={handleScheduleMaintenance}
                className="w-full btn-outline"
              >
                Schedule Preventive Maintenance
              </button>
              <button 
                onClick={handleEditEquipment}
                className="w-full btn-outline"
              >
                Edit Equipment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Maintenance Requests */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {showAllRequests ? 'All Maintenance Requests' : 'Recent Maintenance Requests'}
          </h3>
          {!showAllRequests && maintenanceRequests.length > 0 && (
            <button
              onClick={fetchAllRequests}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All ({requestsCount})
            </button>
          )}
        </div>
        <div className="card-body">
          {maintenanceRequests.length > 0 ? (
            <div className="space-y-4">
              {maintenanceRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{request.subject}</h4>
                      {request.description && (
                        <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge className={getStatusColor(request.status)} size="sm">
                          {request.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="warning" size="sm">
                          {request.priority}
                        </Badge>
                        <Badge variant="primary" size="sm">
                          {request.request_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Created {request.created_at ? formatRelativeTime(request.created_at) : 'Unknown'}
                        {request.assignedTechnician && (
                          <span> • Assigned to {request.assignedTechnician.first_name} {request.assignedTechnician.last_name}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <WrenchScrewdriverIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No maintenance requests found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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

      <EditEquipmentModal
        isOpen={showEditEquipmentModal}
        onClose={() => setShowEditEquipmentModal(false)}
        onSuccess={handleModalSuccess}
        equipment={equipment}
      />
    </div>
  );
};

export default EquipmentDetail;