import React, { useEffect, useState } from 'react';
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';
import { requestsAPI } from '../utils/api';
import { MaintenanceRequest } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import CreateRequestModal from '../components/modals/CreateRequestModal';
import ScheduleMaintenanceModal from '../components/modals/ScheduleMaintenanceModal';
import { formatDate, formatDateTime, getPriorityColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [showScheduleMaintenanceModal, setShowScheduleMaintenanceModal] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchCalendarEvents();
  }, [currentDate]);

  const fetchCalendarEvents = async () => {
    try {
      setIsLoading(true);
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await requestsAPI.getCalendar({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });
      
      setEvents(response.events || []);
    } catch (error: any) {
      console.error('Failed to fetch calendar events:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    
    return events.filter(event => {
      if (!event.scheduled_date) return false;
      const eventDate = new Date(event.scheduled_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // If the date is in the future or today, allow scheduling
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clickedDate = new Date(date);
    clickedDate.setHours(0, 0, 0, 0);
    
    if (clickedDate >= today) {
      setPreselectedDate(date);
    }
  };

  const handleScheduleForDate = (date: Date) => {
    setPreselectedDate(date);
    setShowScheduleMaintenanceModal(true);
  };

  const handleCreateRequest = () => {
    setShowCreateRequestModal(true);
  };

  const handleRequestCreated = () => {
    fetchCalendarEvents();
    setShowCreateRequestModal(false);
    setShowScheduleMaintenanceModal(false);
    setPreselectedDate(null);
    toast.success('Maintenance request created successfully!');
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and schedule preventive maintenance
          </p>
        </div>
        <button 
          onClick={handleCreateRequest}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Schedule Maintenance
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth('prev')}
          className="btn-outline"
        >
          Previous
        </button>
        <h2 className="text-xl font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={() => navigateMonth('next')}
          className="btn-outline"
        >
          Next
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="card">
        <div className="card-body p-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {dayNames.map(day => (
              <div key={day} className="p-4 text-center font-medium text-gray-700 bg-gray-50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const isToday = day && day.toDateString() === new Date().toDateString();
              const isSelected = day && selectedDate && day.toDateString() === selectedDate.toDateString();
              const isPastDate = day && day < new Date(new Date().setHours(0, 0, 0, 0));
              const canSchedule = day && !isPastDate;

              return (
                <div
                  key={index}
                  className={`min-h-32 p-2 border-b border-r border-gray-200 relative ${
                    day ? `cursor-pointer transition-colors duration-200 ${
                      canSchedule ? 'hover:bg-blue-50' : 'hover:bg-gray-50'
                    }` : 'bg-gray-50'
                  } ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''} ${
                    isPastDate ? 'bg-gray-50 text-gray-400' : ''
                  }`}
                  onClick={() => day && handleDateClick(day)}
                  title={canSchedule ? 'Click to schedule maintenance' : ''}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-2 flex items-center justify-between ${
                        isToday ? 'text-blue-600' : isPastDate ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        <span>
                          {day.getDate()}
                          {isToday && (
                            <span className="ml-1 text-xs bg-blue-600 text-white px-1 rounded">
                              Today
                            </span>
                          )}
                        </span>
                        {canSchedule && dayEvents.length === 0 && (
                          <PlusIcon 
                            className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Schedule maintenance"
                          />
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer transition-colors ${
                              event.request_type === 'preventive' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                            title={`${event.subject} - ${event.equipment?.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Could add event detail modal here
                            }}
                          >
                            {event.subject}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>

                      {/* Schedule button overlay for future dates */}
                      {canSchedule && isSelected && (
                        <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleScheduleForDate(day);
                            }}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                          >
                            <PlusIcon className="h-3 w-3 inline mr-1" />
                            Schedule
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Events for {formatDate(selectedDate, 'MMMM d, yyyy')}
              </h3>
              {selectedDate >= new Date(new Date().setHours(0, 0, 0, 0)) && (
                <button
                  onClick={() => handleScheduleForDate(selectedDate)}
                  className="btn-primary btn-sm"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Schedule for this date
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            {getEventsForDate(selectedDate).length > 0 ? (
              <div className="space-y-4">
                {getEventsForDate(selectedDate).map(event => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{event.subject}</h4>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge className={getPriorityColor(event.priority)} size="sm">
                            {event.priority}
                          </Badge>
                          <Badge variant="primary" size="sm">
                            {event.request_type}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          <p><strong>Equipment:</strong> {event.equipment?.name}</p>
                          <p><strong>Team:</strong> {event.team?.name}</p>
                          {event.assignedTechnician && (
                            <p><strong>Assigned to:</strong> {event.assignedTechnician.first_name} {event.assignedTechnician.last_name}</p>
                          )}
                          {event.scheduled_date && (
                            <p><strong>Scheduled:</strong> {event.scheduled_date ? formatDateTime(event.scheduled_date) : 'Not scheduled'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No events scheduled for this date</p>
                {selectedDate >= new Date(new Date().setHours(0, 0, 0, 0)) ? (
                  <button 
                    onClick={() => handleScheduleForDate(selectedDate)}
                    className="btn-primary mt-4"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Schedule Maintenance
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-gray-400">Cannot schedule maintenance for past dates</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Events Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Upcoming This Week</h3>
          </div>
          <div className="card-body">
            {events.filter(event => {
              if (!event.scheduled_date) return false;
              const eventDate = new Date(event.scheduled_date);
              const weekFromNow = new Date();
              weekFromNow.setDate(weekFromNow.getDate() + 7);
              return eventDate >= new Date() && eventDate <= weekFromNow;
            }).length > 0 ? (
              <div className="space-y-3">
                {events
                  .filter(event => {
                    if (!event.scheduled_date) return false;
                    const eventDate = new Date(event.scheduled_date);
                    const weekFromNow = new Date();
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    return eventDate >= new Date() && eventDate <= weekFromNow;
                  })
                  .slice(0, 5)
                  .map(event => (
                    <div key={event.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{event.subject}</p>
                        <p className="text-sm text-gray-500">{event.equipment?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          {event.scheduled_date ? formatDate(event.scheduled_date, 'MMM d') : 'N/A'}
                        </p>
                        <Badge className={getPriorityColor(event.priority)} size="sm">
                          {event.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming events this week</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Monthly Summary</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {events.length}
                </div>
                <div className="text-sm text-gray-500">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {events.filter(e => e.request_type === 'preventive').length}
                </div>
                <div className="text-sm text-gray-500">Preventive</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {events.filter(e => e.priority === 'critical').length}
                </div>
                <div className="text-sm text-gray-500">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {events.filter(e => e.status === 'repaired').length}
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateRequestModal && (
        <CreateRequestModal
          isOpen={showCreateRequestModal}
          onClose={() => {
            setShowCreateRequestModal(false);
            setPreselectedDate(null);
          }}
          onSuccess={handleRequestCreated}
          preselectedDate={preselectedDate}
        />
      )}

      {showScheduleMaintenanceModal && (
        <ScheduleMaintenanceModal
          isOpen={showScheduleMaintenanceModal}
          onClose={() => {
            setShowScheduleMaintenanceModal(false);
            setPreselectedDate(null);
          }}
          onSuccess={handleRequestCreated}
          preselectedDate={preselectedDate}
        />
      )}
    </div>
  );
};

export default CalendarPage;