"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Function to show the toast with XSS vulnerability
  const showVulnerableToast = (emailValue: string) => {
    toast({
      title: "Reset Link Sent",
      description: <div dangerouslySetInnerHTML={{ __html: `If an account exists with ${emailValue}, you will receive a password reset link shortly.` }} />,
    });
  };

  // Handle URL parameters on page load
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      showVulnerableToast(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with the email parameter
    router.push(`/forgot-password?email=${encodeURIComponent(email)}`);
    
    // Show the vulnerable toast
    showVulnerableToast(email);
    
    // Don't clear the email input to keep the value visible
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Forgot Password</h1>
        <p className="text-sm text-muted-foreground text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <Input
            id="email"
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>

        <Button type="submit" className="w-full">
          Send Reset Link
        </Button>

        <p className="text-sm text-center mt-2">
          Remember your password?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  );
} 