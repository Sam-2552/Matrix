"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, Briefcase, Users, Link2, Tags, FileText, Download, GanttChartSquare
} from 'lucide-react';
import type { UserRole } from '@/types';
import { useAppContext } from './app-provider';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[]; // Roles that can see this link
}

const navItems: NavItem[] = [
  // Admin specific links (shown when currentRole is 'admin')
  { href: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/admin/agencies', label: 'Manage Agencies', icon: Briefcase, roles: ['admin'] },
  { href: '/admin/urls', label: 'Manage URLs', icon: Link2, roles: ['admin'] },
  { href: '/admin/users', label: 'Manage Users', icon: Users, roles: ['admin'] },
  { href: '/admin/tasks/assign', label: 'Assign Tasks', icon: GanttChartSquare, roles: ['admin'] },
  
  // User specific links (shown when currentRole is 'user')
  { href: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard, roles: ['user'] },
  { href: '/agencies', label: 'View Agencies', icon: Tags, roles: ['user'] },
  { href: '/urls', label: 'View My URLs', icon: Link2, roles: ['user'] },
  { href: '/tasks', label: 'My Tasks', icon: FileText, roles: ['user'] },
  
  // Common links (shown for both, if any, or handled by role filtering)
  // Example: A settings page accessible by both, if roles included ['admin', 'user']
  { href: '/download', label: 'Download Content', icon: Download, roles: ['user', 'admin'] }, // Made accessible to admin too for example
];

export function NavLinks() {
  const pathname = usePathname();
  const { currentRole } = useAppContext(); // currentRole reflects the role of currentUser (actual or impersonated)

  if (!currentRole) {
    return null; // Or some placeholder if needed when no user is logged in (though sidebar might be hidden)
  }

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <SidebarMenu>
      {filteredNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                tooltip={{ children: item.label, side: "right", align: "center"}}
              >
                <a>
                  <Icon />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
