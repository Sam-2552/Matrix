import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword, getUserByEmail } from "@/lib/auth";
import type { NextAuthOptions, User } from "next-auth";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) throw new Error("Missing credentials");
        
        // Hardcoded admin and user accounts
        if (credentials.email === "admin@example.com" && credentials.password === "admin@password123") {
          return { 
            id: "admin-1", 
            name: "Admin User", 
            email: "admin@example.com", 
            role: "admin" 
          } as User & { role: string };
        }
        
        if (credentials.email === "user@example.com" && credentials.password === "password") {
          return { 
            id: "user-1", 
            name: "Regular User", 
            email: "user@example.com", 
            role: "user" 
          } as User & { role: string };
        }

        // Regular authentication flow for other users
        const user = await getUserByEmail(credentials.email);
        if (!user) throw new Error("No user found");
        const isValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) throw new Error("Invalid password");
        return { id: user.id, name: user.name, email: user.email, role: user.role } as User & { role: string };
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }: { token: any, user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  pages: {
    signIn: "/login"
  }
} as NextAuthOptions); 