"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Agency, UrlItem, AppUser, Task, UserRole, TaskStatus, TaskComment, UrlStatus, UrlProgressDetail } from '@/types';
import * as db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { hash } from 'bcryptjs';
import { useSession } from "next-auth/react";

interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface AppContextType {
  actualUser: AppUser | null;
  currentUser: AppUser | null;
  currentRole: UserRole | null;
  agencies: Agency[];
  addAgency: (name: string) => Promise<void>;
  deleteAgency: (agencyId: string) => Promise<void>;
  urls: UrlItem[];
  addUrl: (link: string, agencyId: string | null) => Promise<void>;
  deleteUrl: (urlId: string) => Promise<void>;
  updateUrlStatus: (urlId: string, status: UrlStatus, pythonCode?: string, executionOutput?: string) => Promise<void>;
  users: AppUser[];
  addUser: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  tasks: Task[];
  assignTask: (taskData: Omit<Task, 'id' | 'status' | 'comments' | 'urlProgressDetails'>) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
  updateTaskStatus: (taskId: number, status: TaskStatus) => Promise<void>;
  updateUrlProgress: (taskId: number, urlId: string, newStatus: UrlStatus, newProgressPercentage?: number) => Promise<void>;
  addTaskComment: (taskId: number, commentText: string) => Promise<void>;
  getUrlsForAgency: (agencyId: string) => UrlItem[];
  getTasksForUser: (userId: string) => Task[];
  login: (userId: string) => boolean;
  logout: () => void;
  impersonateUser: (targetUserId: string) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [actualUser, setActualUser] = useState<AppUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { data: session, status } = useSession();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, agenciesData, urlsData, tasksData] = await Promise.all([
          db.getUsers(),
          db.getAgencies(),
          db.getUrls(),
          db.getTasks()
        ]);

        // Ensure usersData is an array
        setUsers(Array.isArray(usersData) ? usersData : []);
        setAgencies(Array.isArray(agenciesData) ? agenciesData : []);
        setUrls(Array.isArray(urlsData) ? urlsData : []);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error loading data',
          description: 'Failed to load application data',
          variant: 'destructive'
        });
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Sync session with user state
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      // If user data is not loaded yet, set role based on session email
      if (!Array.isArray(users) || users.length === 0) {
        const isAdmin = session.user.email === 'admin@example.com';
        const role = isAdmin ? 'admin' : 'user';
        setCurrentRole(role);
        // Create a temporary user object
        const tempUser: AppUser = {
          id: 'temp',
          name: session.user.name || 'User',
          email: session.user.email,
          role: role
        };
        setActualUser(tempUser);
        setCurrentUser(tempUser);
        return;
      }

      // Once user data is loaded, set the full user info
      const user = users.find(u => u.email === session.user?.email);
      if (user) {
        console.log('Setting user role:', user.role);
        setActualUser(user);
        setCurrentUser(user);
        setCurrentRole(user.role);
      }
    } else if (status === "unauthenticated") {
      setActualUser(null);
      setCurrentUser(null);
      setCurrentRole(null);
    }
  }, [status, session, users]);

  const addAgency = async (name: string) => {
    try {
      const newAgency: Agency = {
        id: uuidv4(),
        name
      };
      await db.addAgency(newAgency);
      setAgencies(prev => [...prev, newAgency]);
      toast({ title: 'Agency added successfully' });
    } catch (error) {
      console.error('Error adding agency:', error);
      toast({
        title: 'Error adding agency',
        description: 'Failed to add new agency',
        variant: 'destructive'
      });
    }
  };

  const addUrl = async (link: string, agencyId: string | null) => {
    try {
      const newUrl: UrlItem = {
        id: uuidv4(),
        link,
        agencyId: agencyId || undefined,
        status: 'pending'
      };
      await db.addUrl(newUrl);
      setUrls(prev => [...prev, newUrl]);
      toast({ title: 'URL added successfully' });
    } catch (error) {
      console.error('Error adding URL:', error);
      toast({
        title: 'Error adding URL',
        description: 'Failed to add new URL',
        variant: 'destructive'
      });
    }
  };

  const addUser = async (name: string, email: string, password: string, role: UserRole) => {
    try {
      const passwordHash = await hash(password, 10);
      const newUser = {
        id: uuidv4(),
        name,
        email,
        passwordHash,
        role
      };
      await db.addUser(newUser);
      setUsers(prev => [...prev, newUser]);
      toast({ title: 'User added successfully' });
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: 'Error adding user',
        description: 'Failed to add new user',
        variant: 'destructive'
      });
    }
  };

  const assignTask = async (taskData: Omit<Task, 'id' | 'status' | 'comments' | 'urlProgressDetails'>) => {
    try {
      // Generate new numeric ID
      let maxId = 0;
      tasks.forEach(task => {
        const numericId = Number(task.id); // Convert task.id to number
        if (!isNaN(numericId) && numericId > maxId) {
          maxId = numericId;
        }
      });
      const newTaskId = maxId + 1;

      const newTask: Task = {
        ...taskData,
        id: newTaskId, // Assign the new numeric ID
        status: 'pending',
        comments: [],
        urlProgressDetails: []
      };
      // db.addTask expects a Task object where id is a number.
      // The API layer (api/db/route.ts) will handle converting this number to a string if needed for DB insertion.
      await db.addTask(newTask);
      setTasks(prev => [...prev, newTask]);
      toast({ title: 'Task assigned successfully' });
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        title: 'Error assigning task',
        description: 'Failed to assign new task',
        variant: 'destructive'
      });
    }
  };

  const updateTaskStatus = async (taskId: number, status: TaskStatus) => {
    try {
      await db.updateTask(taskId, { status }); // db.updateTask now expects number
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task // task.id is number, taskId is number
      ));
      toast({ title: 'Task status updated' });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error updating task status',
        description: 'Failed to update task status',
        variant: 'destructive'
      });
    }
  };

  const updateUrlProgress = async (
    taskId: number, // Changed to number
    urlId: string,
    newStatus: UrlStatus,
    newProgressPercentage?: number
  ) => {
    try {
      await db.updateUrlProgress(taskId, urlId, newStatus, newProgressPercentage); // db.updateUrlProgress now expects number
      setTasks(prev => prev.map(task => {
        if (task.id !== taskId) return task; // task.id is number, taskId is number
        const updatedProgress = task.urlProgressDetails?.map(progress =>
          progress.urlId === urlId
            ? { ...progress, status: newStatus, progressPercentage: newProgressPercentage }
            : progress
        ) || [];
        return { ...task, urlProgressDetails: updatedProgress };
      }));
      toast({ title: 'URL progress updated' });
    } catch (error) {
      console.error('Error updating URL progress:', error);
      toast({
        title: 'Error updating URL progress',
        description: 'Failed to update URL progress',
        variant: 'destructive'
      });
    }
  };

  const addTaskComment = async (taskId: number, commentText: string) => {
    try {
      const comment: TaskComment = { // TaskComment.taskId is now number
        id: uuidv4(),
        taskId: taskId, // Assign number directly
        text: commentText,
        timestamp: Date.now()
      };
      // db.addTaskComment expects taskId as number, and comment object where comment.taskId is number
      await db.addTaskComment(taskId, comment);
      setTasks(prev => prev.map(task =>
        task.id === taskId // task.id is number, taskId is number
          // Ensure the comment object added to the state also has taskId as a number
          ? { ...task, comments: [...(task.comments || []), comment] }
          : task
      ));
      toast({ title: 'Comment added' });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error adding comment',
        description: 'Failed to add comment',
        variant: 'destructive'
      });
    }
  };

  const getUrlsForAgency = (agencyId: string) => {
    return urls.filter(url => url.agencyId === agencyId);
  };

  const getTasksForUser = (userId: string) => {
    // This comparison is fine, userId is string, task.userId is string
    return tasks.filter(task => task.userId === userId);
  };

  const login = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setActualUser(user);
      setCurrentUser(user);
      setCurrentRole(user.role);
      return true;
    }
    return false;
  };

  const logout = () => {
    setActualUser(null);
    setCurrentUser(null);
    setCurrentRole(null);
  };

  const impersonateUser = (targetUserId: string) => {
    const targetUser = users.find(u => u.id === targetUserId);
    if (targetUser) {
      setCurrentUser(targetUser);
      setCurrentRole(targetUser.role);
    }
  };

  const deleteAgency = async (agencyId: string) => {
    try {
      await db.deleteAgency(agencyId);
      setAgencies(prev => prev.filter(agency => agency.id !== agencyId));
      // Also remove associated URLs from state
      setUrls(prev => prev.filter(url => url.agencyId !== agencyId));
      toast({ title: 'Agency deleted successfully' });
    } catch (error) {
      console.error('Error deleting agency:', error);
      toast({
        title: 'Error deleting agency',
        description: 'Failed to delete agency',
        variant: 'destructive'
      });
    }
  };

  const deleteUrl = async (urlId: string) => {
    try {
      await db.deleteUrl(urlId);
      setUrls(prev => prev.filter(url => url.id !== urlId));
      toast({ title: 'URL deleted successfully' });
    } catch (error) {
      console.error('Error deleting URL:', error);
      toast({
        title: 'Error deleting URL',
        description: 'Failed to delete URL',
        variant: 'destructive'
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await db.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
      // Also remove associated tasks from state
      setTasks(prev => prev.filter(task => task.userId !== userId));
      toast({ title: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error deleting user',
        description: 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await db.deleteTask(taskId); // db.deleteTask now expects number
      setTasks(prev => prev.filter(task => task.id !== taskId)); // task.id is number, taskId is number
      toast({ title: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error deleting task',
        description: 'Failed to delete task',
        variant: 'destructive'
      });
    }
  };

  const updateUrlStatus = async (urlId: string, status: UrlStatus, pythonCode?: string, executionOutput?: string) => {
    try {
      await db.updateUrlStatus(urlId, status, pythonCode, executionOutput);
      setUrls(prev => prev.map(url =>
        url.id === urlId
          ? { ...url, status, pythonCode: pythonCode || url.pythonCode, executionOutput: executionOutput || url.executionOutput }
          : url
      ));
      toast({ title: 'URL status updated' });
    } catch (error) {
      console.error('Error updating URL status:', error);
      toast({
        title: 'Error updating URL status',
        description: 'Failed to update URL status',
        variant: 'destructive'
      });
    }
  };

  const value = {
    actualUser,
    currentUser,
    currentRole,
    agencies,
    addAgency,
    deleteAgency,
    urls,
    addUrl,
    deleteUrl,
    updateUrlStatus,
    users,
    addUser,
    deleteUser,
    tasks,
    assignTask,
    deleteTask,
    updateTaskStatus,
    updateUrlProgress,
    addTaskComment,
    getUrlsForAgency,
    getTasksForUser,
    login,
    logout,
    impersonateUser,
    isLoading
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
