

export interface Agency {
  id: string; // Firestore document ID
  name: string;
}

export interface UrlItem {
  id: string; // Firestore document ID
  link: string;
  agencyId: string | null; // Can be null if not assigned
}

export type UserRole = 'admin' | 'user';

export interface AppUser {
  id:string; // Firestore document ID / Can be pre-defined for seed
  name: string; // The user's full name for display
  username: string; // The username for logging in
  password?: string; // The user's password
  role: UserRole;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type UrlStatus = 'pending' | 'in-progress' | 'completed';

export interface TaskComment {
  id: string; // Could be a timestamp or unique string for client-side keying
  text: string;
  userName: string;
  date: string; // ISO date string
}

export interface UrlProgressDetail {
  urlId: string;
  status: UrlStatus;
  progressPercentage: number; // 0-100; relevant if status is 'in-progress', 100 if 'completed', 0 if 'pending'
}

// A "Task" is now the set of assignments for a single user within a single wave.
export interface Task {
  id: string; // Firestore document ID
  title: string; // e.g., "Wave 1: Q3 Security Review"
  description?: string; // Common description for the wave, copied from the Wave object
  userId: string; // The user this task bundle is for
  waveId: string; // The wave this task belongs to
  
  assignedAgencyIds: string[]; // List of agency IDs assigned to this user for this wave
  assignedUrlIds: string[]; // List of specific URL IDs assigned to this user for this wave
  
  urlProgressDetails: UrlProgressDetail[]; // Progress for every URL the user is responsible for in this wave
  status: TaskStatus; // Overall task status, derived from urlProgressDetails.
  comments: TaskComment[];
}

export type ReportStatus = 'draft' | 'submitted';
export type WaveStatus = 'draft' | 'published' | 'frozen';

// New Type for Waves
export interface Wave {
  id: string; // Firestore document ID
  name: string; // e.g., "Q1 Review"
  description?: string; // Common description for all tasks in this wave
  number: number;
  createdAt: string; // ISO date string
  status: WaveStatus;
}

// Helper type for the assignment UI
export interface WaveAssignment {
    assignedAgencyIds: string[];
    assignedUrlIds: string[];
}

// New Type for report categories/options
export interface ReportCategory {
  id: string;
  name: string;
}

// New Types for structured POC reporting
export interface PocStep {
  id: string;
  content: string; // Rich text content from Quill editor
}

export interface UrlPoc {
  urlId: string;
  steps: PocStep[];
  conclusion: string; // Rich text content from Quill editor
}

// Updated Report Section Type
export interface ReportSection {
  id: string; // unique identifier for the section
  category: string; 
  urlCount: number;
  selectedUrlIds: string[];
  urlPocs: UrlPoc[]; // Detailed POCs for each selected URL
}

// Updated Report Type
export interface Report {
  id: string; // Firestore document ID
  userId: string;
  agencyId: string;
  waveId: string;
  sections: ReportSection[];
  status: ReportStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
