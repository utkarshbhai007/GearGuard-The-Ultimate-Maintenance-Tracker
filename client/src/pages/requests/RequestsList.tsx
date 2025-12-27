import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, ClipboardDocumentListIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { requestsAPI } from '../../utils/api';
import { MaintenanceRequest } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import { getStatusColor, getPriorityColor, formatRelativeTime, isOverdue } from '../../utils/helpers';
import toast from 'react-hot-toast';

const RequestsList: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await requestsAPI.getAll();
      setRequests(response.requests || []);
    } catch (error: any) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to load maintenance requests');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.equipment?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.equipment?.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || request.status === statusFilter;
    const matchesPriority = !priorityFilter || request.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage all maintenance requests
          </p>
        </div>
        <div className="flex space-x-3">
          <Link to="/requests/kanban" className="btn-outline">
            View Kanban
          </Link>
          <button className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            New Request
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="input w-full lg:w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="repaired">Repaired</option>
          <option value="scrap">Scrap</option>
        </select>
        <select
          className="input w-full lg:w-48"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Requests List */}
      {filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Link
              key={request.id}
              to={`/requests/${request.id}`}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {request.subject}
                        {request.scheduled_date && isOverdue(request.scheduled_date) && request.status !== 'repaired' && (
                          <span className="ml-2 text-red-600 text-sm font-normal">
                            (Overdue)
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge className={getStatusColor(request.status)} size="sm">
                          {request.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(request.priority)} size="sm">
                          {request.priority}
                        </Badge>
                        <Badge variant="primary" size="sm">
                          {request.request_type}
                        </Badge>
                      </div>
                    </div>

                    {request.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {request.description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Equipment</p>
                        <p className="text-gray-900">
                          {request.equipment?.name}
                          <span className="text-gray-500 ml-1">
                            ({request.equipment?.serial_number})
                          </span>
                        </p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-700">Team</p>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: request.team?.color }}
                          />
                          <span className="text-gray-900">{request.team?.name}</span>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-gray-700">Assigned To</p>
                        {request.assignedTechnician ? (
                          <div className="flex items-center space-x-2">
                            <Avatar
                              src={request.assignedTechnician.avatar_url}
                              firstName={request.assignedTechnician.first_name}
                              lastName={request.assignedTechnician.last_name}
                              size="xs"
                            />
                            <span className="text-gray-900">
                              {request.assignedTechnician.first_name} {request.assignedTechnician.last_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">Unassigned</span>
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-gray-700">Created</p>
                        <p className="text-gray-900">
                          {request.created_at ? formatRelativeTime(request.created_at) : 'Unknown'}
                        </p>
                        {request.creator && (
                          <p className="text-xs text-gray-500">
                            by {request.creator.first_name} {request.creator.last_name}
                          </p>
                        )}
                      </div>
                    </div>

                    {request.scheduled_date && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Scheduled:</span>
                          <span className={`ml-1 ${isOverdue(request.scheduled_date) && request.status !== 'repaired' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                            {request.scheduled_date ? formatRelativeTime(request.scheduled_date) : 'Not scheduled'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || statusFilter || priorityFilter ? 'No requests found' : 'No requests'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter || priorityFilter
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first maintenance request.'
                }
              </p>
              {!searchTerm && !statusFilter && !priorityFilter && (
                <div className="mt-6">
                  <button className="btn-primary">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {requests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-gray-900">
                {requests.length}
              </div>
              <div className="text-sm text-gray-500">Total Requests</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600">
                {requests.filter(r => r.status === 'new').length}
              </div>
              <div className="text-sm text-gray-500">New</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {requests.filter(r => r.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === 'repaired').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsList;