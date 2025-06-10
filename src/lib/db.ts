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

export const updateTask = async (taskId: number, updates: Partial<Task>): Promise<void> => {
  // Get the current task data first
  const tasks = await getTasks();
  // t.id from getTasks() is already a number
  const currentTask = tasks.find(t => t.id === taskId);
  
  if (!currentTask) {
    throw new Error('Task not found');
  }

  // Merge the current task data with updates
  const updatedTask = {
    ...currentTask,
    ...updates,
    id: taskId // taskId is number, consistent with Task.id
  };

  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: 'updateTask', 
      data: updatedTask 
    })
  });
};

export async function updateUrlStatus(urlId: string, status: UrlStatus, pythonCode?: string) {
  const response = await fetch('/api/db', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'updateUrlStatus',
      data: {
        id: urlId,
        status,
        pythonCode: pythonCode || ''
      }
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update URL status');
  }

  return response.json();
}

export const addTaskComment = async (taskId: number, comment: TaskComment): Promise<void> => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // API expects taskId in the 'data' object to be a string for DB operations.
    // comment.taskId is number (from TaskComment interface).
    body: JSON.stringify({ action: 'addTaskComment', data: { ...comment, taskId: String(comment.taskId) } })
  });
};

export const updateUrlProgress = async (
  taskId: number, // Changed to number
  urlId: string,
  status: UrlStatus,
  progressPercentage?: number
): Promise<void> => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'updateUrlProgress',
      // API expects taskId as string in the body for now
      data: { taskId: String(taskId), urlId, status, progressPercentage }
    })
  });
};

export const deleteAgency = async (agencyId: string): Promise<void> => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deleteAgency', data: { id: agencyId } })
  });
};

export const deleteUrl = async (urlId: string): Promise<void> => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deleteUrl', data: { id: urlId } })
  });
};

export const deleteUser = async (userId: string): Promise<void> => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deleteUser', data: { id: userId } })
  });
};

export const deleteTask = async (taskId: number): Promise<void> => {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // API expects taskId as string in the body data for now
    body: JSON.stringify({ action: 'deleteTask', data: { id: String(taskId) } })
  });
};

export async function updateUrlExecutionOutput(urlId: string, executionOutput: string) {
  // For server-side requests, use absolute URL
  const isServer = typeof window === 'undefined';
  const baseUrl = isServer 
    ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002')
    : '';
  
  const response = await fetch(`${baseUrl}/api/db`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'updateUrlExecutionOutput',
      data: {
        id: urlId,
        executionOutput
      }
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update URL execution output');
  }

  return response.json();
} 