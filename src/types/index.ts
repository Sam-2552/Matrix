export type UserRole = 'admin' | 'user';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type UrlStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
}

export interface Agency {
  id: string;
  name: string;
}

export interface UrlItem {
  id: string;
  link: string;
  agencyId?: string;
  status: UrlStatus;
  pythonCode?: string;
  executionOutput?: string;
  isExecuting?: boolean;
}

export interface TaskComment {
  id: string;
  taskId: number;
  text: string;
  timestamp: number;
}

export interface UrlProgressDetail {
  id: string;
  taskId: number; // Changed from string to number
  urlId: string;
  status: UrlStatus;
  progressPercentage?: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  userId: string;
  assignedItemType: 'urls' | 'agency';
  assignedAgencyId?: string;
  assignedUrlIds?: string[];
  status: TaskStatus;
  comments?: TaskComment[];
  urlProgressDetails?: UrlProgressDetail[];
}
