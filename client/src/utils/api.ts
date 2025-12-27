import axios, { AxiosResponse } from 'axios';
import { User, Team, Equipment, MaintenanceRequest, DashboardOverview, KanbanData, TeamPerformance, EquipmentUtilization } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔍 API Request:', config.method?.toUpperCase(), config.url);
    console.log('🔑 Token exists:', !!token);
    if (token) {
      // Remove quotes if token is stored with quotes
      const cleanToken = token.replace(/^"(.*)"$/, '$1');
      config.headers.Authorization = `Bearer ${cleanToken}`;
      console.log('🔑 Token added to request');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url, error.response?.data);
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('🔑 Token invalid, clearing storage and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API functions
export const apiGet = async <T>(url: string, params?: any): Promise<T> => {
  const response = await api.get(url, { params });
  return response.data;
};

export const apiPost = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.post(url, data);
  return response.data;
};

export const apiPut = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.put(url, data);
  return response.data;
};

export const apiPatch = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.patch(url, data);
  return response.data;
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await api.delete(url);
  return response.data;
};

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }): Promise<any> =>
    apiPost('/auth/login', credentials),
  
  register: (userData: any): Promise<any> =>
    apiPost('/auth/register', userData),
  
  getProfile: (): Promise<any> =>
    apiGet('/auth/profile'),
  
  updateProfile: (data: any): Promise<any> =>
    apiPut('/auth/profile', data),
  
  verifyToken: (): Promise<any> =>
    apiGet('/auth/verify'),
};

// Equipment API
export const equipmentAPI = {
  getAll: (params?: any): Promise<{ equipment: Equipment[] }> =>
    apiGet('/equipment', params),
  
  getById: (id: number): Promise<{ equipment: Equipment; maintenanceRequestsCount: number }> =>
    apiGet(`/equipment/${id}`),
  
  getMaintenanceRequests: (id: number, params?: any): Promise<{ requests: MaintenanceRequest[] }> =>
    apiGet(`/equipment/${id}/maintenance-requests`, params),
  
  create: (data: any): Promise<{ equipment: Equipment }> =>
    apiPost('/equipment', data),
  
  update: (id: number, data: any): Promise<{ equipment: Equipment }> =>
    apiPut(`/equipment/${id}`, data),
  
  delete: (id: number): Promise<{ message: string }> =>
    apiDelete(`/equipment/${id}`),
  
  getFilters: (): Promise<{ categories: string[]; departments: string[]; conditions: string[] }> =>
    apiGet('/equipment/meta/filters'),

  // Scrap equipment
  scrap: (id: number, reason?: string, notes?: string): Promise<{ message: string; equipment: Equipment }> =>
    apiPut(`/equipment/${id}/scrap`, { reason, notes }),
};

// Teams API
export const teamsAPI = {
  getAll: (params?: any): Promise<{ teams: Team[] }> =>
    apiGet('/teams', params),
  
  getById: (id: number): Promise<{ team: Team; stats: any }> =>
    apiGet(`/teams/${id}`),
  
  create: (data: any): Promise<{ team: Team }> =>
    apiPost('/teams', data),
  
  update: (id: number, data: any): Promise<{ team: Team }> =>
    apiPut(`/teams/${id}`, data),
  
  delete: (id: number): Promise<{ message: string }> =>
    apiDelete(`/teams/${id}`),
  
  addMember: (id: number, userId: number): Promise<{ team: Team }> =>
    apiPost(`/teams/${id}/members`, { user_id: userId }),
  
  removeMember: (id: number, userId: number): Promise<{ team: Team }> =>
    apiDelete(`/teams/${id}/members/${userId}`),
  
  getAvailableUsers: (): Promise<{ users: User[] }> =>
    apiGet('/teams/available-users'),
};

// Maintenance Requests API
export const requestsAPI = {
  getAll: (params?: any): Promise<{ requests: MaintenanceRequest[] }> =>
    apiGet('/requests', params),
  
  getById: (id: number): Promise<{ request: MaintenanceRequest }> =>
    apiGet(`/requests/${id}`),
  
  getKanban: (params?: any): Promise<{ kanban: KanbanData }> =>
    apiGet('/requests/kanban', params),
  
  getCalendar: (params?: any): Promise<{ events: MaintenanceRequest[] }> =>
    apiGet('/requests/calendar', params),
  
  create: (data: any): Promise<{ request: MaintenanceRequest }> =>
    apiPost('/requests', data),
  
  update: (id: number, data: any): Promise<{ request: MaintenanceRequest }> =>
    apiPut(`/requests/${id}`, data),
  
  updateStatus: (id: number, status: string): Promise<{ request: MaintenanceRequest }> =>
    apiPatch(`/requests/${id}/status`, { status }),
  
  assign: (id: number, assignedTo: number): Promise<{ request: MaintenanceRequest }> =>
    apiPatch(`/requests/${id}/assign`, { assigned_to: assignedTo }),
  
  delete: (id: number): Promise<{ message: string }> =>
    apiDelete(`/requests/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: (params?: any): Promise<{ 
    overview: DashboardOverview; 
    recentActivity: MaintenanceRequest[];
    equipmentByStatus: Record<string, number>;
    requestsByStatus: Record<string, number>;
    requestsByPriority: Record<string, number>;
    monthlyTrends: any[];
  }> =>
    apiGet('/dashboard/overview', params),
  
  getTeamPerformance: (params?: any): Promise<{ teamPerformance: TeamPerformance[] }> =>
    apiGet('/dashboard/team-performance', params),
  
  getEquipmentUtilization: (params?: any): Promise<{ equipmentUtilization: EquipmentUtilization[] }> =>
    apiGet('/dashboard/equipment-utilization', params),
  
  getCostAnalysis: (params?: any): Promise<any> =>
    apiGet('/dashboard/cost-analysis', params),
  
  getUpcomingMaintenance: (params?: any): Promise<{ upcomingMaintenance: MaintenanceRequest[] }> =>
    apiGet('/dashboard/upcoming-maintenance', params),
};

// Admin API
export const adminAPI = {
  // User Management
  getUsers: (params?: any): Promise<{ users: User[]; pagination: any }> =>
    apiGet('/admin/users', params),
  
  getUserById: (id: number): Promise<{ user: User }> =>
    apiGet(`/admin/users/${id}`),
  
  createUser: (data: any): Promise<{ user: User }> =>
    apiPost('/admin/users', data),
  
  updateUser: (id: number, data: any): Promise<{ user: User }> =>
    apiPut(`/admin/users/${id}`, data),
  
  deleteUser: (id: number): Promise<{ message: string }> =>
    apiDelete(`/admin/users/${id}`),
  
  resetUserPassword: (id: number, newPassword: string): Promise<{ message: string }> =>
    apiPost(`/admin/users/${id}/reset-password`, { new_password: newPassword }),
  
  // System Statistics
  getStats: (): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersByRole: any[];
    recentUsers: User[];
  }> =>
    apiGet('/admin/stats'),
  
  // System Settings
  getSettings: (): Promise<{ settings: any }> =>
    apiGet('/admin/settings'),
  
  updateSettings: (data: any): Promise<{ settings: any }> =>
    apiPut('/admin/settings', data),
};

// AI Assistant API
export const aiAssistantAPI = {
  // Check AI assistant status
  getStatus: (): Promise<{
    enabled: boolean;
    status: string;
    message: string;
  }> =>
    apiGet('/ai-assistant/status'),

  // Send message to AI assistant
  sendMessage: (message: string, context?: string): Promise<{
    success: boolean;
    response: string;
    timestamp: string;
  }> =>
    apiPost('/ai-assistant/chat', { message, context }),
  
  // Get AI suggestions for maintenance tasks
  getSuggestions: (equipmentType?: string, issue?: string, urgency?: string): Promise<{
    success: boolean;
    suggestions: string;
    timestamp: string;
  }> =>
    apiPost('/ai-assistant/suggestions', { equipmentType, issue, urgency }),
};

export default api;