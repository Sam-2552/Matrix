import { Agency, UrlItem, AppUser, Task, TaskStatus, TaskComment, UrlStatus, UrlProgressDetail } from '@/types';

// Data access functions
export const getUsers = async (): Promise<AppUser[]> => {
  const response = await fetch('/api/db?action=getUsers');
  return response.json();
};

export const getAgencies = async (): Promise<Agency[]> => {
  const response = await fetch('/api/db?action=getAgencies');
  return response.json();
};

export const getUrls = async (): Promise<UrlItem[]> => {
  const response = await fetch('/api/db?action=getUrls');
  return response.json();
};

export const getTasks = async (): Promise<Task[]> => {
  const response = await fetch('/api/db?action=getTasks');
  return response.json();
};

export const getUserByEmail = async (email: string) => {
  const response = await fetch(`/api/db?action=getUsers`);
  const users = await response.json();
  return users.find((u: any) => u.email === email) || null;
};

export const addUser = async ({ id, name, email, passwordHash, role }: { id: string, name: string, email: string, passwordHash: string, role?: string }) => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addUser', data: { id, name, email, passwordHash, role: role || 'user' } })
  });
};

export const addAgency = async (agency: Agency): Promise<void> => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addAgency', data: agency })
  });
};

export const addUrl = async (url: UrlItem): Promise<void> => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addUrl', data: url })
  });
};

export const addTask = async (task: Task): Promise<void> => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addTask', data: task })
  });
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateTask', data: { id: taskId, ...updates } })
  });
};

export const updateUrlStatus = async (urlId: string, status: UrlStatus): Promise<void> => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateUrlStatus', data: { id: urlId, status } })
  });
};

export const addTaskComment = async (taskId: string, comment: TaskComment): Promise<void> => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addTaskComment', data: { ...comment, taskId } })
  });
};

export const updateUrlProgress = async (
  taskId: string,
  urlId: string,
  status: UrlStatus,
  progressPercentage?: number
): Promise<void> => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'updateUrlProgress',
      data: { taskId, urlId, status, progressPercentage }
    })
  });
}; 