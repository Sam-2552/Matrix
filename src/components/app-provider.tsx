
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, onSnapshot, setDoc, getDocs, query, where, writeBatch, getDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
    setIsLoading(true);
    const usersCollectionRef = collection(db, 'users');

    const initializeData = async () => {
      try {
        const initialSnapshot = await getDocs(usersCollectionRef);
        if (initialSnapshot.empty && initialUsersSeed.length > 0) {
          console.log("Users collection is empty, seeding initial users...");
          const batch = writeBatch(db);
          initialUsersSeed.forEach(user => {
            const userRef = doc(db, "users", user.id);
            batch.set(userRef, user);
          });
          await batch.commit();
        }
      } catch (error) {
        console.error("Error during user initialization/seeding: ", error);
        toast({ title: "Initialization Error", description: "Could not seed initial users.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();

    const createUnsubscriber = (collectionName: string, setter: React.Dispatch<React.SetStateAction<any[]>>, orderField?: string, orderDirection: 'asc' | 'desc' = 'desc') => {
      let q = query(collection(db, collectionName));
      if (orderField) {
        q = query(q, orderBy(orderField, orderDirection));
      }
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setter(data);
      }, (error) => {
        console.error(`Error fetching ${collectionName}: `, error);
        toast({ title: `Error fetching ${collectionName}`, description: error.message, variant: "destructive" });
      });
    };

    const unsubscribeUsers = createUnsubscriber('users', setUsers);
    const unsubscribeAgencies = createUnsubscriber('agencies', setAgencies, 'name', 'asc');
    const unsubscribeUrls = createUnsubscriber('urls', setUrls);
    const unsubscribeTasks = createUnsubscriber('tasks', setTasks);
    const unsubscribeReports = createUnsubscriber('reports', setReports, 'updatedAt');
    const unsubscribeWaves = createUnsubscriber('waves', setWaves, 'createdAt');
    const unsubscribeReportCategories = createUnsubscriber('reportCategories', setReportCategories, 'name', 'asc');

    return () => {
      unsubscribeUsers();
      unsubscribeAgencies();
      unsubscribeUrls();
      unsubscribeTasks();
      unsubscribeReports();
      unsubscribeWaves();
      unsubscribeReportCategories();
    };
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
      await addDoc(collection(db, 'agencies'), { name });
      toast({ title: "Agency Added", description: `Agency "${name}" has been added.` });
    } catch (error: any) {
      console.error("Error adding agency: ", error);
      toast({ title: "Error Adding Agency", description: error.message, variant: "destructive" });
    }
  };

  const addWave = async (name: string, number: number, description: string): Promise<string | undefined> => {
    try {
      const newWave = {
        name,
        number,
        description,
        createdAt: new Date().toISOString(),
        status: 'draft' as WaveStatus,
      };
      const docRef = await addDoc(collection(db, 'waves'), newWave);
      toast({ title: "Wave Added", description: `Wave "${name}" has been added as a draft.` });
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding wave: ", error);
      toast({ title: "Error Adding Wave", description: error.message, variant: "destructive" });
    }
  };

  const updateWaveStatus = async (waveId: string, status: WaveStatus) => {
    try {
        const waveRef = doc(db, 'waves', waveId);
        await updateDoc(waveRef, { status });
        toast({ title: "Wave Updated", description: `Wave status changed to "${status}".` });
    } catch (error: any) {
        console.error("Error updating wave status: ", error);
        toast({ title: "Error Updating Wave", description: error.message, variant: "destructive" });
    }
  };

  const addReportCategory = async (name: string) => {
    try {
      await addDoc(collection(db, 'reportCategories'), { name });
      toast({ title: "Category Added", description: `Category "${name}" has been added.` });
    } catch (error: any) {
      console.error("Error adding category: ", error);
      toast({ title: "Error Adding Category", description: error.message, variant: "destructive" });
    }
  };

  const deleteReportCategory = async (categoryId: string) => {
    try {
        await deleteDoc(doc(db, 'reportCategories', categoryId));
        toast({ title: "Category Deleted", description: "The report category has been deleted." });
    } catch (error: any) {
        console.error("Error deleting category: ", error);
        toast({ title: "Error Deleting Category", description: error.message, variant: "destructive" });
    }
  };


  const addUrl = async (link: string, agencyId: string | null) => {
    try {
      await addDoc(collection(db, 'urls'), { link, agencyId });
      toast({ title: "URL Added", description: `URL "${link}" has been added.` });
    } catch (error: any) {
      console.error("Error adding URL: ", error);
      toast({ title: "Error Adding URL", description: error.message, variant: "destructive" });
    }
  };

  const addUser = async (name: string, username: string, password: string, role: UserRole) => {
    try {
      const userQuery = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(userQuery);
      if (!querySnapshot.empty) {
          toast({ title: "User Exists", description: `User with username "${username}" already exists.`, variant: "destructive" });
          return;
      }
      const newUser: Omit<AppUser, 'id'> = { name, username, password, role };
      await addDoc(collection(db, 'users'), newUser);
      toast({ title: "User Added", description: `User "${name}" (${role}) has been added.` });
    } catch (error: any) {
      console.error("Error adding user: ", error);
      toast({ title: "Error Adding User", description: error.message, variant: "destructive" });
    }
  };

  const saveWaveAssignments = async (waveId: string, waveDescription: string, assignments: Record<string, WaveAssignment>) => {
    try {
        const batch = writeBatch(db);
        const wave = waves.find(w => w.id === waveId);
        if (!wave) throw new Error("Wave not found");

        if (wave.description !== waveDescription) {
            const waveRef = doc(db, 'waves', waveId);
            batch.update(waveRef, { description: waveDescription });
        }

        const userIdsWithAssignments = Object.keys(assignments);
        const existingTasksForWave = tasks.filter(t => t.waveId === waveId);

        for (const userId of userIdsWithAssignments) {
            const userAssignment = assignments[userId];
            if (!userAssignment) continue;
            
            const allAssignedUrlsForUser = new Set<string>(userAssignment.assignedUrlIds);
            userAssignment.assignedAgencyIds.forEach(agencyId => {
                urls.filter(u => u.agencyId === agencyId).forEach(u => allAssignedUrlsForUser.add(u.id));
            });
            const allUrlIds = Array.from(allAssignedUrlsForUser);

            const existingTask = existingTasksForWave.find(t => t.userId === userId);

            if (existingTask) {
                const taskRef = doc(db, 'tasks', existingTask.id);
                const newProgressDetails = allUrlIds.map(urlId => {
                    return existingTask.urlProgressDetails?.find(d => d.urlId === urlId) || { urlId, status: 'pending', progressPercentage: 0 };
                });

                batch.update(taskRef, {
                    title: `Wave ${wave.number}: ${wave.name}`,
                    description: waveDescription,
                    assignedAgencyIds: userAssignment.assignedAgencyIds,
                    assignedUrlIds: userAssignment.assignedUrlIds,
                    urlProgressDetails: newProgressDetails,
                });

            } else {
                const taskRef = doc(collection(db, 'tasks'));
                const urlProgressDetails = allUrlIds.map(urlId => ({
                    urlId, status: 'pending' as UrlStatus, progressPercentage: 0
                }));

                const newTask: Omit<Task, 'id'> = {
                    title: `Wave ${wave.number}: ${wave.name}`,
                    description: waveDescription,
                    userId,
                    waveId,
                    assignedAgencyIds: userAssignment.assignedAgencyIds,
                    assignedUrlIds: userAssignment.assignedUrlIds,
                    urlProgressDetails,
                    status: 'pending',
                    comments: [],
                };
                batch.set(taskRef, newTask);
            }
        }
        
        const userIdsWithoutAssignments = existingTasksForWave
            .filter(t => !userIdsWithAssignments.includes(t.userId))
            .map(t => t.id);

        for (const taskIdToDelete of userIdsWithoutAssignments) {
            batch.delete(doc(db, 'tasks', taskIdToDelete));
        }

        await batch.commit();
        toast({ title: "Assignments Saved", description: "All assignments for this wave have been successfully saved." });
    } catch (error: any) {
        console.error("Error saving wave assignments: ", error);
        toast({ title: "Error Saving Assignments", description: error.message, variant: "destructive" });
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status });
      toast({ title: "Task Updated", description: `Task status changed to "${status}".` });
    } catch (error: any) {
      console.error("Error updating task status: ", error);
      toast({ title: "Error Updating Task", description: error.message, variant: "destructive" });
    }
  };

  const updateUrlProgress = async (taskId: string, urlIdToUpdate: string, newStatus: UrlStatus, newProgressPercentage?: number) => {
    const taskRef = doc(db, 'tasks', taskId);
    try {
        const taskSnap = await getDoc(taskRef);
        if (!taskSnap.exists()) {
            throw new Error("Task not found");
        }

        const taskData = taskSnap.data() as Task;

        let allUrlsForTask = new Set<string>(taskData.assignedUrlIds || []);
        (taskData.assignedAgencyIds || []).forEach(agencyId => {
            urls.filter(u => u.agencyId === agencyId).forEach(u => allUrlsForTask.add(u.id));
        });

        let currentProgressDetails = taskData.urlProgressDetails || [];
        
        // Ensure all assigned URLs have a progress detail entry
        allUrlsForTask.forEach(urlId => {
            if (!currentProgressDetails.some(detail => detail.urlId === urlId)) {
                currentProgressDetails.push({ urlId: urlId, status: 'pending', progressPercentage: 0 });
            }
        });

        let detailToUpdate = currentProgressDetails.find(detail => detail.urlId === urlIdToUpdate);

        if (!detailToUpdate) {
            // This case should ideally not be hit if the above logic is sound, but as a fallback:
            detailToUpdate = { urlId: urlIdToUpdate, status: 'pending', progressPercentage: 0 };
            currentProgressDetails.push(detailToUpdate);
        }

        // Update the specific URL's progress
        detailToUpdate.status = newStatus;
        if (newProgressPercentage !== undefined) {
            detailToUpdate.progressPercentage = Math.max(0, Math.min(100, newProgressPercentage));
        }
        
        // Auto-adjust progress based on status
        if (newStatus === 'completed') detailToUpdate.progressPercentage = 100;
        if (newStatus === 'pending') detailToUpdate.progressPercentage = 0;
        if (newStatus === 'in-progress' && detailToUpdate.progressPercentage === 100) newStatus = 'completed';
        if (newStatus === 'in-progress' && detailToUpdate.progressPercentage === 0) newStatus = 'pending';


        // Recalculate overall task status
        let overallStatus: TaskStatus = 'pending';
        if (currentProgressDetails.length > 0) {
            const allCompleted = currentProgressDetails.every(d => d.status === 'completed');
            const anyInProgress = currentProgressDetails.some(d => d.status === 'in-progress');

            if (allCompleted) {
                overallStatus = 'completed';
            } else if (anyInProgress) {
                overallStatus = 'in-progress';
            } else {
                 // No items are 'in-progress'. If some are 'pending', the task is 'in-progress' overall.
                 const anyPending = currentProgressDetails.some(d => d.status === 'pending');
                 if(anyPending) {
                     overallStatus = 'in-progress'
                 }
            }
        }
        
        await updateDoc(taskRef, {
            urlProgressDetails: currentProgressDetails,
            status: overallStatus
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
    const newComment: TaskComment = {
      id: `comment-${Date.now()}`, 
      text: commentText,
      userName: currentUser.name,
      date: new Date().toISOString(),
    };
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      if (taskSnap.exists()) {
        const taskData = taskSnap.data() as Task;
        const updatedComments = [...(taskData.comments || []), newComment];
        await updateDoc(taskRef, { comments: updatedComments });
        toast({ title: "Comment Added", description: "Your comment has been added to the task." });
      } else {
        toast({ title: "Error", description: "Task not found.", variant: "destructive" });
      }
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
            const reportRef = doc(db, 'reports', id);
            await updateDoc(reportRef, {
                agencyId,
                waveId,
                sections,
                status,
                updatedAt: new Date().toISOString(),
            });
            toast({ title: "Report Updated", description: "Your changes have been saved successfully." });
        } else { // Create new report
            const newReport: Omit<Report, 'id'> = {
                userId: currentUser.id,
                agencyId,
                waveId,
                sections,
                status: status || 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await addDoc(collection(db, 'reports'), newReport);
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
