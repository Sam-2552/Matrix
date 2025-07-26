
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Agency, UrlItem, AppUser, Task, UserRole, TaskStatus, TaskComment, UrlStatus, UrlProgressDetail, Report, ReportStatus, Wave, ReportCategory, WaveStatus, WaveAssignment } from '@/types';
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  actualUser: AppUser | null;
  currentUser: AppUser | null;
  currentRole: UserRole | null;
  agencies: Agency[];
  addAgency: (name: string) => Promise<void>;
  urls: UrlItem[];
  addUrl: (link: string, agencyId: string | null) => Promise<void>;
  users: AppUser[];
  addUser: (name: string, username: string, password: string, role: UserRole) => Promise<void>;
  tasks: Task[];
  saveWaveAssignments: (waveId: string, waveDescription: string, assignments: Record<string, WaveAssignment>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateUrlProgress: (taskId: string, urlId: string, newStatus: UrlStatus, newProgressPercentage?: number) => Promise<void>;
  addTaskComment: (taskId: string, commentText: string) => Promise<void>;
  reports: Report[];
  saveReport: (data: Partial<Report> & { agencyId: string; waveId: string; sections: any[] }) => Promise<void>;
  waves: Wave[];
  addWave: (name: string, number: number, description: string) => Promise<string | undefined>;
  updateWaveStatus: (waveId: string, status: WaveStatus) => Promise<void>;
  reportCategories: ReportCategory[];
  addReportCategory: (name: string) => Promise<void>;
  deleteReportCategory: (categoryId: string) => Promise<void>;
  getUrlsForAgency: (agencyId: string) => UrlItem[];
  getTasksForUser: (userId: string) => Task[];
  getReportsForUser: (userId: string) => Report[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  impersonateUser: (targetUserId: string) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialUsersSeed: AppUser[] = [
  { id: 'admin1', name: 'Admin User', username: 'admin', password: 'password', role: 'admin' },
  { id: 'user1', name: 'Regular User 1', username: 'user1', password: 'password', role: 'user' },
  { id: 'user2', name: 'Regular User 2', username: 'user2', password: 'password', role: 'user' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [actualUser, setActualUser] = useState<AppUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [waves, setWaves] = useState<Wave[]>([]);
  const [reportCategories, setReportCategories] = useState<ReportCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

  const currentRole = currentUser?.role || null;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          usersRes,
          agenciesRes,
          urlsRes,
          tasksRes,
          reportsRes,
          wavesRes,
          reportCategoriesRes,
        ] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/agencies'),
          fetch('/api/urls'),
          fetch('/api/tasks'),
          fetch('/api/reports'),
          fetch('/api/waves'),
          fetch('/api/reportCategories'),
        ]);

        const usersData = await usersRes.json();
        setUsers(usersData.map((u: any) => ({ ...u, id: u._id.toString() })));

        const agenciesData = await agenciesRes.json();
        setAgencies(agenciesData.map((a: any) => ({ ...a, id: a._id.toString() })));

        const urlsData = await urlsRes.json();
        setUrls(urlsData.map((u: any) => ({ ...u, id: u._id.toString() })));

        const tasksData = await tasksRes.json();
        setTasks(tasksData.map((t: any) => ({ ...t, id: t._id.toString() })));

        const reportsData = await reportsRes.json();
        setReports(reportsData.map((r: any) => ({ ...r, id: r._id.toString() })));

        const wavesData = await wavesRes.json();
        setWaves(wavesData.map((w: any) => ({ ...w, id: w._id.toString() })));

        const reportCategoriesData = await reportCategoriesRes.json();
        setReportCategories(reportCategoriesData.map((rc: any) => ({ ...rc, id: rc._id.toString() })));

      } catch (error) {
        console.error("Error fetching data: ", error);
        toast({ title: "Error Fetching Data", description: "Could not fetch data from the database.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);


  const login = (username: string, password: string): boolean => {
    const userToLogin = users.find(u => u.username === username && u.password === password);
    if (userToLogin) {
      setActualUser(userToLogin);
      setCurrentUser(userToLogin);
      toast({ title: "Login Successful", description: `Welcome, ${userToLogin.name}!` });
      return true;
    }
    toast({ title: "Login Failed", description: "Invalid username or password.", variant: "destructive" });
    return false;
  };

  const logout = () => {
    setActualUser(null);
    setCurrentUser(null);
    toast({ title: "Logged Out", description: "You have been logged out." });
  };

  const impersonateUser = (targetUserId: string) => {
    if (actualUser?.role !== 'admin') {
      toast({ title: "Impersonation Failed", description: "Only admins can impersonate.", variant: "destructive" });
      return;
    }
    const targetUser = users.find(u => u.id === targetUserId);
    if (targetUser) {
      setCurrentUser(targetUser);
      if (targetUser.id === actualUser.id) {
        toast({ title: "Impersonation Stopped", description: `Viewing as ${actualUser.name} (Admin).`});
      } else {
        toast({ title: "Impersonation Started", description: `Now viewing as ${targetUser.name}.`});
      }
    } else {
      toast({ title: "Impersonation Failed", description: "Target user not found.", variant: "destructive" });
    }
  };

  const addAgency = async (name: string) => {
    try {
      await fetch('/api/agencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      toast({ title: "Agency Added", description: `Agency "${name}" has been added.` });
    } catch (error: any) {
      console.error("Error adding agency: ", error);
      toast({ title: "Error Adding Agency", description: error.message, variant: "destructive" });
    }
  };

  const addWave = async (name: string, number: number, description: string): Promise<string | undefined> => {
    try {
      const response = await fetch('/api/waves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, number, description }),
      });
      const result = await response.json();
      toast({ title: "Wave Added", description: `Wave "${name}" has been added as a draft.` });
      return result.insertedId.toString();
    } catch (error: any) {
      console.error("Error adding wave: ", error);
      toast({ title: "Error Adding Wave", description: error.message, variant: "destructive" });
    }
  };

  const updateWaveStatus = async (waveId: string, status: WaveStatus) => {
    try {
      await fetch(`/api/waves/${waveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      toast({ title: "Wave Updated", description: `Wave status changed to "${status}".` });
    } catch (error: any) {
      console.error("Error updating wave status: ", error);
      toast({ title: "Error Updating Wave", description: error.message, variant: "destructive" });
    }
  };

  const addReportCategory = async (name: string) => {
    try {
      await fetch('/api/reportCategories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      toast({ title: "Category Added", description: `Category "${name}" has been added.` });
    } catch (error: any) {
      console.error("Error adding category: ", error);
      toast({ title: "Error Adding Category", description: error.message, variant: "destructive" });
    }
  };

  const deleteReportCategory = async (categoryId: string) => {
    try {
      await fetch(`/api/reportCategories/${categoryId}`, {
        method: 'DELETE',
      });
      toast({ title: "Category Deleted", description: "The report category has been deleted." });
    } catch (error: any) {
      console.error("Error deleting category: ", error);
      toast({ title: "Error Deleting Category", description: error.message, variant: "destructive" });
    }
  };


  const addUrl = async (link: string, agencyId: string | null) => {
    try {
      await fetch('/api/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link, agencyId }),
      });
      toast({ title: "URL Added", description: `URL "${link}" has been added.` });
    } catch (error: any) {
      console.error("Error adding URL: ", error);
      toast({ title: "Error Adding URL", description: error.message, variant: "destructive" });
    }
  };

  const addUser = async (name: string, username: string, password: string, role: UserRole) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, username, password, role }),
      });
      if (response.status === 409) {
        toast({ title: "User Exists", description: `User with username "${username}" already exists.`, variant: "destructive" });
        return;
      }
      toast({ title: "User Added", description: `User "${name}" (${role}) has been added.` });
    } catch (error: any) {
      console.error("Error adding user: ", error);
      toast({ title: "Error Adding User", description: error.message, variant: "destructive" });
    }
  };

  const saveWaveAssignments = async (waveId: string, waveDescription: string, assignments: Record<string, WaveAssignment>) => {
    try {
      await fetch(`/api/waves/${waveId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ waveDescription, assignments }),
      });
      toast({ title: "Assignments Saved", description: "All assignments for this wave have been successfully saved." });
    } catch (error: any) {
      console.error("Error saving wave assignments: ", error);
      toast({ title: "Error Saving Assignments", description: error.message, variant: "destructive" });
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      toast({ title: "Task Updated", description: `Task status changed to "${status}".` });
    } catch (error: any) {
      console.error("Error updating task status: ", error);
      toast({ title: "Error Updating Task", description: error.message, variant: "destructive" });
    }
  };

  const updateUrlProgress = async (taskId: string, urlIdToUpdate: string, newStatus: UrlStatus, newProgressPercentage?: number) => {
    try {
      await fetch(`/api/tasks/${taskId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urlIdToUpdate, newStatus, newProgressPercentage }),
      });
    } catch (error: any) {
      console.error("Error updating URL progress: ", error);
      toast({ title: "Error Updating Progress", description: error.message, variant: "destructive" });
    }
  };

  const addTaskComment = async (taskId: string, commentText: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be viewing as a user to comment.", variant: "destructive" });
      return;
    }
    try {
      await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentText, userName: currentUser.name }),
      });
      toast({ title: "Comment Added", description: "Your comment has been added to the task." });
    } catch (error: any) {
      console.error("Error adding comment: ", error);
      toast({ title: "Error Adding Comment", description: error.message, variant: "destructive" });
    }
  };

  const saveReport = async (data: Partial<Report> & { agencyId: string; waveId: string; sections: any[] }) => {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to save a report.", variant: "destructive" });
      return;
    }

    const { id, agencyId, waveId, sections, status } = data;

    try {
      if (id) { // Update existing report
        await fetch(`/api/reports/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agencyId, waveId, sections, status }),
        });
        toast({ title: "Report Updated", description: "Your changes have been saved successfully." });
      } else { // Create new report
        await fetch('/api/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: currentUser.id, agencyId, waveId, sections, status }),
        });
        toast({ title: "Report Saved", description: "Your report has been created successfully." });
      }
    } catch (error: any) {
      console.error("Error saving report: ", error);
      toast({ title: "Error Saving Report", description: error.message, variant: "destructive" });
    }
  };
  
  const getUrlsForAgency = (agencyId: string) => {
    return urls.filter(url => url.agencyId === agencyId);
  };

  const getTasksForUser = (userId: string) => {
    return tasks.filter(task => task.userId === userId);
  };

  const getReportsForUser = (userId: string) => {
    return reports.filter(report => report.userId === userId);
  };


  return (
    <AppContext.Provider value={{ 
      actualUser, 
      currentUser, 
      currentRole,
      agencies, addAgency, 
      urls, addUrl, 
      users, addUser, 
      tasks, saveWaveAssignments, updateTaskStatus, updateUrlProgress, addTaskComment,
      reports, saveReport,
      waves, addWave, updateWaveStatus,
      reportCategories, addReportCategory, deleteReportCategory,
      getUrlsForAgency, getTasksForUser, getReportsForUser,
      login, logout, impersonateUser,
      isLoading
    }}>
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
