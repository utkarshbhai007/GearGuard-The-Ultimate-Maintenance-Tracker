import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, CogIcon, MagnifyingGlassIcon, PencilIcon } from '@heroicons/react/24/outline';
import { equipmentAPI } from '../../utils/api';
import { Equipment } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import AddEquipmentModal from '../../components/modals/AddEquipmentModal';
import EditEquipmentModal from '../../components/modals/EditEquipmentModal';
import { getStatusColor, getConditionColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EquipmentList: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setIsLoading(true);
      const response = await equipmentAPI.getAll();
      setEquipment(response.equipment || []);
    } catch (error: any) {
      console.error('Failed to fetch equipment:', error);
      toast.error('Failed to load equipment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEquipment = () => {
    setShowAddModal(true);
  };

  const handleEditEquipment = (e: React.MouseEvent, equipment: Equipment) => {
    e.preventDefault(); // Prevent navigation to detail page
    e.stopPropagation();
    setSelectedEquipment(equipment);
    setShowEditModal(true);
  };

  const handleEquipmentSuccess = () => {
    fetchEquipment(); // Refresh the list
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(equipment.map(item => item.category)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your company's assets and equipment
          </p>
        </div>
        <button onClick={handleAddEquipment} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Equipment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search equipment..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="input w-full sm:w-48"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Equipment List */}
      {filteredEquipment.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <div key={item.id} className="card hover:shadow-lg transition-shadow duration-200 relative">
              <Link to={`/equipment/${item.id}`} className="block">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {item.serial_number}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="primary" size="sm">
                          {item.category}
                        </Badge>
                        <Badge className={getStatusColor(item.status)} size="sm">
                          {item.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getConditionColor(item.condition)} size="sm">
                          {item.condition}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Department:</span> {item.department}</p>
                        <p><span className="font-medium">Location:</span> {item.location}</p>
                        {item.maintenanceTeam && (
                          <p><span className="font-medium">Team:</span> {item.maintenanceTeam.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {item.maintenanceRequestsCount !== undefined && item.maintenanceRequestsCount > 0 && (
                        <Badge variant="warning" size="sm">
                          {item.maintenanceRequestsCount} requests
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* Edit Button */}
              <button
                onClick={(e) => handleEditEquipment(e, item)}
                className="absolute top-3 right-3 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Equipment"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || selectedCategory ? 'No equipment found' : 'No equipment'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first piece of equipment.'
                }
              </p>
              {!searchTerm && !selectedCategory && (
                <div className="mt-6">
                  <button onClick={handleAddEquipment} className="btn-primary">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Equipment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddEquipmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleEquipmentSuccess}
      />

      <EditEquipmentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEquipmentSuccess}
        equipment={selectedEquipment}
      />
    </div>
  );
};

export default EquipmentList;