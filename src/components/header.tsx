"use client";

import { Logo } from '@/components/logo';
import { RoleSwitcher } from '@/components/role-switcher';
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAppContext } from './app-provider';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function Header() {
  const { actualUser, logout } = useAppContext();
  const router = useRouter();

  const handleLogout = async () => {
    // Clear app context state
    logout();
    
    // Clear any stored data
    localStorage.clear();

    // Sign out from next-auth
    await signOut({ 
      redirect: false,
      callbackUrl: '/login'
    });

    // Force a complete page reload and redirect
    window.location.replace('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 shadow-sm">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-6 w-auto" />
      </Link>
      <div className="ml-auto flex items-center gap-4">
        {actualUser?.role === 'admin' && <RoleSwitcher />}
        {actualUser && (
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        )}
      </div>
    </header>
  );
}
