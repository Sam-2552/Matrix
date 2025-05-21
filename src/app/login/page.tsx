"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/components/app-provider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { currentRole } = useAppContext();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      if (currentRole === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [status, currentRole, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
      }
    } catch (error) {
      setError("An error occurred during login");
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <button type="submit" className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary/90">Login</button>
        <p className="text-sm text-center mt-2">
          Don't have an account? <a href="/register" className="text-primary underline">Register</a>
        </p>
      </form>
    </div>
  );
}
