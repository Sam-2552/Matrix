export type UserRole = 'admin' | 'user';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type UrlStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
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
}

export interface TaskComment {
  id: string;
  taskId: string;
  text: string;
  timestamp: number;
}

export interface UrlProgressDetail {
  id: string;
  taskId: string;
  urlId: string;
  status: UrlStatus;
  progressPercentage?: number;
}

export interface Task {
  id: string;
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
