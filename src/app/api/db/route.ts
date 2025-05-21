import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Agency, UrlItem, AppUser, Task, TaskStatus, TaskComment, UrlStatus, UrlProgressDetail } from '@/types';

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
      name TEXT NOT NULL
    )
  `);

  // URLs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS urls (
      id TEXT PRIMARY KEY,
      link TEXT NOT NULL,
      agencyId TEXT,
      status TEXT NOT NULL,
      FOREIGN KEY (agencyId) REFERENCES agencies(id)
    )
  `);

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
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (assignedAgencyId) REFERENCES agencies(id)
    )
  `);

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

// API route handlers
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

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
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { action, data } = await request.json();

  try {
    switch (action) {
      case 'addUser':
        const role = data.role === 'admin' ? 'admin' : 'users';
        db.prepare('INSERT INTO users (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)')
          .run(data.id, data.name, data.email, data.passwordHash, role);
        return NextResponse.json({ success: true });
      case 'addAgency':
        db.prepare('INSERT INTO agencies (id, name) VALUES (?, ?)')
          .run(data.id, data.name);
        return NextResponse.json({ success: true });
      case 'addUrl':
        db.prepare('INSERT INTO urls (id, link, agencyId, status) VALUES (?, ?, ?, ?)')
          .run(data.id, data.link, data.agencyId, data.status);
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
        return NextResponse.json({ success: true });
      case 'updateUrlStatus':
        db.prepare('UPDATE urls SET status = ? WHERE id = ?')
          .run(data.status, data.id);
        return NextResponse.json({ success: true });
      case 'addTaskComment':
        db.prepare(`
          INSERT INTO task_comments (id, taskId, text, timestamp)
          VALUES (?, ?, ?, ?)
        `).run(data.id, data.taskId, data.text, data.timestamp);
        return NextResponse.json({ success: true });
      case 'updateUrlProgress':
        const progress = db.prepare(`
          SELECT * FROM url_progress_details 
          WHERE taskId = ? AND urlId = ?
        `).get(data.taskId, data.urlId) as UrlProgressDetail;
        if (progress) {
          db.prepare(`
            UPDATE url_progress_details 
            SET status = ?, progressPercentage = ?
            WHERE taskId = ? AND urlId = ?
          `).run(data.status, data.progressPercentage, data.taskId, data.urlId);
        } else {
          db.prepare(`
            INSERT INTO url_progress_details (id, taskId, urlId, status, progressPercentage)
            VALUES (?, ?, ?, ?, ?)
          `).run(
            data.id,
            data.taskId,
            data.urlId,
            data.status,
            data.progressPercentage
          );
        }
        return NextResponse.json({ success: true });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
} 