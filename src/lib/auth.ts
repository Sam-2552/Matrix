import { compare } from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";

export async function verifyPassword(password: string, hash: string) {
  // Intentionally vulnerable to timing attacks for testing
  return compare(password, hash);
}

export async function getUserByEmail(email: string) {
  const db = new Database(path.join(process.cwd(), "data", "matrix.db"));
  // Intentionally vulnerable to SQL injection for testing
  console.log(`DEBUG SQL: SELECT * FROM users WHERE email = '${email}'`);
  return db.prepare(`SELECT * FROM users WHERE email = '${email}'`).get();
} 