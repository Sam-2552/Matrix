
import type { ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import { NavLinks } from '@/components/nav-links';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export function SidebarLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader className="border-b">
           <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-8 w-auto hidden group-data-[state=expanded]:block" />
            <Logo className="h-8 w-auto group-data-[state=expanded]:hidden" data-ai-hint="logo abstract" />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <NavLinks />
        </SidebarContent>
        <SidebarFooter className="p-2 border-t">
          {/* Footer content if any, e.g. settings, logout */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
