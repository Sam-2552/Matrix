import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data", "matrix.db"));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { name, email, password, role } = req.body;
  // if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
  const userRole = role || "user";
  const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "User already exists" });
  const passwordHash = await hash(password, 10);
  db.prepare("INSERT INTO users (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)")
    .run(randomUUID(), name, email, passwordHash, userRole);
  res.status(201).json({ success: true });
} 