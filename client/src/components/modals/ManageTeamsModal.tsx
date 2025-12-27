import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { teamsAPI } from '../../utils/api';
import { Team, User } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import Badge from '../common/Badge';
import toast from 'react-hot-toast';

interface ManageTeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TeamFormData {
  name: string;
  specialization: string;
  description?: string;
}

const ManageTeamsModal: React.FC<ManageTeamsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamFormData>();

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [teamsResponse, usersResponse] = await Promise.all([
        teamsAPI.getAll(),
        teamsAPI.getAvailableUsers()
      ]);
      setTeams(teamsResponse.teams || []);
      setAvailableUsers(usersResponse.users || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load teams data');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: TeamFormData) => {
    try {
      setIsSubmitting(true);
      await teamsAPI.create(data);
      toast.success('Team created successfully!');
      reset();
      fetchData();
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create team:', error);
      toast.error(error.response?.data?.message || 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (teamId: number, userId: number) => {
    try {
      await teamsAPI.addMember(teamId, userId);
      toast.success('Member added to team!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (teamId: number, userId: number) => {
    try {
      await teamsAPI.removeMember(teamId, userId);
      toast.success('Member removed from team!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleClose = () => {
    reset();
    setSelectedTeam(null);
    setActiveTab('create');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Teams</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'create'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Create Team
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'manage'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Manage Existing Teams
                </button>
              </nav>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <>
                {/* Create Team Tab */}
                {activeTab === 'create' && (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Team Name *
                      </label>
                      <input
                        {...register('name', { required: 'Team name is required' })}
                        className="input mt-1"
                        placeholder="e.g., Electrical Maintenance Team"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Specialization *
                      </label>
                      <select
                        {...register('specialization', { required: 'Specialization is required' })}
                        className="input mt-1"
                      >
                        <option value="">Select specialization</option>
                        <option value="electrical">Electrical</option>
                        <option value="mechanical">Mechanical</option>
                        <option value="plumbing">Plumbing</option>
                        <option value="hvac">HVAC</option>
                        <option value="general">General Maintenance</option>
                        <option value="it">IT Support</option>
                        <option value="facilities">Facilities</option>
                      </select>
                      {errors.specialization && (
                        <p className="mt-1 text-sm text-red-600">{errors.specialization.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="input mt-1"
                        placeholder="Brief description of the team's responsibilities..."
                      />
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
                        className="btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Creating...
                          </>
                        ) : (
                          'Create Team'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Manage Teams Tab */}
                {activeTab === 'manage' && (
                  <div className="space-y-6">
                    {teams.length > 0 ? (
                      teams.map((team) => (
                        <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">{team.name}</h4>
                              <p className="text-sm text-gray-600">{team.description}</p>
                              <Badge variant="primary" size="sm" className="mt-2">
                                {team.specialization}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">
                              {team.members?.length || 0} members
                            </div>
                          </div>

                          {/* Team Members */}
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Team Members</h5>
                            {team.members && team.members.length > 0 ? (
                              <div className="space-y-2">
                                {team.members.map((member) => (
                                  <div key={member.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-sm font-medium text-blue-600">
                                          {member.first_name[0]}{member.last_name[0]}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {member.first_name} {member.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">{member.role}</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveMember(team.id, member.id)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <UserMinusIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No members assigned</p>
                            )}
                          </div>

                          {/* Add Member */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Add Member</h5>
                            <div className="flex flex-wrap gap-2">
                              {availableUsers
                                .filter(user => !team.members?.some(member => member.id === user.id))
                                .map((user) => (
                                <button
                                  key={user.id}
                                  onClick={() => handleAddMember(team.id, user.id)}
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
                                >
                                  <PlusIcon className="w-4 h-4 mr-1" />
                                  {user.first_name} {user.last_name} ({user.role})
                                </button>
                              ))}
                            </div>
                            {availableUsers.filter(user => !team.members?.some(member => member.id === user.id)).length === 0 && (
                              <p className="text-sm text-gray-500">No available users to add</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No teams found</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageTeamsModal;