"use client";

import { useAppContext } from '@/components/app-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from 'lucide-react';

export function RoleSwitcher() {
  const { actualUser, currentUser, users, impersonateUser } = useAppContext();

  // This component should only be rendered if actualUser is an admin,
  // enforced by the Header component.
  if (actualUser?.role !== 'admin') {
    return null;
  }

  const handleImpersonationChange = (selectedUserId: string) => {
    impersonateUser(selectedUserId);
  };

  return (
    <div className="flex items-center space-x-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <Select 
          value={currentUser?.id || ''} 
          onValueChange={handleImpersonationChange}
      >
          <SelectTrigger className="w-[200px] h-8 text-xs">
          <SelectValue placeholder="Impersonate User..." />
          </SelectTrigger>
          <SelectContent>
          {/* Option to revert to self */}
          <SelectItem value={actualUser.id} >
            {actualUser.name} (Your Admin View)
          </SelectItem>
          {users.filter(u => u.id !== actualUser.id).map(user => (
              <SelectItem key={user.id} value={user.id}>{user.name} ({user.role})</SelectItem>
          ))}
          </SelectContent>
      </Select>
    </div>
  );
}
