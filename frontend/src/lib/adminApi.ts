import { api } from './api';
import type { PaginatedResponse, UserDTO, ProjectDTO, DashboardStats, ActivityLog, AIDraftProject, ConfirmAIProjectPayload, RegisterUserPayload, CreateProjectPayload, UpdateProjectPayload } from '../types/api';

export const adminService = {
  // Fetch Users
  getUsers: async (page = 0, size = 10) => {
    const response = await api.get<PaginatedResponse<UserDTO>>(`/admin/users?page=${page}&size=${size}`);
    return response.data;
  },

  // Fetch Projects
  getProjects: async (page = 0, size = 10) => {
    const response = await api.get<PaginatedResponse<ProjectDTO>>(`/admin/projects?page=${page}&size=${size}`);
    return response.data;
  },

  // We will wire up the POST endpoints later when we build the forms
  registerUser: async (userData: RegisterUserPayload): Promise<UserDTO> => {
    const response = await api.post<UserDTO>('/admin/users/register', userData);
    return response.data;
  },

  createProject: async (projectData: CreateProjectPayload): Promise<ProjectDTO> => {
    const response = await api.post<ProjectDTO>('/admin/projects', projectData);
    return response.data;
  },

  updateUser: async (userId: string, userData: Partial<UserDTO>) => {
    const response = await api.put<UserDTO>(`/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    // We don't wrap this in a typed response because a 409 might be thrown
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  updateProject: async (projectId: string, projectData: UpdateProjectPayload) => {
    const response = await api.put<ProjectDTO>(`/admin/projects/${projectId}`, projectData);
    return response.data;
  },

  deleteProject: async (projectId: string) => {
    const response = await api.delete(`/admin/projects/${projectId}`);
    return response.data;
  },

  getStats: async (): Promise<DashboardStats> => {
  const response = await api.get('/admin/stats');
  return response.data;
  },

  getRecentActivities: async (limit: number = 5): Promise<ActivityLog[]> => {
  const response = await api.get(`/admin/activities?limit=${limit}`);
  return response.data;
  },

  generateProjectDraft: async (prompt: string): Promise<AIDraftProject> => {
    const response = await api.post('/admin/projects/ai/draft', { prompt });
    return response.data;
  },

  confirmAIProject: async (payload: ConfirmAIProjectPayload): Promise<ProjectDTO> => {
    const response = await api.post('/admin/projects/ai/confirm', payload);
    return response.data;
  },
};
