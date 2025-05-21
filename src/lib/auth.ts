import { compare } from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";

export async function verifyPassword(password: string, hash: string) {
  return compare(password, hash);
}

export async function getUserByEmail(email: string) {
  const db = new Database(path.join(process.cwd(), "data", "matrix.db"));
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
} 