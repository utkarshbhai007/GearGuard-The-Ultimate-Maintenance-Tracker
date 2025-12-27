import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, UserGroupIcon, UsersIcon, CogIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { teamsAPI } from '../../utils/api';
import { Team } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const TeamsList: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const response = await teamsAPI.getAll();
      setTeams(response.teams || []);
    } catch (error: any) {
      console.error('Failed to fetch teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage maintenance teams and their members
          </p>
        </div>
        <button className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Team
        </button>
      </div>

      {/* Teams Grid */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {team.specialization.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  {!team.is_active && (
                    <Badge variant="gray" size="sm">
                      Inactive
                    </Badge>
                  )}
                </div>

                {team.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                {/* Team Statistics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <UsersIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-lg font-semibold text-gray-900">
                        {team.memberCount || 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Members</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <CogIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-lg font-semibold text-gray-900">
                        {team.equipmentCount || 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Equipment</p>
                  </div>
                </div>

                {/* Active Requests */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <ClipboardDocumentListIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Active Requests</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(team.activeRequestsCount || 0) > 0 ? (
                      <Badge variant="warning" size="sm">
                        {team.activeRequestsCount}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-500">0</span>
                    )}
                  </div>
                </div>

                {/* Completion Rate */}
                {(team.completedRequestsCount || 0) > 0 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-medium text-green-600">
                      {Math.round(
                        ((team.completedRequestsCount || 0) / 
                         ((team.completedRequestsCount || 0) + (team.activeRequestsCount || 0))) * 100
                      )}%
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No teams</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first maintenance team.
              </p>
              <div className="mt-6">
                <button className="btn-primary">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Statistics Summary */}
      {teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-gray-900">
                {teams.length}
              </div>
              <div className="text-sm text-gray-500">Total Teams</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-gray-900">
                {teams.reduce((sum, team) => sum + (team.memberCount || 0), 0)}
              </div>
              <div className="text-sm text-gray-500">Total Members</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-gray-900">
                {teams.reduce((sum, team) => sum + (team.equipmentCount || 0), 0)}
              </div>
              <div className="text-sm text-gray-500">Total Equipment</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-gray-900">
                {teams.reduce((sum, team) => sum + (team.activeRequestsCount || 0), 0)}
              </div>
              <div className="text-sm text-gray-500">Active Requests</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsList;