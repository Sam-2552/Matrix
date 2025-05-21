
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { currentUser, isLoading } = useAppContext(); // Added isLoading
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) { // Only attempt to redirect after initial data load attempt
      if (currentUser) {
        if (currentUser.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/dashboard');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [currentUser, isLoading, router]);

  // Show loader if isLoading is true, or if currentUser is null (which might happen briefly before redirect)
  if (isLoading || (!currentUser && typeof window !== 'undefined' && window.location.pathname === '/')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <p className="text-xl text-muted-foreground">Loading Matrix...</p>
      </div>
    );
  }

  // Fallback, though useEffect should handle redirection
  return null; 
}
