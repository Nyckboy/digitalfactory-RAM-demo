import type { UserRole } from './auth';

// Generic interface for Spring Boot paginated responses
export interface PaginatedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isLast: boolean;
}

export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface ProjectDTO {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  createdAt: string;
  supervisor: UserDTO;
  interns: UserDTO[];
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';

export interface TaskDTO {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  deadline: string;
  projectId: string;
  assignedTo: UserDTO | null;
  submissionUrl?: string | null; 
}

export interface CommentDTO {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorRole: string; // 'SUPERVISOR' | 'INTERN'
}

export interface DashboardStats {
  activeProjects: number;
  teamMembers: number;
  tasksCompleted: number;
}

export interface ActivityLog {
  id: string;
  actorName: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface DashboardOverview {
  featuredProject: FeaturedProject | null;
  actionRequiredTasks: number;
}

export interface FeaturedProject {
  id: string;
  title: string;
  description: string;
  progressPercentage: number;
  teamMembers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
  }>;
}

export interface OngoingTask {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline: string;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TeamDirectoryIntern {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface TeamDirectoryProject {
  id: string;
  title: string;
  internCount: number;
  interns: TeamDirectoryIntern[];
}

export interface UrgentTask {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline: string;
  projectId: string;
}

export interface InternDashboardOverview {
  assignedTasks: number;
  completedDeliverables: number;
  upcomingDeadlines: number;
  urgentTasks: UrgentTask[];
}

export interface GenerateProjectPayload {
  prompt: string;
  supervisorId: string;
  internIds: string[];
}

export interface UpdateTaskPayload {
  title: string;
  description: string;
  status: string;
  deadline: string;
  assignedToId: string | null;
}

export interface AIDraftTask {
  title: string;
  description: string;
}

export interface AIDraftProject {
  title: string;
  description: string;
  tasks: AIDraftTask[];
}

export interface ConfirmAIProjectPayload {
  draft: AIDraftProject;
  supervisorId: string;
  internIds: string[];
}

export type ProjectStatus = ProjectDTO['status'];

export interface RegisterUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  supervisorId: string;
  internIds: string[];
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {
  status?: ProjectStatus;
}
