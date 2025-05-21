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
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AppContextType {
  actualUser: AppUser | null;
  currentUser: AppUser | null;
  currentRole: UserRole | null;
  agencies: Agency[];
  addAgency: (name: string) => Promise<void>;
  urls: UrlItem[];
  addUrl: (link: string, agencyId: string | null) => Promise<void>;
  users: AppUser[];
  addUser: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  tasks: Task[];
  assignTask: (taskData: Omit<Task, 'id' | 'status' | 'comments' | 'urlProgressDetails'>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateUrlProgress: (taskId: string, urlId: string, newStatus: UrlStatus, newProgressPercentage?: number) => Promise<void>;
  addTaskComment: (taskId: string, commentText: string) => Promise<void>;
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

        setUsers(usersData);
        setAgencies(agenciesData);
        setUrls(urlsData);
        setTasks(tasksData);
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
    if (status === "authenticated" && session?.user?.email && users.length > 0) {
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
        agencyId,
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
      const newTask: Task = {
        ...taskData,
        id: uuidv4(),
        status: 'pending',
        comments: [],
        urlProgressDetails: []
      };
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

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await db.updateTask(taskId, { status });
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
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
    taskId: string,
    urlId: string,
    newStatus: UrlStatus,
    newProgressPercentage?: number
  ) => {
    try {
      await db.updateUrlProgress(taskId, urlId, newStatus, newProgressPercentage);
      setTasks(prev => prev.map(task => {
        if (task.id !== taskId) return task;
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

  const addTaskComment = async (taskId: string, commentText: string) => {
    try {
      const comment: TaskComment = {
        id: uuidv4(),
        taskId,
        text: commentText,
        timestamp: Date.now()
      };
      await db.addTaskComment(taskId, comment);
      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, comments: [...task.comments, comment] }
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

  const value = {
    actualUser,
    currentUser,
    currentRole,
    agencies,
    addAgency,
    urls,
    addUrl,
    users,
    addUser,
    tasks,
    assignTask,
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
