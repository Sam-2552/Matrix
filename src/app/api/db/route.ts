import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Agency, UrlItem, AppUser, Task, TaskStatus, TaskComment, UrlStatus, UrlProgressDetail } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import type { Session } from 'next-auth';

// Define types for our database entities
interface DBUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DBTask {
  id: string;
  name: string;
  description?: string;
  userId: string;
}

interface DBUrl {
  id: string;
  url: string;
  description?: string;
  userId: string;
}

interface DBAgency {
  id: string;
  name: string;
  description?: string;
  userId: string;
  comments?: string; // Store as JSON string
}

interface DBComment {
  id: string;
  agencyId: string;
  comment: string;
  userId: string;
}

// Helper function to check if user has access to a resource
function hasAccess(user: DBUser | null, resource: { userId: string }) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'user' && resource.userId === user.id) return true;
  return false;
}

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'matrix.db'));

// Helper: check if a column exists in a table
function columnExists(table: string, column: string) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  return info.some((col: any) => col.name === column);
}

// Initialize database tables
const initializeDatabase = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);

  // Migration: add email and passwordHash columns if missing
  if (!columnExists('users', 'email')) {
    db.exec('ALTER TABLE users ADD COLUMN email TEXT UNIQUE');
  }
  if (!columnExists('users', 'passwordHash')) {
    db.exec('ALTER TABLE users ADD COLUMN passwordHash TEXT');
  }

  // Agencies table
  db.exec(`
    CREATE TABLE IF NOT EXISTS agencies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      comments TEXT
    )
  `);

  // Migration: add comments column if missing
  if (!columnExists('agencies', 'comments')) {
    db.exec('ALTER TABLE agencies ADD COLUMN comments TEXT');
  }

  // URLs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS urls (
      id TEXT PRIMARY KEY,
      link TEXT NOT NULL,
      agencyId TEXT,
      status TEXT NOT NULL,
      pythonCode TEXT,
      executionOutput TEXT,
      reportPath TEXT,
      FOREIGN KEY (agencyId) REFERENCES agencies(id)
    )
  `);

  // Migration: add pythonCode and executionOutput columns if missing
  if (!columnExists('urls', 'pythonCode')) {
    db.exec('ALTER TABLE urls ADD COLUMN pythonCode TEXT');
  }
  if (!columnExists('urls', 'executionOutput')) {
    db.exec('ALTER TABLE urls ADD COLUMN executionOutput TEXT');
  }
  // Migration: add reportPath column if missing
  if (!columnExists('urls', 'reportPath')) {
    db.exec('ALTER TABLE urls ADD COLUMN reportPath TEXT');
  }

  // Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      userId TEXT NOT NULL,
      assignedItemType TEXT NOT NULL,
      assignedAgencyId TEXT,
      status TEXT NOT NULL,
      reportPath TEXT DEFAULT NULL,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (assignedAgencyId) REFERENCES agencies(id)
    )
  `);

  // Force add reportPath column if it doesn't exist
  try {
    db.exec('ALTER TABLE tasks ADD COLUMN reportPath TEXT DEFAULT NULL');
  } catch (error: any) {
    // Ignore error if column already exists
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding reportPath column:', error);
    }
  }

  // Task Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_comments (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (taskId) REFERENCES tasks(id)
    )
  `);

  // URL Progress Details table
  db.exec(`
    CREATE TABLE IF NOT EXISTS url_progress_details (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      urlId TEXT NOT NULL,
      status TEXT NOT NULL,
      progressPercentage INTEGER,
      FOREIGN KEY (taskId) REFERENCES tasks(id),
      FOREIGN KEY (urlId) REFERENCES urls(id)
    )
  `);

  // Insert initial data if tables are empty
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)');
    insertUser.run('1', 'Admin User', 'admin@example.com', '', 'admin');
    insertUser.run('2', 'Regular User', 'user@example.com', '', 'user');
  }

  const agencyCount = (db.prepare('SELECT COUNT(*) as count FROM agencies').get() as { count: number }).count;
  if (agencyCount === 0) {
    const insertAgency = db.prepare('INSERT INTO agencies (id, name) VALUES (?, ?)');
    insertAgency.run('1', 'Sample Agency');
  }
};

// Initialize the database
initializeDatabase();

// Define access control rules for actions
const accessControl = {
  // Admin-only actions
  adminOnly: [
    'addUser',
    'deleteUser',
    'getUsers',
    'addAgency',
    'deleteAgency',
    'addUrl',
    'deleteUrl',
    'addTask',
    'deleteTask',
    'updateTask',
    'updateUrlStatus',
    'updateUrlExecutionOutput',
    'updateAgencyComments',
    'updateUrlReport'
  ],
  // Actions that require authentication but can be performed by any user
  authenticated: [
    'getUsers',
    'deleteAgency',
    'deleteTask',
    'deleteUrl',
    'deleteUser',
    'getAgencies',
    'getUrls',
    'getTasks',
    'getAgencyComments',
    'addTaskComment',
    'updateUrlProgress',
    'updateTask',
    'updateUrlStatus',
    'updateUrlExecutionOutput',
    'updateAgencyComments',
    'updateUrlReport'
  ]
};

// Helper function to check if an action is allowed
function isActionAllowed(action: string, user: DBUser | null, override: boolean = false): boolean {
  if (override) return true;
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (accessControl.authenticated.includes(action)) return true;
  return false;
}

// API route handlers
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const override = searchParams.get('override') === 'true';
  
  // Get the current session
  const session = await getServerSession(authOptions);
  const user = session?.user as DBUser | null;

  if (!action) {
    return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
  }

  // Check if the action is allowed
  if (!isActionAllowed(action, user, override)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    switch (action) {
      case 'getUsers':
        return NextResponse.json(db.prepare('SELECT * FROM users').all());
      case 'getAgencies':
        return NextResponse.json(db.prepare('SELECT * FROM agencies').all());
      case 'getUrls':
        return NextResponse.json(db.prepare('SELECT * FROM urls').all());
      case 'getTasks':
        const tasks = db.prepare('SELECT * FROM tasks').all() as Task[];
        const tasksWithDetails = tasks.map(task => {
          const comments = db.prepare('SELECT * FROM task_comments WHERE taskId = ?').all(task.id) as TaskComment[];
          const urlProgress = db.prepare('SELECT * FROM url_progress_details WHERE taskId = ?').all(task.id) as UrlProgressDetail[];
          return {
            ...task,
            comments,
            urlProgressDetails: urlProgress
          };
        });
        return NextResponse.json(tasksWithDetails);
      case 'getAgencyComments':
        const agencyId = searchParams.get('agencyId');
        if (!agencyId) {
          return NextResponse.json({ error: 'Missing agency ID' }, { status: 400 });
        }
        const agencyComments = db.prepare('SELECT comments FROM agencies WHERE id = ?').get(agencyId) as { comments: string | null };
        try {
          const comments = agencyComments?.comments ? JSON.parse(agencyComments.comments) : [];
          return NextResponse.json({ comments });
        } catch (error) {
          return NextResponse.json({ comments: [] });
        }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { action, data, override = false } = await request.json();
  
  // Get the current session
  const session = await getServerSession(authOptions);
  const user = session?.user as DBUser | null;

  if (!action) {
    return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
  }

  // Check if the action is allowed
  if (!isActionAllowed(action, user, override)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    switch (action) {
      case 'addUser':
        const role = data.role === 'admin' ? 'admin' : 'user';
        db.prepare('INSERT INTO users (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)')
          .run(data.id, data.name, data.email, data.passwordHash, role);
        return NextResponse.json({ success: true });
      case 'addAgency':
        db.prepare('INSERT INTO agencies (id, name) VALUES (?, ?)')
          .run(data.id, data.name);
        return NextResponse.json({ success: true });
      case 'addUrl':
        db.prepare('INSERT INTO urls (id, link, agencyId, status, pythonCode) VALUES (?, ?, ?, ?, ?)')
          .run(data.id, data.link, data.agencyId, data.status, data.pythonCode || '');
        return NextResponse.json({ success: true });
      case 'addTask':
        const insertTask = db.prepare(`
          INSERT INTO tasks (id, title, description, userId, assignedItemType, assignedAgencyId, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        insertTask.run(
          data.id,
          data.title,
          data.description,
          data.userId,
          data.assignedItemType,
          data.assignedAgencyId,
          data.status
        );
        if (data.comments?.length) {
          const insertComment = db.prepare(`
            INSERT INTO task_comments (id, taskId, text, timestamp)
            VALUES (?, ?, ?, ?)
          `);
          data.comments.forEach((comment: TaskComment) => {
            insertComment.run(comment.id, data.id, comment.text, comment.timestamp);
          });
        }
        if (data.urlProgressDetails?.length) {
          const insertProgress = db.prepare(`
            INSERT INTO url_progress_details (id, taskId, urlId, status, progressPercentage)
            VALUES (?, ?, ?, ?, ?)
          `);
          data.urlProgressDetails.forEach((progress: UrlProgressDetail) => {
            insertProgress.run(progress.id, data.id, progress.urlId, progress.status, progress.progressPercentage);
          });
        }
        return NextResponse.json({ success: true });
      case 'updateTask':
        // Update the main task
        db.prepare(`
          UPDATE tasks 
          SET title = ?, description = ?, userId = ?, assignedItemType = ?, 
              assignedAgencyId = ?, status = ?
          WHERE id = ?
        `).run(
          data.title,
          data.description,
          data.userId,
          data.assignedItemType,
          data.assignedAgencyId,
          data.status,
          data.id
        );

        // Update comments if provided
        if (data.comments) {
          // First, delete existing comments
          db.prepare('DELETE FROM task_comments WHERE taskId = ?').run(data.id);
          
          // Then insert new comments
          const insertComment = db.prepare(`
            INSERT INTO task_comments (id, taskId, text, timestamp)
            VALUES (?, ?, ?, ?)
          `);
          data.comments.forEach((comment: TaskComment) => {
            insertComment.run(comment.id, data.id, comment.text, comment.timestamp);
          });
        }

        // Update URL progress details if provided
        if (data.urlProgressDetails) {
          // First, delete existing progress details
          db.prepare('DELETE FROM url_progress_details WHERE taskId = ?').run(data.id);
          
          // Then insert new progress details
          const insertProgress = db.prepare(`
            INSERT INTO url_progress_details (id, taskId, urlId, status, progressPercentage)
            VALUES (?, ?, ?, ?, ?)
          `);
          data.urlProgressDetails.forEach((progress: UrlProgressDetail) => {
            insertProgress.run(
              progress.id,
              data.id,
              progress.urlId,
              progress.status,
              progress.progressPercentage
            );
          });
        }

        return NextResponse.json({ success: true });
      case 'updateUrlStatus':
        db.prepare('UPDATE urls SET status = ?, pythonCode = ?, executionOutput = ? WHERE id = ?')
          .run(data.status, data.pythonCode || '', data.executionOutput || '', data.id);
        return NextResponse.json({ success: true });
      case 'addTaskComment':
        db.prepare(`
          INSERT INTO task_comments (id, taskId, text, timestamp)
          VALUES (?, ?, ?, ?)
        `).run(data.id, data.taskId, data.text, data.timestamp);
        return NextResponse.json({ success: true });
      case 'updateUrlProgress':
        db.prepare(`
          INSERT OR REPLACE INTO url_progress_details (id, taskId, urlId, status, progressPercentage)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          data.id || crypto.randomUUID(),
          data.taskId,
          data.urlId,
          data.status,
          data.progressPercentage
        );
        return NextResponse.json({ success: true });
      case 'deleteAgency':
        // First delete associated URLs
        db.prepare('DELETE FROM urls WHERE agencyId = ?').run(data.id);
        // Then delete the agency
        db.prepare('DELETE FROM agencies WHERE id = ?').run(data.id);
        return NextResponse.json({ success: true });
      case 'deleteUrl':
        // Delete URL progress details first
        db.prepare('DELETE FROM url_progress_details WHERE urlId = ?').run(data.id);
        // Then delete the URL
        db.prepare('DELETE FROM urls WHERE id = ?').run(data.id);
        return NextResponse.json({ success: true });
      case 'deleteUser':
        // Delete user's tasks and associated data first
        const userTasks = db.prepare('SELECT id FROM tasks WHERE userId = ?').all(data.id) as { id: string }[];
        userTasks.forEach((task) => {
          db.prepare('DELETE FROM task_comments WHERE taskId = ?').run(task.id);
          db.prepare('DELETE FROM url_progress_details WHERE taskId = ?').run(task.id);
        });
        db.prepare('DELETE FROM tasks WHERE userId = ?').run(data.id);
        // Then delete the user
        db.prepare('DELETE FROM users WHERE id = ?').run(data.id);
        return NextResponse.json({ success: true });
      case 'deleteTask':
        // Delete task comments and progress details first
        db.prepare('DELETE FROM task_comments WHERE taskId = ?').run(data.id);
        db.prepare('DELETE FROM url_progress_details WHERE taskId = ?').run(data.id);
        // Then delete the task
        db.prepare('DELETE FROM tasks WHERE id = ?').run(data.id);
        return NextResponse.json({ success: true });
      case 'updateUrlExecutionOutput':
        const { id, executionOutput, status } = data;
        db.prepare('UPDATE urls SET executionOutput = ?, status = ? WHERE id = ?')
          .run(executionOutput, status, id);
        return NextResponse.json({ success: true });
      case 'updateAgencyComments':
        if (!data.agencyId || !data.comments) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        const commentsJson = JSON.stringify(data.comments);
        db.prepare('UPDATE agencies SET comments = ? WHERE id = ?').run(commentsJson, data.agencyId);
        return NextResponse.json({ success: true });
      case 'updateTaskReport':
        if (!data?.taskId || !data?.reportPath) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        try {
          db.prepare('UPDATE tasks SET reportPath = ? WHERE id = ?').run(data.reportPath, data.taskId);
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('Error updating task report:', error);
          return NextResponse.json({ error: 'Failed to update task report' }, { status: 500 });
        }
      case 'updateUrlReport':
        if (!data?.id || !data?.reportPath) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        try {
          db.prepare('UPDATE urls SET reportPath = ? WHERE id = ?').run(data.reportPath, data.id);
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('Error updating URL report:', error);
          return NextResponse.json({ error: 'Failed to update URL report' }, { status: 500 });
        }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}