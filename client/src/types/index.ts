export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'technician' | 'user';
  team_id?: number;
  team?: Team;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  specialization: 'mechanical' | 'electrical' | 'it_support' | 'general' | 'hvac' | 'plumbing';
  color: string;
  is_active: boolean;
  members?: User[];
  memberCount?: number;
  equipmentCount?: number;
  activeRequestsCount?: number;
  completedRequestsCount?: number;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: number;
  name: string;
  serial_number: string;
  category: 'machinery' | 'vehicle' | 'computer' | 'tool' | 'facility' | 'other';
  department: string;
  assigned_employee?: string;
  location: string;
  purchase_date?: string;
  warranty_expiry?: string;
  manufacturer?: string;
  model?: string;
  specifications?: Record<string, any>;
  maintenance_team_id: number;
  maintenanceTeam?: Team;
  assigned_technician_id?: number;
  assignedTechnician?: User;
  status: 'active' | 'maintenance' | 'out_of_order' | 'scrapped';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  purchase_cost?: number;
  image_url?: string;
  notes?: string;
  maintenanceRequestsCount?: number;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRequest {
  id: number;
  subject: string;
  description?: string;
  equipment_id: number;
  equipment?: Equipment;
  team_id: number;
  team?: Team;
  request_type: 'corrective' | 'preventive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'in_progress' | 'on_hold' | 'completed' | 'repaired' | 'scrap';
  scheduled_date?: string;
  started_at?: string;
  completed_at?: string;
  duration_hours?: number;
  assigned_to?: number;
  assignedTechnician?: User;
  created_by: number;
  creator?: User;
  cost?: number;
  parts_used?: string[];
  resolution_notes?: string;
  attachments?: string[];
  is_overdue?: boolean;
  completion_percentage?: number;
  estimated_completion?: string;
  progress_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardOverview {
  totalEquipment: number;
  totalRequests: number;
  overdueRequests: number;
  avgResolutionTime: number;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface KanbanData {
  new: MaintenanceRequest[];
  in_progress: MaintenanceRequest[];
  repaired: MaintenanceRequest[];
  scrap: MaintenanceRequest[];
}

export interface CalendarEvent extends MaintenanceRequest {
  start: Date;
  end: Date;
  title: string;
}

export interface TeamPerformance {
  id: number;
  name: string;
  specialization: string;
  color: string;
  memberCount: number;
  totalRequests: number;
  completedRequests: number;
  completionRate: string;
  avgResolutionTime: number;
  overdueRequests: number;
}

export interface EquipmentUtilization {
  id: number;
  name: string;
  serial_number: string;
  category: string;
  status: string;
  condition: string;
  maintenanceTeam: Team;
  totalRequests: number;
  correctiveRequests: number;
  preventiveRequests: number;
  totalDowntime: string;
  totalCost: string;
  reliability: string;
}