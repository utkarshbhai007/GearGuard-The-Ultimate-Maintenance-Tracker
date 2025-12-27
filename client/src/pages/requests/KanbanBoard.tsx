import React, { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { requestsAPI } from '../../utils/api';
import { KanbanData, MaintenanceRequest } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import { getPriorityColor, formatRelativeTime, isOverdue } from '../../utils/helpers';
import toast from 'react-hot-toast';

const KanbanBoard: React.FC = () => {
  const [kanbanData, setKanbanData] = useState<KanbanData>({
    new: [],
    in_progress: [],
    repaired: [],
    scrap: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<MaintenanceRequest | null>(null);

  useEffect(() => {
    fetchKanbanData();
  }, []);

  const fetchKanbanData = async () => {
    try {
      setIsLoading(true);
      const response = await requestsAPI.getKanban();
      setKanbanData(response.kanban || {
        new: [],
        in_progress: [],
        repaired: [],
        scrap: []
      });
    } catch (error: any) {
      console.error('Failed to fetch kanban data:', error);
      toast.error('Failed to load kanban board');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, request: MaintenanceRequest) => {
    setDraggedItem(request);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.status === newStatus) {
      setDraggedItem(null);
      return;
    }

    // Special confirmation for scrap status
    if (newStatus === 'scrap') {
      const confirmed = window.confirm(
        `⚠️ WARNING: Moving this request to SCRAP will mark the equipment "${draggedItem.equipment?.name}" as permanently unusable and cancel all other pending requests for this equipment.\n\nThis action cannot be undone. Are you sure you want to proceed?`
      );
      
      if (!confirmed) {
        setDraggedItem(null);
        return;
      }
    }

    try {
      // Optimistically update the UI
      const updatedKanban = { ...kanbanData };
      
      // Remove from old column
      const oldColumn = updatedKanban[draggedItem.status as keyof KanbanData];
      const itemIndex = oldColumn.findIndex(item => item.id === draggedItem.id);
      if (itemIndex > -1) {
        oldColumn.splice(itemIndex, 1);
      }
      
      // Add to new column
      const newColumn = updatedKanban[newStatus as keyof KanbanData];
      const updatedItem = { ...draggedItem, status: newStatus as any };
      newColumn.push(updatedItem);
      
      setKanbanData(updatedKanban);
      
      // Update on server
      await requestsAPI.updateStatus(draggedItem.id, newStatus);
      
      if (newStatus === 'scrap') {
        toast.success(`Equipment "${draggedItem.equipment?.name}" has been marked as scrapped`, {
          duration: 5000,
          icon: '⚠️'
        });
      } else {
        toast.success(`Request moved to ${newStatus.replace('_', ' ')}`);
      }
      
    } catch (error: any) {
      console.error('Failed to update request status:', error);
      toast.error('Failed to update request status');
      // Revert the optimistic update
      fetchKanbanData();
    } finally {
      setDraggedItem(null);
    }
  };

  const columns = [
    { 
      id: 'new', 
      title: 'New', 
      color: 'bg-blue-100 border-blue-300',
      textColor: 'text-blue-800'
    },
    { 
      id: 'in_progress', 
      title: 'In Progress', 
      color: 'bg-yellow-100 border-yellow-300',
      textColor: 'text-yellow-800'
    },
    { 
      id: 'repaired', 
      title: 'Repaired', 
      color: 'bg-green-100 border-green-300',
      textColor: 'text-green-800'
    },
    { 
      id: 'scrap', 
      title: 'Scrap', 
      color: 'bg-red-100 border-red-300',
      textColor: 'text-red-800'
    },
  ];

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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/requests"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
            <p className="mt-1 text-sm text-gray-500">
              Drag and drop requests to update their status
            </p>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => {
          const requests = kanbanData[column.id as keyof KanbanData] || [];
          
          return (
            <div key={column.id} className="flex flex-col">
              <div className={`p-3 rounded-t-lg border-2 ${column.color}`}>
                <h3 className={`font-medium ${column.textColor}`}>{column.title}</h3>
                <span className="text-sm text-gray-500">{requests.length} items</span>
              </div>
              <div 
                className="flex-1 bg-gray-50 border-2 border-t-0 border-gray-200 rounded-b-lg p-3 min-h-96 space-y-3"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, request)}
                      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow duration-200 ${
                        draggedItem?.id === request.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                            {request.subject}
                            {request.scheduled_date && isOverdue(request.scheduled_date) && request.status !== 'repaired' && (
                              <span className="text-red-600 text-xs ml-1">(Overdue)</span>
                            )}
                          </h4>
                          {request.equipment && (
                            <p className="text-xs text-gray-500 mt-1">
                              {request.equipment.name} ({request.equipment.serial_number})
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          <Badge className={getPriorityColor(request.priority)} size="sm">
                            {request.priority}
                          </Badge>
                          <Badge variant="primary" size="sm">
                            {request.request_type}
                          </Badge>
                        </div>

                        {request.team && (
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: request.team.color }}
                            />
                            <span className="text-xs text-gray-600">{request.team.name}</span>
                          </div>
                        )}

                        {request.assignedTechnician ? (
                          <div className="flex items-center space-x-2">
                            <Avatar
                              src={request.assignedTechnician.avatar_url}
                              firstName={request.assignedTechnician.first_name}
                              lastName={request.assignedTechnician.last_name}
                              size="xs"
                            />
                            <span className="text-xs text-gray-600">
                              {request.assignedTechnician.first_name} {request.assignedTechnician.last_name}
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">Unassigned</div>
                        )}

                        <div className="text-xs text-gray-500">
                          {request.created_at ? formatRelativeTime(request.created_at) : 'Unknown'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 mt-8">
                    <p className="text-sm">No requests in this column</p>
                    <p className="text-xs mt-1">Drag requests here to update status</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((column) => {
          const requests = kanbanData[column.id as keyof KanbanData] || [];
          return (
            <div key={column.id} className="card">
              <div className="card-body text-center">
                <div className={`text-2xl font-bold ${column.textColor}`}>
                  {requests.length}
                </div>
                <div className="text-sm text-gray-500">{column.title}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;