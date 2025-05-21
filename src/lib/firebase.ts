// Local storage implementation
import { Agency, UrlItem, AppUser, Task, TaskStatus, TaskComment, UrlStatus, UrlProgressDetail } from '@/types';

// Local storage keys
const STORAGE_KEYS = {
  USERS: 'matrix_users',
  AGENCIES: 'matrix_agencies',
  URLS: 'matrix_urls',
  TASKS: 'matrix_tasks',
};

// Helper functions for local storage
const getItem = <T>(key: string): T[] => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : [];
};

const setItem = <T>(key: string, value: T[]): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Data management functions
export const getUsers = (): AppUser[] => getItem<AppUser>(STORAGE_KEYS.USERS);
export const getAgencies = (): Agency[] => getItem<Agency>(STORAGE_KEYS.AGENCIES);
export const getUrls = (): UrlItem[] => getItem<UrlItem>(STORAGE_KEYS.URLS);
export const getTasks = (): Task[] => getItem<Task>(STORAGE_KEYS.TASKS);

export const addUser = (user: AppUser): void => {
  const users = getUsers();
  setItem(STORAGE_KEYS.USERS, [...users, user]);
};

export const addAgency = (agency: Agency): void => {
  const agencies = getAgencies();
  setItem(STORAGE_KEYS.AGENCIES, [...agencies, agency]);
};

export const addUrl = (url: UrlItem): void => {
  const urls = getUrls();
  setItem(STORAGE_KEYS.URLS, [...urls, url]);
};

export const addTask = (task: Task): void => {
  const tasks = getTasks();
  setItem(STORAGE_KEYS.TASKS, [...tasks, task]);
};

export const updateTask = (taskId: string, updates: Partial<Task>): void => {
  const tasks = getTasks();
  const updatedTasks = tasks.map(task => 
    task.id === taskId ? { ...task, ...updates } : task
  );
  setItem(STORAGE_KEYS.TASKS, updatedTasks);
};

export const updateUrlStatus = (urlId: string, status: UrlStatus): void => {
  const urls = getUrls();
  const updatedUrls = urls.map(url =>
    url.id === urlId ? { ...url, status } : url
  );
  setItem(STORAGE_KEYS.URLS, updatedUrls);
};

// Initialize with sample data if empty
export const initializeLocalStorage = () => {
  if (getUsers().length === 0) {
    setItem(STORAGE_KEYS.USERS, [
      { id: '1', name: 'Admin User', role: 'admin' },
      { id: '2', name: 'Regular User', role: 'user' }
    ]);
  }
  
  if (getAgencies().length === 0) {
    setItem(STORAGE_KEYS.AGENCIES, [
      { id: '1', name: 'Sample Agency' }
    ]);
  }
};
