import React, { useEffect, useState } from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, CurrencyDollarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { dashboardAPI } from '../utils/api';
import { TeamPerformance, EquipmentUtilization } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import { formatNumber, formatCurrency } from '../utils/helpers';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [equipmentUtilization, setEquipmentUtilization] = useState<EquipmentUtilization[]>([]);
  const [costAnalysis, setCostAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState('30');
  
  // Get active tab from URL params, default to 'overview'
  const activeTab = searchParams.get('tab') || 'overview';

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'team-performance', name: 'Team Performance', icon: UserGroupIcon },
    { id: 'cost-analysis', name: 'Cost Analysis', icon: CurrencyDollarIcon },
  ];

  const setActiveTab = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  useEffect(() => {
    fetchReportsData();
  }, [selectedDateRange]);

  const fetchReportsData = async () => {
    try {
      setIsLoading(true);
      const params = { date_range: selectedDateRange };
      
      const [teamResponse, equipmentResponse, costResponse] = await Promise.all([
        dashboardAPI.getTeamPerformance(params),
        dashboardAPI.getEquipmentUtilization(params),
        dashboardAPI.getCostAnalysis(params)
      ]);
      
      setTeamPerformance(teamResponse.teamPerformance || []);
      setEquipmentUtilization(equipmentResponse.equipmentUtilization || []);
      setCostAnalysis(costResponse);
    } catch (error: any) {
      console.error('Failed to fetch reports data:', error);
      toast.error('Failed to load reports data');
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
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Analyze maintenance performance and costs
          </p>
        </div>
        <select
          className="input w-48"
          value={selectedDateRange}
          onChange={(e) => setSelectedDateRange(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cost Overview */}
          {costAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card">
                <div className="card-body text-center">
                  <CurrencyDollarIcon className="mx-auto h-8 w-8 text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(costAnalysis.totalCost || 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Cost</div>
                </div>
              </div>
              <div className="card">
                <div className="card-body text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(costAnalysis.costByType?.corrective?.cost || 0)}
                  </div>
                  <div className="text-sm text-gray-500">Corrective</div>
                </div>
              </div>
              <div className="card">
                <div className="card-body text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(costAnalysis.costByType?.preventive?.cost || 0)}
                  </div>
                  <div className="text-sm text-gray-500">Preventive</div>
                </div>
              </div>
              <div className="card">
                <div className="card-body text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {costAnalysis.monthlyCosts?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Months Tracked</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Performance Summary */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Team Performance Summary</h3>
              </div>
              <div className="card-body">
                {teamPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {teamPerformance.slice(0, 3).map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">{team.name}</h4>
                            <p className="text-sm text-gray-500">{team.completedRequests} completed</p>
                          </div>
                        </div>
                        <Badge variant="success" size="sm">
                          {team.completionRate}%
                        </Badge>
                      </div>
                    ))}
                    <button 
                      onClick={() => setActiveTab('team-performance')}
                      className="w-full text-sm text-blue-600 hover:text-blue-700 py-2"
                    >
                      View detailed team performance →
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChartBarIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No team performance data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Equipment Utilization Summary */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Top Equipment by Requests</h3>
              </div>
              <div className="card-body">
                {equipmentUtilization.length > 0 ? (
                  <div className="space-y-4">
                    {equipmentUtilization.slice(0, 3).map((equipment) => (
                      <div key={equipment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{equipment.name}</h4>
                          <p className="text-sm text-gray-500">{equipment.category}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{equipment.totalRequests}</div>
                          <div className="text-sm text-gray-500">requests</div>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => setActiveTab('cost-analysis')}
                      className="w-full text-sm text-blue-600 hover:text-blue-700 py-2"
                    >
                      View detailed cost analysis →
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChartBarIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No equipment data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Key Insights</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Performance Highlights</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {teamPerformance.length > 0 && (
                      <>
                        <li>• Best performing team: {teamPerformance.reduce((best, team) => 
                          parseFloat(team.completionRate) > parseFloat(best.completionRate) ? team : best
                        ).name} ({teamPerformance.reduce((best, team) => 
                          parseFloat(team.completionRate) > parseFloat(best.completionRate) ? team : best
                        ).completionRate}% completion rate)</li>
                        <li>• Total active teams: {teamPerformance.length}</li>
                        <li>• Average completion rate: {formatNumber(
                          teamPerformance.reduce((sum, team) => sum + parseFloat(team.completionRate), 0) / teamPerformance.length, 1
                        )}%</li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Cost Insights</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {costAnalysis && (
                      <>
                        <li>• Total maintenance cost: {formatCurrency(costAnalysis.totalCost || 0)}</li>
                        <li>• Preventive vs Corrective ratio: {
                          costAnalysis.costByType?.preventive?.cost && costAnalysis.costByType?.corrective?.cost
                            ? `${Math.round((costAnalysis.costByType.preventive.cost / (costAnalysis.costByType.preventive.cost + costAnalysis.costByType.corrective.cost)) * 100)}% preventive`
                            : 'No data available'
                        }</li>
                        <li>• Equipment tracked: {equipmentUtilization.length} items</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'team-performance' && (
        <div className="space-y-6">
          {/* Team Performance */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Detailed Team Performance</h3>
            </div>
            <div className="card-body">
              {teamPerformance.length > 0 ? (
                <div className="space-y-4">
                  {teamPerformance.map((team) => (
                    <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">{team.name}</h4>
                            <p className="text-sm text-gray-500 capitalize">
                              {team.specialization.replace('_', ' ')} • {team.memberCount} members
                            </p>
                          </div>
                        </div>
                        <Badge variant="success" size="sm">
                          {team.completionRate}% completion
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{team.totalRequests}</div>
                          <div className="text-gray-500">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-green-600">{team.completedRequests}</div>
                          <div className="text-gray-500">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">
                            {formatNumber(team.avgResolutionTime, 1)}h
                          </div>
                          <div className="text-gray-500">Avg Time</div>
                        </div>
                      </div>
                      
                      {team.overdueRequests > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Badge variant="danger" size="sm">
                            {team.overdueRequests} overdue requests
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No team performance data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cost-analysis' && (
        <div className="space-y-6">
          {/* Equipment Utilization */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Equipment Utilization & Costs</h3>
            </div>
            <div className="card-body">
              {equipmentUtilization.length > 0 ? (
                <div className="space-y-4">
                  {equipmentUtilization.map((equipment) => (
                    <div key={equipment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{equipment.name}</h4>
                          <p className="text-sm text-gray-500">
                            {equipment.serial_number} • {equipment.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="success" size="sm">
                            {equipment.reliability}% reliable
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{equipment.totalRequests}</div>
                          <div className="text-gray-500">Requests</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-red-600">{equipment.correctiveRequests}</div>
                          <div className="text-gray-500">Corrective</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">{equipment.totalDowntime}h</div>
                          <div className="text-gray-500">Downtime</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(parseFloat(equipment.totalCost))}
                          </div>
                          <div className="text-gray-500">Cost</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No equipment utilization data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Cost Analysis by Category */}
          {costAnalysis?.costByCategory && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Cost Analysis by Category</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {costAnalysis.costByCategory.map((category: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 capitalize">
                          {category.category}
                        </h4>
                        <Badge variant="primary" size="sm">
                          {category.count} requests
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(category.cost)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Avg: {formatCurrency(category.cost / category.count)} per request
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Monthly Trends */}
          {costAnalysis?.monthlyCosts && costAnalysis.monthlyCosts.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Monthly Cost Trends</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {costAnalysis.monthlyCosts.map((month: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </h4>
                        <ArrowTrendingUpIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(month.cost)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {month.count} requests completed
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;