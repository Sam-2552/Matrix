"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const { data: session } = useSession();

  const clearAllCookies = () => {
    // Get all cookies
    const cookies = document.cookie.split(';');
    
    // Clear each cookie with all possible combinations
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      const trimmedName = name.trim();
      
      // Clear with all possible combinations of attributes
      const cookieOptions = [
        'path=/',
        'path=/; domain=' + window.location.hostname,
        'path=/; domain=.' + window.location.hostname,
        'path=/; secure',
        'path=/; secure; samesite=strict',
        'path=/; secure; samesite=lax',
        'path=/; secure; samesite=none',
        'path=/; httponly',
        'path=/; secure; httponly',
        'path=/; secure; httponly; samesite=strict',
        'path=/; secure; httponly; samesite=lax',
        'path=/; secure; httponly; samesite=none'
      ];

      cookieOptions.forEach(options => {
        document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ${options}`;
      });
    });

    // Verify cookies are cleared
    const remainingCookies = document.cookie;
    if (remainingCookies) {
      console.warn('Some cookies could not be cleared:', remainingCookies);
    }
  };

  const handleLogout = async () => {
    try {
      // First sign out from next-auth
      await signOut({ 
        redirect: false,
        callbackUrl: '/login'
      });

      // Clear all cookies
      clearAllCookies();
      
      // Clear any stored data
      localStorage.clear();
      sessionStorage.clear();

      // Clear any remaining session data
      if (typeof window !== 'undefined') {
        // Clear any session-related data
        Object.keys(window).forEach(key => {
          if (key.startsWith('__NEXT_DATA__') || key.includes('session')) {
            delete window[key as keyof Window];
          }
        });
      }

      // Force a complete page reload and redirect
      window.location.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // If there's an error, still try to redirect to login
      window.location.replace('/login');
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleLogout}
      className="hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
} 